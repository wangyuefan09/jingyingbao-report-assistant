// 推广看板报告 API
// 类型: 直接 fetch
// 接口: GET https://e.dianping.com/shopdiy/report/datareport/pc/ajax/getBoardReport
// 说明: 从经营概览抓取到的 postData 中提取 shopIds，日期收窄为昨天（单天范围）
// 提取指标: 花费(元)、点击均价、团购订单量、查看电话(次)、查看地址(次)

const { getDateRangeForPreset } = require("./date-utils");

const PROMO_BOARD_REPORT_PATH =
  "/shopdiy/report/datareport/pc/ajax/getBoardReport";

const TAB_IDS = [
  "T30001", "T30002", "T30003", "T30004", "T30005", "T30006", "T30007",
  "T30013", "T30014", "T30012", "T30011", "T30020",
];

/** 判断某个 URL 是否是推广看板报告接口响应（保留供兼容） */
function matchUrl(url) {
  return typeof url === "string" && url.includes(PROMO_BOARD_REPORT_PATH);
}

function buildRequest({ cookieHeader, request, datePreset, now }) {
  const params = new URLSearchParams(request?.postData || "");
  const shopId = params.get("shopIds") || "";
  const { beginDate, endDate } = getDateRangeForPreset(
    datePreset,
    request?.postData,
    now
  );

  const query = new URLSearchParams({
    shopIds: shopId,
    beginDate,
    endDate,
    tabIds: TAB_IDS.join(","),
  });

  const safeHeaders = { ...(request?.headers || {}) };
  delete safeHeaders.cookie;
  delete safeHeaders.Cookie;
  delete safeHeaders["content-length"];
  delete safeHeaders["Content-Length"];
  delete safeHeaders["content-type"];
  delete safeHeaders["Content-Type"];

  return {
    url: `https://e.dianping.com${PROMO_BOARD_REPORT_PATH}?${query.toString()}`,
    options: {
      method: "GET",
      headers: {
        ...safeHeaders,
        cookie: cookieHeader,
      },
    },
  };
}

/** Tab ID → 内部指标 key（供 daily-report 消费）*/
const ID_TO_LABEL = {
  T30001:  "花费(元)",
  T30004:  "点击均价",
  T30020:  "团购订单量",
  T30013:  "查看地址(次)",
  T30014:  "查看电话(次)",
};

function extractMetrics(payload) {
  const metrics = {};

  // 真实响应结构: { msg: { total: [ { id, name, value, ... } ] } }
  const items = Array.isArray(payload?.msg?.total) ? payload.msg.total : [];

  for (const item of items) {
    const label = ID_TO_LABEL[item?.id];
    if (!label) {
      continue;
    }
    const raw = item?.value ?? item?.originValue ?? null;
    if (raw !== null && raw !== undefined) {
      metrics[label] = { label, value: String(raw).replace(/^￥/, "").trim() };
    }
  }

  return metrics;
}

module.exports = {
  name: "promoBoardReport",
  type: "fetch",
  matchUrl,
  buildRequest,
  extractMetrics,
};

