const assert = require("node:assert/strict");

const {
  buildRequest: buildFlowWhereaboutsRequest,
  extractMetrics: extractFlowWhereaboutsMetrics,
} = require("../src/lib/api/flow-whereabouts");

module.exports = [
  {
    name: "buildFlowWhereaboutsRequest targets defaultData flowWhereabouts with current report date",
    fn() {
      const req = buildFlowWhereaboutsRequest({
        overviewUrl:
          "https://e.dianping.com/mda/v5/overview?yodaReady=h5&csecplatform=4&csecversion=4.2.0&mtgsig=abc123&pageType=v5Home",
        cookieHeader: "foo=bar",
        now: new Date("2026-05-21T12:00:00+08:00"),
        request: {
          method: "POST",
          postData:
            "source=1&device=pc&date=2026-05-19%2C2026-05-19&platform=0&pageType=v5Home&shopIds=1500702739",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            origin: "https://h5.dianping.com",
            cookie: "old-cookie=value",
            "content-length": "999",
          },
        },
      });

      assert.equal(
        req.url,
        "https://e.dianping.com/gateway/mda/defaultData?yodaReady=h5&csecplatform=4&csecversion=4.2.0&mtgsig=abc123"
      );
      assert.equal(req.options.method, "POST");
      assert.equal(req.options.headers.cookie, "foo=bar");
      assert.equal(req.options.headers.origin, "https://h5.dianping.com");
      assert.equal(req.options.headers["content-length"], undefined);
      assert.equal(
        req.options.body,
        "source=1&device=pc&pageType=flowWhereabouts&shopIds=1500702739&platform=0&date=2026-05-20%2C2026-05-20"
      );
    },
  },
  {
    name: "extractFlowWhereaboutsMetrics reads phone and address click counts",
    fn() {
      const metrics = extractFlowWhereaboutsMetrics({
        data: [
          {
            componentId: "flowViewDataWhereabouts",
            body: {
              datas: [
                { module_name: "电话", click_cust_cnt: 11 },
                { module_name: "地址", click_cust_cnt: 30 },
                { module_name: "在线咨询", click_cust_cnt: 5 },
              ],
            },
          },
        ],
      });

      assert.deepEqual(metrics, {
        "电话点击": { label: "电话点击", value: "11" },
        "地址点击": { label: "地址点击", value: "30" },
      });
    },
  },
];
