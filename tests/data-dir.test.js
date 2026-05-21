const assert = require("node:assert/strict");
const path = require("node:path");

function loadFreshDataDir() {
  delete require.cache[require.resolve("../src/lib/data-dir")];
  return require("../src/lib/data-dir");
}

module.exports = [
  {
    name: "getBaseDataDir defaults to the project data directory",
    fn() {
      const previous = process.env.JINGYINGBAO_DATA_DIR;
      delete process.env.JINGYINGBAO_DATA_DIR;

      try {
        const { getBaseDataDir } = loadFreshDataDir();

        assert.equal(
          getBaseDataDir(),
          path.resolve(__dirname, "..", "data")
        );
      } finally {
        if (previous === undefined) {
          delete process.env.JINGYINGBAO_DATA_DIR;
        } else {
          process.env.JINGYINGBAO_DATA_DIR = previous;
        }
      }
    },
  },
  {
    name: "getBaseDataDir honors an explicit environment override",
    fn() {
      const previous = process.env.JINGYINGBAO_DATA_DIR;
      process.env.JINGYINGBAO_DATA_DIR = path.join("tmp", "desktop-data");

      try {
        const { getBaseDataDir } = loadFreshDataDir();

        assert.equal(
          getBaseDataDir(),
          path.resolve("tmp", "desktop-data")
        );
      } finally {
        if (previous === undefined) {
          delete process.env.JINGYINGBAO_DATA_DIR;
        } else {
          process.env.JINGYINGBAO_DATA_DIR = previous;
        }
      }
    },
  },
  {
    name: "setBaseDataDirForProcess updates the runtime data directory",
    fn() {
      const previous = process.env.JINGYINGBAO_DATA_DIR;
      delete process.env.JINGYINGBAO_DATA_DIR;

      try {
        const { getBaseDataDir, setBaseDataDirForProcess } = loadFreshDataDir();
        setBaseDataDirForProcess(path.join("tmp", "electron-user-data", "data"));

        assert.equal(
          getBaseDataDir(),
          path.resolve("tmp", "electron-user-data", "data")
        );
      } finally {
        if (previous === undefined) {
          delete process.env.JINGYINGBAO_DATA_DIR;
        } else {
          process.env.JINGYINGBAO_DATA_DIR = previous;
        }
      }
    },
  },
];
