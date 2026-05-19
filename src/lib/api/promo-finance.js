// 推广通财务 API
// 类型: 直接 fetch
// 接口: GET https://e.dianping.com/adpaccount/finance/account/r/getHomeFinancialDetailV2
// 提取指标: 推广通余额

function sanitizeHeaders(headers) {
  const safeHeaders = { ...(headers || {}) };

  delete safeHeaders.cookie;
  delete safeHeaders.Cookie;
  delete safeHeaders["content-length"];
  delete safeHeaders["Content-Length"];
  delete safeHeaders["content-type"];
  delete safeHeaders["Content-Type"];
  delete safeHeaders.origin;
  delete safeHeaders.Origin;

  return safeHeaders;
}

function buildRequest({ cookieHeader, request }) {
  return {
    url: "https://e.dianping.com/adpaccount/finance/account/r/getHomeFinancialDetailV2",
    options: {
      method: "GET",
      headers: {
        ...sanitizeHeaders(request?.headers),
        cookie: cookieHeader,
        referer:
          "https://e.dianping.com/app/peon-promo-finance/html/flow-home.html",
        "x-requested-with": "XMLHttpRequest",
      },
      body: undefined,
    },
  };
}

function toDisplayValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value).replace(/^￥/, "").trim();
}

function extractFromKey(node, key) {
  const rawValue = node?.[key];
  const value = toDisplayValue(rawValue);
  if (value === null) {
    return null;
  }

  return { label: "推广通余额", value };
}

function readMetricLabel(node) {
  for (const key of ["title", "name", "label", "metricName"]) {
    const value = node?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readPrimitiveValue(node) {
  for (const key of ["value", "val", "num", "count", "text", "amount"]) {
    const value = node?.[key];
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function extractMetrics(payload) {
  const metrics = {};
  const balanceKeys = [
    "availableBalance",
    "balance",
    "accountBalance",
    "promoBalance",
    "remainingBalance",
    "restAmount",
    "leftAmount",
    "usableBalance",
    "totalBalance",
  ];

  function visit(node) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    for (const key of balanceKeys) {
      const match = extractFromKey(node, key);
      if (match) {
        metrics["推广通余额"] = match;
      }
    }

    const label = readMetricLabel(node);
    if (label && (label.includes("余额") || label === "推广通余额")) {
      const value = toDisplayValue(readPrimitiveValue(node));
      if (value !== null) {
        metrics["推广通余额"] = { label: "推广通余额", value };
      }
    }

    for (const value of Object.values(node)) {
      visit(value);
    }
  }

  visit(payload);

  return metrics;
}

module.exports = {
  name: "promoFinance",
  type: "fetch",
  buildRequest,
  extractMetrics,
};
