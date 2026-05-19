const assert = require("node:assert/strict");

const { buildRequest: buildReplayRequest } = require("../src/lib/api/replay");

module.exports = [
  {
    name: "buildReplayRequest reuses the original overview request with a fresh cookie header",
    fn() {
      const replay = buildReplayRequest({
        overviewUrl: "https://e.dianping.com/mda/v5/overview?foo=bar",
        cookieHeader: "foo=bar; hello=world",
        request: {
          method: "POST",
          postData: "source=1&device=pc&date=2026-05-01%2C2026-05-07&platform=0&shopIds=123",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            origin: "https://h5.dianping.com",
            referer: "https://h5.dianping.com/",
            cookie: "old-cookie=value",
            "content-length": "999",
          },
        },
      });

      assert.equal(replay.url, "https://e.dianping.com/mda/v5/overview?foo=bar");
      assert.equal(replay.options.method, "POST");
      // date 字段应收窄为单天范围（最后一天）
      assert.equal(
        replay.options.body,
        "source=1&device=pc&date=2026-05-07%2C2026-05-07&platform=0&shopIds=123"
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
    name: "buildReplayRequest supports overriding the date preset",
    fn() {
      const replay = buildReplayRequest({
        overviewUrl: "https://e.dianping.com/mda/v5/overview?foo=bar",
        cookieHeader: "foo=bar; hello=world",
        datePreset: "today",
        now: new Date("2026-05-19T12:00:00+08:00"),
        request: {
          method: "POST",
          postData:
            "source=1&device=pc&date=2026-05-01%2C2026-05-07&platform=0&shopIds=123",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        },
      });

      assert.equal(
        replay.options.body,
        "source=1&device=pc&date=2026-05-19%2C2026-05-19&platform=0&shopIds=123"
      );
    },
  },
];
