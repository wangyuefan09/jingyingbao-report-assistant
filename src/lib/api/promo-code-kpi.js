// 优惠码 KPI API
// 类型: 直接 fetch
// 接口: GET https://e.dianping.com/gateway/qrcode/b/promocode/queryPromoCodeKPIs
// 说明: 固定获取最近 7 个完整自然日的优惠码指标，不跟页面报表日期切换
// 提取指标: 扫码评价数

function getRecent7Window(now = new Date()) {
  const chinaNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const y = chinaNow.getUTCFullYear();
  const m = String(chinaNow.getUTCMonth() + 1).padStart(2, "0");
  const d = String(chinaNow.getUTCDate()).padStart(2, "0");
  const endDate = `${y}-${m}-${d}`;
  const end = new Date(`${endDate}T00:00:00+08:00`);
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    startTime: String(start.getTime()),
    endTime: String(end.getTime()),
  };
}

function sanitizeHeaders(headers) {
  const safeHeaders = { ...(headers || {}) };

  delete safeHeaders.cookie;
  delete safeHeaders.Cookie;
  delete safeHeaders["content-length"];
  delete safeHeaders["Content-Length"];
  delete safeHeaders["content-type"];
  delete safeHeaders["Content-Type"];

  return safeHeaders;
}

function getShopId(postData) {
  const params = new URLSearchParams(postData || "");
  return params.get("shopIds") || "";
}

function buildRequest({ overviewUrl, cookieHeader, request, now }) {
  const { startTime, endTime } = getRecent7Window(now);
  const currentUrl = new URL(overviewUrl);
  const nextUrl = new URL(
    "https://e.dianping.com/gateway/qrcode/b/promocode/queryPromoCodeKPIs"
  );

  nextUrl.searchParams.set("codeType", "0");
  nextUrl.searchParams.set("startTime", startTime);
  nextUrl.searchParams.set("endTime", endTime);
  nextUrl.searchParams.set("dpShopId", getShopId(request?.postData));

  for (const key of ["yodaReady", "csecplatform", "csecversion", "mtgsig"]) {
    const value = currentUrl.searchParams.get(key);
    if (value) {
      nextUrl.searchParams.set(key, value);
    }
  }

  return {
    url: nextUrl.toString(),
    options: {
      method: "GET",
      headers: {
        ...sanitizeHeaders(request?.headers),
        cookie: cookieHeader,
        referer: "https://e.dianping.com/mkt/tools/new-promo-code/index.html",
      },
    },
  };
}

function readMetricLabel(node) {
  for (const key of ["title", "name", "label", "metricName", "indicatorName"]) {
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

  function visit(node) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    const label = readMetricLabel(node);
    if (label === "扫码评价数") {
      const value = readPrimitiveValue(node);
      if (value !== null) {
        metrics["扫码评价数"] = { label: "扫码评价数", value };
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
  name: "promoCodeKpi",
  type: "fetch",
  buildRequest,
  extractMetrics,
};
