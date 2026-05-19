const { cookiesToHeader } = require("./cookies");

function buildCaptureResult({ overviewUrl, cookies, overviewJson }) {
  const safeCookies = Array.isArray(cookies) ? cookies : [];
  const safeJson = overviewJson && typeof overviewJson === "object" ? overviewJson : {};

  return {
    capturedAt: new Date().toISOString(),
    cookieHeader: cookiesToHeader(safeCookies),
    summary: {
      cookieCount: safeCookies.length,
      cookieNames: safeCookies.map((cookie) => cookie.name),
      overviewUrl,
      topLevelKeys: Object.keys(safeJson),
    },
    raw: safeJson,
  };
}

module.exports = {
  buildCaptureResult,
};
