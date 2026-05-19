const MERCHANT_PLATFORM_HOST = "e.dianping.com";
const MERCHANT_PLATFORM_PATH = "/app/merchant-platform";
const PROMO_ENTRY_URL = "https://e.dianping.com/shopdiy/account/pcCpcEntry";

function normalizeComparableUrl(url) {
  if (typeof url !== "string" || !url.trim()) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch (_error) {
    return null;
  }
}

function toAbsoluteContentUrl(contentUrl) {
  if (typeof contentUrl !== "string" || !contentUrl.trim()) {
    return null;
  }

  if (contentUrl.startsWith("//")) {
    return `https:${contentUrl}`;
  }

  try {
    return new URL(contentUrl).toString();
  } catch (_error) {
    return null;
  }
}

function decodeMerchantPlatformContentUrl(pageUrl) {
  if (typeof pageUrl !== "string" || !pageUrl.includes(MERCHANT_PLATFORM_PATH)) {
    return null;
  }

  try {
    const parsed = new URL(pageUrl);
    if (parsed.hostname !== MERCHANT_PLATFORM_HOST) {
      return null;
    }

    const encoded = parsed.searchParams.get("iUrl");
    if (!encoded) {
      return null;
    }

    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    return toAbsoluteContentUrl(decoded);
  } catch (_error) {
    return null;
  }
}

function getMerchantPlatformContentTarget(page) {
  if (!page || typeof page.url !== "function") {
    return page;
  }

  const expectedUrl = normalizeComparableUrl(decodeMerchantPlatformContentUrl(page.url()));
  if (!expectedUrl || typeof page.frames !== "function") {
    return page;
  }

  const matchingFrame = page
    .frames()
    .find((frame) => normalizeComparableUrl(frame?.url?.()) === expectedUrl);

  return matchingFrame || page;
}

function buildPromoEntryUrl(continueUrl) {
  const url = new URL(PROMO_ENTRY_URL);
  url.searchParams.set("continueUrl", continueUrl || "/");
  return url.toString();
}

module.exports = {
  buildPromoEntryUrl,
  decodeMerchantPlatformContentUrl,
  getMerchantPlatformContentTarget,
};
