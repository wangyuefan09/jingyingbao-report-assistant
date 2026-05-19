const assert = require("node:assert/strict");

const {
  buildRequest: buildFlowAnalysisRequest,
  extractMetrics: extractFlowAnalysisMetrics,
} = require("../src/lib/api/flow-analysis");

module.exports = [
  {
    name: "buildFlowAnalysisRequest reuses overview security params and narrows date to the latest day",
    fn() {
      const replay = buildFlowAnalysisRequest({
        overviewUrl:
          "https://e.dianping.com/mda/v5/overview?yodaReady=h5&csecplatform=4&csecversion=4.2.0&mtgsig=abc123&pageType=v5Home",
        cookieHeader: "foo=bar; hello=world",
        request: {
          method: "POST",
          postData:
            "source=1&device=pc&date=2026-04-30%2C2026-05-06&platform=0&pageType=v5Home&optionType=v5Home&shopIds=1500702739&excludeShopIds=&cityId=",
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
        "https://e.dianping.com/gateway/adviser/data?pageType=flowAnalysis&yodaReady=h5&csecplatform=4&csecversion=4.2.0&mtgsig=abc123"
      );
      assert.equal(replay.options.method, "POST");
      assert.equal(
        replay.options.body,
        "source=1&device=pc&pageType=flowAnalysis&shopIds=1500702739&platform=0&date=2026-05-06%2C2026-05-06"
      );
      assert.equal(replay.options.headers.cookie, "foo=bar; hello=world");
      assert.equal(
        replay.options.headers["content-type"],
        "application/x-www-form-urlencoded"
      );
      assert.equal(replay.options.headers.origin, "https://h5.dianping.com");
      assert.equal(replay.options.headers.referer, "https://h5.dianping.com/");
      assert.equal(replay.options.headers["content-length"], undefined);
    },
  },
  {
    name: "buildFlowAnalysisRequest supports recent7 preset",
    fn() {
      const replay = buildFlowAnalysisRequest({
        overviewUrl:
          "https://e.dianping.com/mda/v5/overview?yodaReady=h5&csecplatform=4&csecversion=4.2.0&mtgsig=abc123&pageType=v5Home",
        cookieHeader: "foo=bar; hello=world",
        datePreset: "recent7",
        now: new Date("2026-05-19T12:00:00+08:00"),
        request: {
          method: "POST",
          postData:
            "source=1&device=pc&date=2026-04-30%2C2026-05-06&platform=0&pageType=v5Home&optionType=v5Home&shopIds=1500702739&excludeShopIds=&cityId=",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        },
      });

      assert.equal(
        replay.options.body,
        "source=1&device=pc&pageType=flowAnalysis&shopIds=1500702739&platform=0&date=2026-05-13%2C2026-05-19"
      );
    },
  },
  {
    name: "extractFlowAnalysisMetrics finds daily favorite and checkin counts from nested cards",
    fn() {
      const metrics = extractFlowAnalysisMetrics({
        code: 0,
        msg: "ok",
        data: {
          cards: [
            {
              title: "累计收藏人数",
              value: "30",
            },
            {
              title: "新增收藏人数",
              value: "2",
              rate: "持平",
            },
            {
              title: "新增打卡人数",
              value: "0",
              rate: "--",
            },
          ],
        },
      });

      assert.deepEqual(metrics, {
        "新增收藏人数": {
          label: "新增收藏人数",
          value: "2",
        },
        "新增打卡人数": {
          label: "新增打卡人数",
          value: "0",
        },
      });
    },
  },
];
