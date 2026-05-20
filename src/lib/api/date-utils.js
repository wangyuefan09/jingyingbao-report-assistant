// 日期工具 - 供各 API 模块统一使用

const DATE_PRESET_LABELS = {
  yesterday: "昨日",
  today: "今日",
  recent7: "近7日",
};

function normalizeDatePreset(datePreset) {
  return DATE_PRESET_LABELS[datePreset] ? datePreset : "yesterday";
}

/**
 * 从 URL-encoded postData 的 `date` 字段中提取最后一个日期（即昨天）。
 * 支持单日格式 "YYYY-MM-DD" 和范围格式 "YYYY-MM-DD,YYYY-MM-DD"。
 * 若字段不存在则返回 null。
 */
function getLatestDateFromPostData(postData) {
  const params = new URLSearchParams(postData || "");
  const date = params.get("date");
  if (!date) {
    return null;
  }

  const parts = date.split(",");
  return parts[parts.length - 1] || null;
}

function toChinaDate(now = new Date()) {
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
}

function formatChinaDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayString(now = new Date()) {
  return formatChinaDate(toChinaDate(now));
}

/**
 * 计算北京时间（UTC+8）的昨天，格式 YYYY-MM-DD。
 * 作为无法从 postData 提取日期时的兜底。
 */
function getYesterdayString(now = new Date()) {
  const cst = toChinaDate(now);
  cst.setUTCDate(cst.getUTCDate() - 1);
  return formatChinaDate(cst);
}

function resolveYesterdayDate(postData, now = new Date()) {
  return getYesterdayString(now);
}

function getDatePresetLabel(datePreset) {
  return DATE_PRESET_LABELS[normalizeDatePreset(datePreset)];
}

function getDateRangeForPreset(datePreset, postData, now = new Date()) {
  const preset = normalizeDatePreset(datePreset);

  if (preset === "today") {
    const today = getTodayString(now);
    return { beginDate: today, endDate: today };
  }

  if (preset === "recent7") {
    const end = toChinaDate(now);
    const start = new Date(end.getTime());
    start.setUTCDate(start.getUTCDate() - 6);
    return {
      beginDate: formatChinaDate(start),
      endDate: formatChinaDate(end),
    };
  }

  const yesterday = resolveYesterdayDate(postData, now);
  return { beginDate: yesterday, endDate: yesterday };
}

function getDateRangeLabel(datePreset, postData, now = new Date()) {
  const { beginDate, endDate } = getDateRangeForPreset(datePreset, postData, now);
  if (beginDate === endDate) {
    return endDate;
  }

  return `${beginDate} ~ ${endDate}`;
}

function applyDatePresetToPostData(postData, datePreset, now = new Date()) {
  const { beginDate, endDate } = getDateRangeForPreset(datePreset, postData, now);
  const params = new URLSearchParams(postData || "");
  params.set("date", `${beginDate},${endDate}`);
  return params.toString();
}

/**
 * 将 postData 的 `date` 字段收窄为单天范围 "YYYY-MM-DD,YYYY-MM-DD"。
 * 若 postData 不含 date 字段，则原样返回。
 */
function narrowToSingleDay(postData, now = new Date()) {
  return applyDatePresetToPostData(postData, "yesterday", now);
}

module.exports = {
  applyDatePresetToPostData,
  getDatePresetLabel,
  getDateRangeLabel,
  getDateRangeForPreset,
  getLatestDateFromPostData,
  getTodayString,
  getYesterdayString,
  normalizeDatePreset,
  resolveYesterdayDate,
  narrowToSingleDay,
};
