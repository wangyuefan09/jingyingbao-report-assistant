const assert = require("node:assert/strict");

const {
  applyDatePresetToPostData,
  getDatePresetLabel,
  getDateRangeLabel,
  getDateRangeForPreset,
  normalizeDatePreset,
} = require("../src/lib/api/date-utils");

module.exports = [
  {
    name: "normalizeDatePreset falls back to yesterday for unknown values",
    fn() {
      assert.equal(normalizeDatePreset("today"), "today");
      assert.equal(normalizeDatePreset("recent7"), "recent7");
      assert.equal(normalizeDatePreset("invalid"), "yesterday");
      assert.equal(normalizeDatePreset(""), "yesterday");
    },
  },
  {
    name: "getDateRangeForPreset resolves today yesterday and recent7 consistently",
    fn() {
      const now = new Date("2026-05-20T12:00:00+08:00");
      const postData =
        "source=1&device=pc&date=2026-05-01%2C2026-05-07&platform=0&shopIds=123";

      assert.deepEqual(getDateRangeForPreset("yesterday", postData, now), {
        beginDate: "2026-05-19",
        endDate: "2026-05-19",
      });
      assert.deepEqual(getDateRangeForPreset("today", postData, now), {
        beginDate: "2026-05-20",
        endDate: "2026-05-20",
      });
      assert.deepEqual(getDateRangeForPreset("recent7", postData, now), {
        beginDate: "2026-05-14",
        endDate: "2026-05-20",
      });
      assert.equal(getDatePresetLabel("yesterday"), "昨日");
      assert.equal(getDatePresetLabel("today"), "今日");
      assert.equal(getDatePresetLabel("recent7"), "近7日");
      assert.equal(getDateRangeLabel("yesterday", postData, now), "2026-05-19");
      assert.equal(getDateRangeLabel("today", postData, now), "2026-05-20");
      assert.equal(
        getDateRangeLabel("recent7", postData, now),
        "2026-05-14 ~ 2026-05-20"
      );
    },
  },
  {
    name: "yesterday ignores stale captured postData date and uses current China date",
    fn() {
      const now = new Date("2026-05-20T12:00:00+08:00");
      const stalePostData =
        "source=1&device=pc&date=2026-05-07%2C2026-05-13&platform=0&shopIds=123";

      assert.deepEqual(getDateRangeForPreset("yesterday", stalePostData, now), {
        beginDate: "2026-05-19",
        endDate: "2026-05-19",
      });
      assert.equal(
        getDateRangeLabel("yesterday", stalePostData, now),
        "2026-05-19"
      );
    },
  },
  {
    name: "applyDatePresetToPostData rewrites the date field for the selected preset",
    fn() {
      const now = new Date("2026-05-19T12:00:00+08:00");
      const next = applyDatePresetToPostData(
        "source=1&device=pc&date=2026-05-01%2C2026-05-07&platform=0&shopIds=123",
        "recent7",
        now
      );

      assert.equal(
        next,
        "source=1&device=pc&date=2026-05-13%2C2026-05-19&platform=0&shopIds=123"
      );
    },
  },
];
