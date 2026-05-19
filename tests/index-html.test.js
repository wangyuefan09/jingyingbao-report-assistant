const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const INDEX_HTML_PATH = path.join(__dirname, "..", "public", "index.html");

module.exports = [
  {
    name: "index page no longer renders the raw capture JSON details block",
    fn() {
      const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");

      assert.ok(!html.includes("查看最近一次抓取返回的 JSON"));
      assert.ok(!html.includes('id="debugOutput"'));
    },
  },
];
