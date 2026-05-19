// 经营概览 API
// 类型: 浏览器拦截 (Playwright waitForResponse)
// 接口: GET https://e.dianping.com/mda/v5/overview
// 触发方式: 导航至 经营参谋 > 本店分析 / 客流分析 菜单
// 提取方式: 通过 overview-parser.js 做深度解析，详见 browser-flow.js

/**
 * 导航菜单候选项 [groupLabel, itemLabel]，按优先级排序，逐一尝试直到成功。
 */
const MENU_CANDIDATES = [
  ["经营参谋", "本店分析"],
];

/** 判断某个 URL 是否是概览接口响应 */
function matchUrl(url) {
  return typeof url === "string" && url.includes("/mda/v5/overview");
}

module.exports = {
  name: "overview",
  type: "intercept",
  matchUrl,
  MENU_CANDIDATES,
};
