// 经营宝 API 注册表
// 所有对外部（经营宝）接口的定义均集中在此目录，每个文件对应一个接口。
//
// 接口类型说明:
//   type: "intercept" — 通过 Playwright 在浏览器中拦截响应，无法直接 fetch。
//                       需配合 page.waitForResponse(api.xxx.matchUrl) 使用。
//   type: "fetch"     — 获取到 Cookie 后可直接用 Node fetch 调用。
//                       调用方式: const req = api.xxx.buildRequest(context); fetch(req.url, req.options)
//
// 新增接口步骤:
//   1. 在此目录新建 <接口名>.js，按下方统一接口规范导出字段
//   2. 在本文件 require 并加入对应分类列表
//   3. 在 browser-flow.js 中添加调用逻辑
//
// ─── 统一接口规范 ────────────────────────────────────────────────────
//
//   必填字段:
//     name: string          接口标识（camelCase）
//     type: "intercept" | "fetch"
//
//   type === "intercept" 时额外提供:
//     matchUrl(url): boolean        判断响应 URL 是否匹配
//     extractMetrics(json): object  从响应 JSON 提取指标（可选）
//
//   type === "fetch" 时额外提供:
//     buildRequest(context): { url, options }  构造 fetch 请求参数
//     extractMetrics(json): object              从响应 JSON 提取指标（可选）
//
// ─────────────────────────────────────────────────────────────────────

const overview = require("./overview");
const flowAnalysis = require("./flow-analysis");
const flowWhereabouts = require("./flow-whereabouts");
const promoFinance = require("./promo-finance");
const promoBoardReport = require("./promo-board-report");
const promoCodeKpi = require("./promo-code-kpi");
const adOrder = require("./ad-order");
const replay = require("./replay");
const trade = require("./trade");

/** 浏览器拦截类接口列表（按执行顺序） */
const INTERCEPTED_APIS = [overview];

/** 直接 fetch 类接口列表（按执行顺序） */
const FETCH_APIS = [
  flowAnalysis,
  flowWhereabouts,
  promoFinance,
  promoBoardReport,
  promoCodeKpi,
  adOrder,
  replay,
  trade,
];

module.exports = {
  // 按名称访问
  overview,
  flowAnalysis,
  flowWhereabouts,
  promoFinance,
  promoBoardReport,
  promoCodeKpi,
  adOrder,
  replay,
  trade,

  // 按类型访问
  INTERCEPTED_APIS,
  FETCH_APIS,
};
