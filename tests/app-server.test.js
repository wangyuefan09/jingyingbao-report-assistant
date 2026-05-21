const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const APP_PATH = path.join(__dirname, "..", "src", "app.js");

function runRequireAppChild() {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["-e", `require(${JSON.stringify(APP_PATH)}); console.log("after require");`],
      { cwd: path.join(__dirname, "..") }
    );
    let output = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ exited: false, output });
    }, 500);

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("exit", () => {
      clearTimeout(timer);
      resolve({ exited: true, output });
    });
  });
}

module.exports = [
  {
    name: "requiring app.js does not start the HTTP server",
    async fn() {
      const result = await runRequireAppChild();

      assert.equal(result.exited, true);
      assert.match(result.output, /after require/);
      assert.doesNotMatch(result.output, /listening on/);
    },
  },
  {
    name: "startServer listens on an assigned loopback port and can close",
    async fn() {
      const { startServer } = require("../src/app");

      assert.equal(typeof startServer, "function");

      const running = await startServer({ port: 0, host: "127.0.0.1" });

      try {
        assert.ok(running.port > 0);
        assert.equal(running.host, "127.0.0.1");
        assert.equal(running.url, `http://127.0.0.1:${running.port}`);
      } finally {
        await running.close();
      }
    },
  },
];
