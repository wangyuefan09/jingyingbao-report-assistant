const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

module.exports = [
  {
    name: "package.json defines Electron desktop entrypoints and packaging scripts",
    fn() {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
      );

      assert.equal(pkg.main, "src/electron-main.js");
      assert.equal(pkg.scripts.desktop, "electron .");
      assert.equal(pkg.scripts["dist:win"], "electron-builder --win --x64");
      assert.equal(
        pkg.scripts["dist:mac:arm64"],
        "electron-builder --mac --arm64"
      );
      assert.equal(
        pkg.build.nsis.artifactName,
        "jingyingbao-helper-setup-${version}-${arch}.${ext}"
      );
      assert.equal(
        pkg.build.portable.artifactName,
        "jingyingbao-helper-portable-${version}-${arch}.${ext}"
      );
    },
  },
  {
    name: "Electron main process file is present",
    fn() {
      assert.equal(
        fs.existsSync(path.join(ROOT, "src", "electron-main.js")),
        true
      );
    },
  },
  {
    name: "Electron main process reuses the local server between windows",
    fn() {
      const source = fs.readFileSync(
        path.join(ROOT, "src", "electron-main.js"),
        "utf8"
      );

      assert.match(source, /async function ensureServer/);
      assert.match(source, /if \(!runningServer\)/);
    },
  },
];
