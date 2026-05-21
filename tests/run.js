const suites = [
  "./cookies.test",
  "./capture-result.test",
  "./data-dir.test",
  "./app-server.test",
  "./electron-desktop.test",
  "./browser-close.test",
  "./replay-request.test",
  "./overview-locators.test",
  "./merchant-platform.test",
  "./overview-parser.test",
  "./index-html.test",
  "./date-utils.test",
  "./flow-analysis.test",
  "./promo-finance.test",
  "./promo-board-report.test",
  "./promo-code-kpi.test",
  "./ad-order.test",
  "./trade.test",
  "./daily-report.test",
];

async function main() {
  let failures = 0;

  for (const suitePath of suites) {
    const suite = require(suitePath);

    for (const testCase of suite) {
      try {
        await testCase.fn();
        console.log(`PASS ${testCase.name}`);
      } catch (error) {
        failures += 1;
        console.error(`FAIL ${testCase.name}`);
        console.error(error);
      }
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
    return;
  }

  console.log("All tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
