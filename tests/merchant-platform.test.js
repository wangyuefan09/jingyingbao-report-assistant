const assert = require("node:assert/strict");

const {
  buildPromoEntryUrl,
  decodeMerchantPlatformContentUrl,
  getMerchantPlatformContentTarget,
} = require("../src/lib/merchant-platform");

const SHELL_URL =
  "https://e.dianping.com/app/merchant-platform/c159edcc823d452?iUrl=Ly9oNS5kaWFucGluZy5jb20vYXBwL21lcmNoYW50LW1hbmFnZS1hZHZpY2UtcGMtc3RhdGljL2FkdmljZS1ob21lLmh0bWw";

module.exports = [
  {
    name: "decodeMerchantPlatformContentUrl reads the wrapped h5 content url",
    fn() {
      assert.equal(
        decodeMerchantPlatformContentUrl(SHELL_URL),
        "https://h5.dianping.com/app/merchant-manage-advice-pc-static/advice-home.html"
      );
    },
  },
  {
    name: "getMerchantPlatformContentTarget prefers the matching child frame over the shell page",
    fn() {
      const page = {
        url() {
          return SHELL_URL;
        },
        frames() {
          return [
            { url: () => "about:blank" },
            { url: () => "https://h5.dianping.com/app/merchant-manage-advice-pc-static/advice-home.html" },
          ];
        },
      };

      const target = getMerchantPlatformContentTarget(page);
      assert.equal(
        target.url(),
        "https://h5.dianping.com/app/merchant-manage-advice-pc-static/advice-home.html"
      );
    },
  },
  {
    name: "buildPromoEntryUrl routes promo pages through pcCpcEntry first",
    fn() {
      assert.equal(
        buildPromoEntryUrl("/app/peon-hornet-promo/html/promo-list.html"),
        "https://e.dianping.com/shopdiy/account/pcCpcEntry?continueUrl=%2Fapp%2Fpeon-hornet-promo%2Fhtml%2Fpromo-list.html"
      );
    },
  },
];
