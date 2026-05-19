const assert = require("node:assert/strict");

const { buildCaptureResult } = require("../src/lib/capture-result");

module.exports = [
  {
    name: "buildCaptureResult returns a stable summary for the captured overview payload",
    fn() {
      const result = buildCaptureResult({
        overviewUrl: "https://e.dianping.com/mda/v5/overview",
        cookies: [
          { name: "foo", value: "bar" },
          { name: "hello", value: "world" },
        ],
        overviewJson: {
          code: 200,
          message: "ok",
          data: {
            shopIds: ["1500702739"],
            dateRange: ["2026-04-30", "2026-05-06"],
          },
        },
      });

      assert.deepEqual(result.summary, {
        cookieCount: 2,
        cookieNames: ["foo", "hello"],
        overviewUrl: "https://e.dianping.com/mda/v5/overview",
        topLevelKeys: ["code", "message", "data"],
      });
      assert.equal(result.cookieHeader, "foo=bar; hello=world");
      assert.equal(result.raw.data.shopIds[0], "1500702739");
    },
  },
];
