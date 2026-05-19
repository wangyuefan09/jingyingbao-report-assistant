const assert = require("node:assert/strict");

const {
  MENU_CANDIDATES,
  matchUrl: isOverviewUrl,
} = require("../src/lib/api/overview");

function getOverviewMenuCandidates() {
  return MENU_CANDIDATES;
}

module.exports = [
  {
    name: "getOverviewMenuCandidates returns the expected Chinese menu labels",
    fn() {
      assert.deepEqual(getOverviewMenuCandidates(), [
        ["经营参谋", "本店分析"],
      ]);
    },
  },
  {
    name: "isOverviewUrl matches the overview endpoint",
    fn() {
      assert.equal(
        isOverviewUrl(
          "https://e.dianping.com/mda/v5/overview?yodaReady=h5&csecplatform=4"
        ),
        true
      );
      assert.equal(
        isOverviewUrl("https://e.dianping.com/mda/v5/something-else"),
        false
      );
    },
  },
];
