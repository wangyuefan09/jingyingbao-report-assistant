const assert = require("node:assert/strict");

const {
  diffProcessIds,
  parseTasklistProcessIds,
} = require("../src/browser-flow");

module.exports = [
  {
    name: "parseTasklistProcessIds reads chrome process ids from CSV tasklist output",
    fn() {
      const output = [
        '"chrome.exe","1234","Console","1","88,000 K"',
        '"notepad.exe","5678","Console","1","12,000 K"',
        '"chrome.exe","9012","Console","1","90,000 K"',
      ].join("\r\n");

      assert.deepEqual(parseTasklistProcessIds(output, "chrome.exe"), [1234, 9012]);
    },
  },
  {
    name: "diffProcessIds returns only processes created after the snapshot",
    fn() {
      assert.deepEqual(diffProcessIds([10, 20, 30], [20, 30, 40, 50]), [40, 50]);
    },
  },
];
