// 页面各模块点击分布 API
// 类型: 直接 fetch
// 接口: POST https://e.dianping.com/gateway/mda/defaultData?pageType=flowWhereabouts
// 提取指标: 电话点击、地址点击

const { getDateRangeForPreset } = require("./date-utils");

function sanitizeHeaders(headers) {
  const safeHeaders = { ...(headers || {}) };

  delete safeHeaders.cookie;
  delete safeHeaders.Cookie;
  delete safeHeaders["content-length"];
  delete safeHeaders["Content-Length"];

  return safeHeaders;
}

function buildUrl(overviewUrl) {
  const currentUrl = new URL(overviewUrl);
  const nextUrl = new URL("https://e.dianping.com/gateway/mda/defaultData");

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
  const params = new URLSearchParams(request?.postData || "");

  const body = new URLSearchParams({
    source: "1",
    device: "pc",
    pageType: "flowWhereabouts",
    shopIds: params.get("shopIds") || "",
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

function parseBody(node) {
  if (node?.body && typeof node.body === "object") {
    return node.body;
  }

  if (typeof node?.bodyStr === "string") {
    try {
      return JSON.parse(node.bodyStr);
    } catch (_error) {
      return null;
    }
  }

  return null;
}

function extractMetrics(payload) {
  const metrics = {};
  const components = Array.isArray(payload?.data) ? payload.data : [];
  const component = components.find(
    (item) => item?.componentId === "flowViewDataWhereabouts"
  );
  const body = parseBody(component);
  const rows = Array.isArray(body?.datas) ? body.datas : [];

  for (const row of rows) {
    if (row?.module_name === "电话" && row.click_cust_cnt !== undefined) {
      metrics["电话点击"] = {
        label: "电话点击",
        value: String(row.click_cust_cnt),
      };
    }

    if (row?.module_name === "地址" && row.click_cust_cnt !== undefined) {
      metrics["地址点击"] = {
        label: "地址点击",
        value: String(row.click_cust_cnt),
      };
    }
  }

  return metrics;
}

module.exports = {
  name: "flowWhereabouts",
  type: "fetch",
  buildRequest,
  extractMetrics,
};
