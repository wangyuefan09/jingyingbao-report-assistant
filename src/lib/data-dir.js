const path = require("node:path");

let runtimeBaseDataDir = null;

function getDefaultBaseDataDir() {
  return path.join(__dirname, "..", "..", "data");
}

function getBaseDataDir() {
  return path.resolve(
    runtimeBaseDataDir ||
      process.env.JINGYINGBAO_DATA_DIR ||
      getDefaultBaseDataDir()
  );
}

function setBaseDataDirForProcess(dataDir) {
  if (!dataDir) {
    throw new Error("dataDir is required");
  }
  runtimeBaseDataDir = path.resolve(dataDir);
  process.env.JINGYINGBAO_DATA_DIR = runtimeBaseDataDir;
}

module.exports = {
  getBaseDataDir,
  setBaseDataDirForProcess,
};
