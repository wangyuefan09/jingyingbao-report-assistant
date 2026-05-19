const assert = require("node:assert/strict");

const {
  buildRequest: buildPromoBoardReportRequest,
  extractMetrics: extractPromoBoardReportMetrics,
  matchUrl: isPromoBoardReportUrl,
} = require("../src/lib/api/promo-board-report");

module.exports = [
  {
    name: "isPromoBoardReportUrl matches the board report endpoint",
    fn() {
      assert.equal(
        isPromoBoardReportUrl(
          "https://e.dianping.com/shopdiy/report/datareport/pc/ajax/getBoardReport?shopIds=1500702739"
        ),
        true
      );
      assert.equal(
        isPromoBoardReportUrl(
          "https://e.dianping.com/adpaccount/finance/account/r/getHomeFinancialDetailV2"
        ),
        false
      );
    },
  },
  {
    name: "buildPromoBoardReportRequest builds correct GET URL with shopId and yesterday date",
    fn() {
      const req = buildPromoBoardReportRequest({
        cookieHeader: "token=abc",
        request: {
          method: "POST",
          postData:
            "source=1&device=pc&date=2026-05-10%2C2026-05-10&platform=0" +
            "&pageType=v5Overview&shopIds=1500702739&storeKey=231429497",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "x-custom": "keep",
            cookie: "old=cookie",
          },
        },
      });

      assert.ok(
        req.url.startsWith(
          "https://e.dianping.com/shopdiy/report/datareport/pc/ajax/getBoardReport?"
        )
      );
      const query = new URL(req.url).searchParams;
      assert.equal(query.get("shopIds"), "1500702739");
      assert.equal(query.get("beginDate"), "2026-05-10");
      assert.equal(query.get("endDate"), "2026-05-10");
      assert.ok(query.get("tabIds").includes("T30001"));
      assert.equal(req.options.method, "GET");
      assert.equal(req.options.headers.cookie, "token=abc");
      assert.equal(req.options.headers["x-custom"], "keep");
      assert.equal(req.options.headers["content-type"], undefined);
    },
  },
  {
    name: "buildPromoBoardReportRequest supports today preset",
    fn() {
      const req = buildPromoBoardReportRequest({
        cookieHeader: "token=abc",
        datePreset: "today",
        now: new Date("2026-05-19T12:00:00+08:00"),
        request: {
          method: "POST",
          postData:
            "source=1&device=pc&date=2026-05-10%2C2026-05-10&platform=0" +
            "&pageType=v5Overview&shopIds=1500702739&storeKey=231429497",
          headers: {},
        },
      });

      const query = new URL(req.url).searchParams;
      assert.equal(query.get("beginDate"), "2026-05-19");
      assert.equal(query.get("endDate"), "2026-05-19");
    },
  },
  {
    name: "extractPromoBoardReportMetrics finds spend cpc and order volume from nested payloads",
    fn() {
      const metrics = extractPromoBoardReportMetrics({
        code: 200,
        msg: {
          total: [
            { id: "T30001", name: "花费", value: "124.44" },
            { id: "T30002", name: "曝光", value: "1,236" },
            { id: "T30004", name: "点击均价", value: "1.45" },
            { id: "T310001", name: "7日团购订单量", value: "7" },
            { id: "T30013", name: "查看地址", value: "41" },
            { id: "T30014", name: "查看电话", value: "6" },
          ],
        },
      });

      assert.deepEqual(metrics["花费(元)"], { label: "花费(元)", value: "124.44" });
      assert.deepEqual(metrics["点击均价"], { label: "点击均价", value: "1.45" });
      assert.deepEqual(metrics["7日团购订单量"], { label: "7日团购订单量", value: "7" });
      assert.deepEqual(metrics["查看地址(次)"], { label: "查看地址(次)", value: "41" });
      assert.deepEqual(metrics["查看电话(次)"], { label: "查看电话(次)", value: "6" });
      assert.equal(metrics["曝光"], undefined);
    },
  },
];
