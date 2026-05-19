const assert = require("node:assert/strict");

const { buildRequest, extractMetrics } = require("../src/lib/api/trade");

module.exports = [
  {
    name: "buildTradeRequest replaces overview URL with trade endpoint and updates postData",
    fn() {
      const req = buildRequest({
        overviewUrl:
          "https://e.dianping.com/mda/v5/overview?yodaReady=h5&csecplatform=4",
        cookieHeader: "token=abc",
        request: {
          method: "POST",
          postData:
            "source=1&device=pc&date=2026-05-07%2C2026-05-07&platform=0" +
            "&pageType=v5Overview&optionType=v5Overview&shopIds=1500702739" +
            "&storeKey=231429497",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "x-custom": "keep",
            cookie: "old=cookie",
          },
        },
      });

      assert.equal(
        req.url,
        "https://e.dianping.com/mda/v5/trade?yodaReady=h5&csecplatform=4"
      );
      assert.equal(req.options.method, "POST");
      assert.equal(req.options.headers.cookie, "token=abc");
      assert.equal(req.options.headers["x-custom"], "keep");

      const body = new URLSearchParams(req.options.body);
      assert.equal(body.get("pageType"), "v5Trade");
      assert.equal(body.get("optionType"), "v5Trade");
      assert.equal(
        body.get("prdIds"),
        "1,2,3,4,5,6,11,12,13,14,15,16,17,18,19,20"
      );
      assert.equal(body.get("shopIds"), "1500702739");
      assert.equal(body.get("storeKey"), "231429497");
      assert.equal(body.get("date"), "2026-05-07,2026-05-07");
    },
  },
  {
    name: "buildTradeRequest supports recent7 preset",
    fn() {
      const req = buildRequest({
        overviewUrl:
          "https://e.dianping.com/mda/v5/overview?yodaReady=h5&csecplatform=4",
        cookieHeader: "token=abc",
        datePreset: "recent7",
        now: new Date("2026-05-19T12:00:00+08:00"),
        request: {
          method: "POST",
          postData:
            "source=1&device=pc&date=2026-05-07%2C2026-05-07&platform=0" +
            "&pageType=v5Overview&optionType=v5Overview&shopIds=1500702739" +
            "&storeKey=231429497",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        },
      });

      const body = new URLSearchParams(req.options.body);
      assert.equal(body.get("date"), "2026-05-13,2026-05-19");
    },
  },
  {
    name: "extractTradeMetrics finds 下单/核销 amounts from nested component body",
    fn() {
      const metrics = extractMetrics({
        code: 0,
        data: [
          {
            componentId: "tradeStatistics",
            body: [
              { name: "下单人数", value: "13" },
              { name: "下单券数", value: "16" },
              { name: "下单金额（原价）", value: "¥7,628元" },
              { name: "核销人数", value: "14" },
              { name: "核销金额（原价）", value: "6352" },
              { name: "核销金额", value: "3817" },
            ],
          },
        ],
      });

      assert.deepEqual(metrics["下单金额（原价）"], {
        label: "下单金额（原价）",
        value: "7,628",
      });
      assert.deepEqual(metrics["核销金额（原价）"], {
        label: "核销金额（原价）",
        value: "6,352",
      });
      assert.deepEqual(metrics["核销金额"], {
        label: "核销金额",
        value: "3,817",
      });
      assert.equal(metrics["下单人数"], undefined);
    },
  },
  {
    name: "extractTradeMetrics tolerates missing data or non-matching response",
    fn() {
      assert.deepEqual(extractMetrics(null), {});
      assert.deepEqual(extractMetrics({ code: 0 }), {});
      assert.deepEqual(extractMetrics({ code: 0, data: [] }), {});
    },
  },
];
