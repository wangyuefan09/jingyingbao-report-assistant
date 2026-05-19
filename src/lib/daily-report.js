const DEFAULT_STORE_NAME = "门店名称待填写";
const DEFAULT_NOTE = "今天邮件已查看，无违规无异常。";
const { getDateRangeLabel } = require("./api/date-utils");
const { normalizeNumber } = require("./overview-parser");

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getMetric(parsedOverview, sectionKey, metricKey) {
  return parsedOverview?.sections?.[sectionKey]?.metrics?.[metricKey] || null;
}


function toDisplayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return String(value);
}

function parseDisplayNumber(value) {
  const normalized = normalizeNumber(String(value ?? ""));
  return Number.isFinite(normalized.value) ? normalized.value : null;
}

function toRateValue(numerator, denominator) {
  const numeratorValue = parseDisplayNumber(numerator);
  const denominatorValue = parseDisplayNumber(denominator);

  if (
    !Number.isFinite(numeratorValue) ||
    !Number.isFinite(denominatorValue) ||
    denominatorValue <= 0
  ) {
    return "--";
  }

  return `${((numeratorValue / denominatorValue) * 100).toFixed(2)}%`;
}

function toPromoCodeGoalValue(metricValue) {
  const numericValue = parseDisplayNumber(metricValue);
  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return `${String(metricValue)}（${numericValue > 10 ? "达标" : "不达标"}）`;
}

function buildValueMap(
  parsedOverview,
  flowMetrics,
  promoFinanceMetrics,
  promoBoardMetrics,
  promoCodeMetrics,
  adOrderMetrics,
  tradeMetrics
) {
  const values = {
    "曝光人数": toDisplayValue(getMetric(parsedOverview, "traffic", "view_uv")?.rawValue),
    "访问人数": toDisplayValue(getMetric(parsedOverview, "traffic", "shop_uv")?.rawValue),
    "下单人数": toDisplayValue(getMetric(parsedOverview, "traffic", "buy_uv")?.rawValue),
    "下单券数": toDisplayValue(getMetric(parsedOverview, "sales", "ind_buy_cnt")?.rawValue),
    "核销人数": toDisplayValue(getMetric(parsedOverview, "traffic", "csm_uv")?.rawValue),
    "核销券数": toDisplayValue(getMetric(parsedOverview, "trade", "csm_cnt")?.rawValue),
    "电话点击": toDisplayValue(promoBoardMetrics?.["查看电话(次)"]?.value ?? null),
    "地址点击": toDisplayValue(promoBoardMetrics?.["查看地址(次)"]?.value ?? null),
    "在线咨询": toDisplayValue(
      getMetric(parsedOverview, "im", "ask_user_cnt")?.rawValue
    ),
    "新增收藏": toDisplayValue(flowMetrics?.["新增收藏人数"]?.value ?? null),
    "新增打卡": toDisplayValue(flowMetrics?.["新增打卡人数"]?.value ?? null),
    "新增评价": toDisplayValue(
      getMetric(parsedOverview, "reviews", "review_new_cnt")?.rawValue
    ),
    "推广通消耗": toDisplayValue(promoBoardMetrics?.["花费(元)"]?.value ?? null),
    "推广通点击单价": toDisplayValue(promoBoardMetrics?.["点击均价"]?.value ?? null),
    "推广通下单量": toDisplayValue(promoBoardMetrics?.["7日团购订单量"]?.value ?? null),
    "推广通余额": toDisplayValue(promoFinanceMetrics?.["推广通余额"]?.value ?? null),
    "近7天优惠码订单是否达标": toPromoCodeGoalValue(
      promoCodeMetrics?.["扫码评价数"]?.value ?? null
    ),
    "广告单": toDisplayValue(adOrderMetrics?.["广告单"]?.value ?? null),
    "下单售价金额": toDisplayValue(
      tradeMetrics?.["下单金额（原价）"]?.value ??
      getMetric(parsedOverview, "sales", "ind_buy_amt")?.rawValue ??
      null
    ),
    "核销售价金额": toDisplayValue(
      tradeMetrics?.["核销金额（原价）"]?.value ??
      getMetric(parsedOverview, "trade", "csm_amt")?.rawValue ??
      null
    ),
    "优惠后核销金额": toDisplayValue(tradeMetrics?.["核销金额"]?.value ?? null),
  };

  values["留评率（30%达标）"] = toRateValue(values["新增评价"], values["下单人数"]);
  values["收藏率（40%达标）"] = toRateValue(values["新增收藏"], values["下单人数"]);

  return values;
}

function buildSupplemental(parsedOverview) {
  const supplemental = [];
  const adSpend = parsedOverview?.sections?.advertising?.spend || null;

  if (adSpend?.rawValue) {
    supplemental.push({
      label: "推广通近7天花费金额",
      value: adSpend.rawValue,
    });
  }

  return supplemental;
}

function buildText(storeName, note, dateLabel, values) {
  return [
    `${storeName}\t${note}`,
    `数据报表\t${dateLabel}`,
    "【美团点评广告结果数据】",
    `曝光人数：${values["曝光人数"]}`,
    `访问人数：${values["访问人数"]}`,
    `下单人数：${values["下单人数"]}`,
    `下单券数：${values["下单券数"]}`,
    `核销人数：${values["核销人数"]}`,
    `核销券数：${values["核销券数"]}`,
    `电话点击：${values["电话点击"]}`,
    `地址点击：${values["地址点击"]}`,
    `在线咨询：${values["在线咨询"]}`,
    "",
    "【店内干预数据】",
    `新增收藏：${values["新增收藏"]}`,
    `新增打卡：${values["新增打卡"]}`,
    `新增评价：${values["新增评价"]}`,
    "",
    "【推广通数据】",
    `推广通消耗：${values["推广通消耗"]}`,
    `推广通点击单价：${values["推广通点击单价"]}`,
    `推广通下单量：${values["推广通下单量"]}`,
    `推广通余额：${values["推广通余额"]}`,
    "",
    `留评率（30%达标）：${values["留评率（30%达标）"]}`,
    `收藏率（40%达标）：${values["收藏率（40%达标）"]}`,
    `近7天优惠码订单是否达标：${values["近7天优惠码订单是否达标"]}`,
    `广告单：${values["广告单"]}`,
    "",
    `下单售价金额：${values["下单售价金额"]}`,
    `核销售价金额：${values["核销售价金额"]}`,
    `优惠后核销金额：${values["优惠后核销金额"]}`,
  ].join("\n");
}

function buildDailyReport({
  parsedOverview,
  flowMetrics,
  promoFinanceMetrics,
  promoBoardMetrics,
  promoCodeMetrics,
  adOrderMetrics,
  tradeMetrics,
  storeName,
  note,
  datePreset,
  dateSourcePostData,
  now,
}) {
  const safeStoreName = normalizeText(storeName) || DEFAULT_STORE_NAME;
  const safeNote = normalizeText(note) || DEFAULT_NOTE;
  const dateLabel = getDateRangeLabel(datePreset, dateSourcePostData, now);
  const values = buildValueMap(
    parsedOverview,
    flowMetrics,
    promoFinanceMetrics,
    promoBoardMetrics,
    promoCodeMetrics,
    adOrderMetrics,
    tradeMetrics
  );
  const missingFields = Object.entries(values)
    .filter(([, value]) => value === "--")
    .map(([label]) => label);
  const supplemental = buildSupplemental(parsedOverview);

  return {
    generatedAt: new Date().toISOString(),
    hasSource: Boolean(
      parsedOverview ||
        flowMetrics ||
        promoFinanceMetrics ||
        promoBoardMetrics ||
        promoCodeMetrics ||
        adOrderMetrics ||
        tradeMetrics
    ),
    storeName: safeStoreName,
    note: safeNote,
    dateLabel,
    values,
    missingFields,
    supplemental,
    text: buildText(safeStoreName, safeNote, dateLabel, values),
  };
}

module.exports = {
  buildDailyReport,
  DEFAULT_NOTE,
  DEFAULT_STORE_NAME,
};
