const assert = require("node:assert/strict");

const {
  buildRequest: buildPromoFinanceRequest,
  extractMetrics: extractPromoFinanceMetrics,
} = require("../src/lib/api/promo-finance");

module.exports = [
  {
    name: "buildPromoFinanceRequest creates the finance balance request with captured cookies",
    fn() {
      const replay = buildPromoFinanceRequest({
        cookieHeader: "foo=bar; hello=world",
        request: {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            origin: "https://h5.dianping.com",
            referer: "https://h5.dianping.com/",
            cookie: "old-cookie=value",
            "content-length": "999",
          },
        },
      });

      assert.equal(
        replay.url,
        "https://e.dianping.com/adpaccount/finance/account/r/getHomeFinancialDetailV2"
      );
      assert.equal(replay.options.method, "GET");
      assert.equal(replay.options.body, undefined);
      assert.equal(replay.options.headers.cookie, "foo=bar; hello=world");
      assert.equal(
        replay.options.headers.referer,
        "https://e.dianping.com/app/peon-promo-finance/html/flow-home.html"
      );
      assert.equal(replay.options.headers["x-requested-with"], "XMLHttpRequest");
      assert.equal(replay.options.headers["content-length"], undefined);
      assert.equal(replay.options.headers["content-type"], undefined);
    },
  },
  {
    name: "extractPromoFinanceMetrics finds balance values from common finance payload shapes",
    fn() {
      const metrics = extractPromoFinanceMetrics({
        code: 200,
        data: {
          accountInfo: {
            availableBalance: "171.05",
          },
          cards: [
            {
              title: "推广通余额",
              value: "171.05",
            },
          ],
        },
      });

      assert.deepEqual(metrics, {
        "推广通余额": {
          label: "推广通余额",
          value: "171.05",
        },
      });
    },
  },
  {
    name: "extractPromoFinanceMetrics reads totalBalance from the real finance payload shape",
    fn() {
      const metrics = extractPromoFinanceMetrics({
        code: 0,
        data: {
          balanceAndPublishDetails: [
            {
              productType: 6,
              totalBalance: 989.72,
              balanceDetailList: [{ amount: 989.72, type: 1 }],
            },
          ],
        },
        msg: "success",
      });

      assert.deepEqual(metrics, {
        "推广通余额": {
          label: "推广通余额",
          value: "989.72",
        },
      });
    },
  },
];
