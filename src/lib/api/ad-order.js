// 广告单 API
// 类型: 直接 fetch
// 接口: POST https://e.dianping.com/mda/v5/optionDetail
// 说明: 使用团购 tab 商品排行，按商品最新售价取最高价商品，再读取其下单券数

const { getDateRangeForPreset } = require("./date-utils");
const { normalizeNumber } = require("../overview-parser");

function sanitizeHeaders(headers) {
  const safeHeaders = { ...(headers || {}) };

  delete safeHeaders.cookie;
  delete safeHeaders.Cookie;
  delete safeHeaders["content-length"];
  delete safeHeaders["Content-Length"];

  return safeHeaders;
}

function buildRequest({ overviewUrl, cookieHeader, request, datePreset, now }) {
  const optionDetailUrl = overviewUrl.replace(/\/mda\/v5\/overview/, "/mda/v5/optionDetail");
  const { beginDate, endDate } = getDateRangeForPreset(
    datePreset,
    request?.postData,
    now
  );

  const params = new URLSearchParams(request?.postData || "");
  params.set("date", `${beginDate},${endDate}`);
  params.set("pageType", "v5Trade");
  params.set("optionType", "tradeProductRank");
  params.set("prdIds", "1");
  params.set("typeIds", "6");
  params.set("sortTypeId", "6");
  params.set("timeStamp", String(Date.now()));

  return {
    url: optionDetailUrl,
    options: {
      method: request?.method || "POST",
      headers: {
        ...sanitizeHeaders(request?.headers),
        cookie: cookieHeader,
      },
      body: params.toString(),
    },
  };
}

function toNumber(value) {
  const normalized = normalizeNumber(String(value ?? ""));
  return Number.isFinite(normalized.value) ? normalized.value : null;
}

function extractMetrics(payload) {
  const components = Array.isArray(payload?.data) ? payload.data : [];
  const table = components.find((component) => component?.componentId === "tradeProductTable");
  const rows = Array.isArray(table?.body?.tr) ? table.body.tr : [];

  let bestRow = null;
  let bestPrice = -Infinity;

  for (const row of rows) {
    const price = toNumber(row?.sale_price);
    if (!Number.isFinite(price) || price <= bestPrice) {
      continue;
    }

    bestPrice = price;
    bestRow = row;
  }

  if (!bestRow || bestRow.buy_cnt === null || bestRow.buy_cnt === undefined || bestRow.buy_cnt === "") {
    return {};
  }

  return {
    "广告单": {
      label: "广告单",
      value: String(bestRow.buy_cnt),
    },
  };
}

module.exports = {
  name: "adOrder",
  type: "fetch",
  buildRequest,
  extractMetrics,
};
