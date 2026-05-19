const assert = require("node:assert/strict");

const {
  buildRequest: buildPromoCodeKpiRequest,
  extractMetrics: extractPromoCodeKpiMetrics,
} = require("../src/lib/api/promo-code-kpi");

module.exports = [
  {
    name: "buildPromoCodeKpiRequest builds a fixed recent7 request independent of report date preset",
    fn() {
      const req = buildPromoCodeKpiRequest({
        overviewUrl:
          "https://e.dianping.com/mda/v5/overview?yodaReady=h5&csecplatform=4&csecversion=4.2.0&mtgsig=abc123&pageType=v5Home",
        cookieHeader: "token=abc",
        datePreset: "today",
        now: new Date("2026-05-19T12:00:00+08:00"),
        request: {
          postData:
            "source=1&device=pc&date=2026-05-01%2C2026-05-07&platform=0&pageType=v5Home&shopIds=1500702739",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "x-custom": "keep",
            cookie: "old=cookie",
          },
        },
      });

      const query = new URL(req.url).searchParams;
      assert.equal(
        req.url.startsWith(
          "https://e.dianping.com/gateway/qrcode/b/promocode/queryPromoCodeKPIs?"
        ),
        true
      );
      assert.equal(query.get("codeType"), "0");
      assert.equal(query.get("dpShopId"), "1500702739");
      assert.equal(query.get("startTime"), "1778515200000");
      assert.equal(query.get("endTime"), "1779120000000");
      assert.equal(query.get("yodaReady"), "h5");
      assert.equal(query.get("csecplatform"), "4");
      assert.equal(query.get("csecversion"), "4.2.0");
      assert.equal(query.get("mtgsig"), "abc123");
      assert.equal(req.options.method, "GET");
      assert.equal(req.options.headers.cookie, "token=abc");
      assert.equal(req.options.headers["x-custom"], "keep");
      assert.equal(req.options.headers["content-type"], undefined);
    },
  },
  {
    name: "extractPromoCodeKpiMetrics finds scan evaluation count from KPI cards",
    fn() {
      const metrics = extractPromoCodeKpiMetrics({
        code: 200,
        data: {
          cards: [
            { title: "扫码人数", value: "117" },
            { title: "扫码收藏数", value: "0" },
            { title: "扫码评价数", value: "55" },
          ],
        },
      });

      assert.deepEqual(metrics, {
        "扫码评价数": {
          label: "扫码评价数",
          value: "55",
        },
      });
    },
  },
  {
    name: "extractPromoCodeKpiMetrics reads the real nested promo overview response shape",
    fn() {
      const metrics = extractPromoCodeKpiMetrics({
        code: 200,
        success: true,
        data: {
          data: {
            promoDateOverview: [
              {
                modelName: "交易",
                modelDateOverview: [
                  { indicatorName: "支付订单", amount: 13 },
                ],
              },
              {
                modelName: "用户",
                modelDateOverview: [
                  { indicatorName: "扫码人数", amount: 20 },
                  { indicatorName: "扫码收藏数", amount: 0 },
                  { indicatorName: "扫码评价数", amount: 9 },
                ],
              },
            ],
          },
        },
      });

      assert.deepEqual(metrics, {
        "扫码评价数": {
          label: "扫码评价数",
          value: "9",
        },
      });
    },
  },
];
