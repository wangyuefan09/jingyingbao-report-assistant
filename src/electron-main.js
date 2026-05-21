const path = require("node:path");

const { app, BrowserWindow, dialog, shell } = require("electron");

const { startServer } = require("./app");
const { setBaseDataDirForProcess } = require("./lib/data-dir");

let mainWindow = null;
let runningServer = null;

function getDesktopDataDir() {
  return path.join(app.getPath("userData"), "data");
}

async function ensureServer() {
  if (runningServer) {
    return runningServer;
  }

  setBaseDataDirForProcess(getDesktopDataDir());
  runningServer = await startServer({ port: 0, host: "127.0.0.1" });
  return runningServer;
}

async function createMainWindow() {
  const localServer = await ensureServer();

  mainWindow = new BrowserWindow({
    width: 1120,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    title: "Jingyingbao Helper",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(localServer.url);
}

async function closeRunningServer() {
  if (!runningServer) {
    return;
  }

  const serverToClose = runningServer;
  runningServer = null;
  await serverToClose.close();
}

app.whenReady().then(createMainWindow).catch((error) => {
  dialog.showErrorBox(
    "Startup failed",
    error && error.stack ? error.stack : String(error)
  );
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow().catch((error) => {
      dialog.showErrorBox(
        "Startup failed",
        error && error.stack ? error.stack : String(error)
      );
    });
  }
});

app.on("before-quit", () => {
  closeRunningServer().catch((error) => {
    console.error("[electron] failed to close local server:", error);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
