const assert = require("node:assert/strict");

const {
  buildRequest: buildAdOrderRequest,
  extractMetrics: extractAdOrderMetrics,
} = require("../src/lib/api/ad-order");

module.exports = [
  {
    name: "buildAdOrderRequest targets optionDetail tradeProductRank with current report date",
    fn() {
      const req = buildAdOrderRequest({
        overviewUrl:
          "https://e.dianping.com/mda/v5/overview?yodaReady=h5&csecplatform=4&csecversion=4.2.0&mtgsig=abc123&pageType=v5Home",
        cookieHeader: "token=abc",
        datePreset: "yesterday",
        now: new Date("2026-05-20T12:00:00+08:00"),
        request: {
          method: "POST",
          postData:
            "source=1&device=pc&date=2026-05-07%2C2026-05-07&platform=0" +
            "&pageType=v5Overview&optionType=v5Overview&shopIds=1500702739" +
            "&excludeShopIds=&cityId=&prdIds=&spuId=&pageNum=&pageSize=&sign=&fromPage=&storeKey=231429497",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "x-custom": "keep",
            cookie: "old=cookie",
          },
        },
      });

      assert.equal(
        req.url,
        "https://e.dianping.com/mda/v5/optionDetail?yodaReady=h5&csecplatform=4&csecversion=4.2.0&mtgsig=abc123&pageType=v5Home"
      );
      assert.equal(req.options.method, "POST");
      assert.equal(req.options.headers.cookie, "token=abc");
      assert.equal(req.options.headers["x-custom"], "keep");

      const body = new URLSearchParams(req.options.body);
      assert.equal(body.get("pageType"), "v5Trade");
      assert.equal(body.get("optionType"), "tradeProductRank");
      assert.equal(body.get("prdIds"), "1");
      assert.equal(body.get("typeIds"), "6");
      assert.equal(body.get("sortTypeId"), "6");
      assert.equal(body.get("shopIds"), "1500702739");
      assert.equal(body.get("date"), "2026-05-19,2026-05-19");
    },
  },
  {
    name: "buildAdOrderRequest supports recent7 preset date range",
    fn() {
      const req = buildAdOrderRequest({
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
          headers: {},
        },
      });

      const body = new URLSearchParams(req.options.body);
      assert.equal(body.get("date"), "2026-05-13,2026-05-19");
    },
  },
  {
    name: "extractAdOrderMetrics picks buy_cnt from the highest priced product in 团购 tab",
    fn() {
      const metrics = extractAdOrderMetrics({
        type: "component",
        code: 0,
        success: true,
        data: [
          {
            componentId: "tradeProductTable",
            body: {
              tr: [
                {
                  spu_name: "A",
                  sale_price: "598.0",
                  buy_cnt: "10",
                },
                {
                  spu_name: "B",
                  sale_price: "338.0",
                  buy_cnt: "9",
                },
                {
                  spu_name: "C",
                  sale_price: "458.0",
                  buy_cnt: "2",
                },
              ],
            },
          },
        ],
      });

      assert.deepEqual(metrics, {
        "广告单": {
          label: "广告单",
          value: "10",
        },
      });
    },
  },
  {
    name: "extractAdOrderMetrics tolerates missing rows or invalid prices",
    fn() {
      assert.deepEqual(extractAdOrderMetrics(null), {});
      assert.deepEqual(extractAdOrderMetrics({ code: 0, data: [] }), {});
      assert.deepEqual(
        extractAdOrderMetrics({
          code: 0,
          data: [{ componentId: "tradeProductTable", body: { tr: [{ sale_price: "--" }] } }],
        }),
        {}
      );
    },
  },
];
