// 交易明细 API
// 类型: 直接 fetch
// 接口: POST https://e.dianping.com/mda/v5/trade
// 说明: 获取下单/核销的售价金额及优惠后核销金额，日期收窄为昨天（单天范围）

const { getDateRangeForPreset } = require("./date-utils");
const { normalizeNumber } = require("../overview-parser");

const PRD_IDS = "1,2,3,4,5,6,11,12,13,14,15,16,17,18,19,20";

/** 需要从响应中提取的指标名称 */
const TARGET_LABELS = new Set(["下单金额（原价）", "核销金额（原价）", "核销金额"]);

/**
 * 将 API 返回的原始值（可能包含 ¥ 前缀和 元 后缀）转为带千位逗号的数字字符串。
 * 例如 "¥7,628元" → "7,628"，"3817" → "3,817"
 */
function toMetricValue(raw) {
  // 兼容 ¥（半角 U+00A5）和 ￥（全角 U+FFE5）前缀，以及 元 单位后缀
  const cleaned = String(raw ?? "").trim().replace(/^[¥￥]/, "").replace(/元$/, "").trim();
  const normalized = normalizeNumber(cleaned);
  if (!Number.isFinite(normalized.value)) {
    return normalized.rawValue ?? null;
  }
  return normalized.value.toLocaleString("en-US");
}

function buildRequest({ overviewUrl, cookieHeader, request, datePreset, now }) {
  const tradeUrl = overviewUrl.replace(/\/mda\/v5\/overview/, "/mda/v5/trade");

  const safeHeaders = { ...(request?.headers || {}) };
  delete safeHeaders.cookie;
  delete safeHeaders.Cookie;
  delete safeHeaders["content-length"];
  delete safeHeaders["Content-Length"];

  const { beginDate, endDate } = getDateRangeForPreset(
    datePreset,
    request?.postData,
    now
  );
  const params = new URLSearchParams(request?.postData || "");
  params.set("date", `${beginDate},${endDate}`);
  params.set("pageType", "v5Trade");
  params.set("optionType", "v5Trade");
  params.set("prdIds", PRD_IDS);
  params.set("timeStamp", String(Date.now()));

  return {
    url: tradeUrl,
    options: {
      method: request?.method || "POST",
      headers: {
        ...safeHeaders,
        cookie: cookieHeader,
      },
      body: params.toString(),
    },
  };
}

/**
 * 遍历所有 component.body 条目，按 name 字段提取目标指标。
 * 不依赖特定 componentId，兼容不同版本的响应结构。
 */
function extractMetrics(json) {
  const components = Array.isArray(json?.data) ? json.data : [];
  const metrics = {};

  for (const component of components) {
    for (const entry of Array.isArray(component?.body) ? component.body : []) {
      const name = typeof entry?.name === "string" ? entry.name.trim() : null;
      if (!name || !TARGET_LABELS.has(name) || metrics[name]) {
        continue;
      }
      const value = toMetricValue(entry?.value);
      if (value !== null) {
        metrics[name] = { label: name, value };
      }
    }
  }

  return metrics;
}

module.exports = {
  name: "trade",
  type: "fetch",
  buildRequest,
  extractMetrics,
};
