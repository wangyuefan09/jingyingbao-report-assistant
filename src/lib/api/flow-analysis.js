// 客流分析 API
// 类型: 直接 fetch
// 接口: POST https://e.dianping.com/gateway/adviser/data?pageType=flowAnalysis
// 提取指标: 新增收藏人数、新增打卡人数
//
// 该接口复用概览请求中的鉴权参数（yodaReady / csecplatform / csecversion / mtgsig）
// 以及 shopIds，日期固定为昨天（单天范围）。

const { getDateRangeForPreset } = require("./date-utils");

function sanitizeHeaders(headers) {
  const safeHeaders = { ...(headers || {}) };

  delete safeHeaders.cookie;
  delete safeHeaders.Cookie;
  delete safeHeaders["content-length"];
  delete safeHeaders["Content-Length"];

  return safeHeaders;
}

function getShopIds(postData) {
  const params = new URLSearchParams(postData || "");
  return params.get("shopIds") || "";
}

function buildUrl(overviewUrl) {
  const currentUrl = new URL(overviewUrl);
  const nextUrl = new URL("https://e.dianping.com/gateway/adviser/data");

  nextUrl.searchParams.set("pageType", "flowAnalysis");

  for (const key of ["yodaReady", "csecplatform", "csecversion", "mtgsig"]) {
    const value = currentUrl.searchParams.get(key);
    if (value) {
      nextUrl.searchParams.set(key, value);
    }
  }

  return nextUrl.toString();
}

function buildRequest({ overviewUrl, cookieHeader, request, datePreset, now }) {
  const { beginDate, endDate } = getDateRangeForPreset(
    datePreset,
    request?.postData,
    now
  );
  const shopIds = getShopIds(request?.postData);

  const body = new URLSearchParams({
    source: "1",
    device: "pc",
    pageType: "flowAnalysis",
    shopIds,
    platform: "0",
    date: `${beginDate},${endDate}`,
  });

  return {
    url: buildUrl(overviewUrl),
    options: {
      method: request?.method || "POST",
      headers: {
        ...sanitizeHeaders(request?.headers),
        cookie: cookieHeader,
      },
      body: body.toString(),
    },
  };
}

function readPrimitiveValue(node) {
  for (const key of ["value", "val", "num", "count", "text"]) {
    const value = node?.[key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      value === "--"
    ) {
      return String(value);
    }
  }

  return null;
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

function extractMetrics(payload) {
  const targets = new Set(["新增收藏人数", "新增打卡人数"]);
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
    if (label && targets.has(label)) {
      const value = readPrimitiveValue(node);
      if (value !== null) {
        metrics[label] = { label, value };
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
  name: "flowAnalysis",
  type: "fetch",
  buildRequest,
  extractMetrics,
};
