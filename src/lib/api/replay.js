// 概览重放 API
// 类型: 直接 fetch
// 接口: 与捕获到的概览 URL 相同，用于验证 Cookie 会话仍然有效
// 说明: 使用刚抓取的 Cookie 重新请求一次概览接口，日期收窄为昨天（单天范围）

const { applyDatePresetToPostData } = require("./date-utils");

function buildRequest({ overviewUrl, cookieHeader, request, datePreset, now }) {
  const safeHeaders = { ...(request?.headers || {}) };

  delete safeHeaders.cookie;
  delete safeHeaders.Cookie;
  delete safeHeaders["content-length"];
  delete safeHeaders["Content-Length"];

  return {
    url: overviewUrl,
    options: {
      method: request?.method || "GET",
      headers: {
        ...safeHeaders,
        cookie: cookieHeader,
      },
      body: request?.postData
        ? applyDatePresetToPostData(request.postData, datePreset, now)
        : undefined,
    },
  };
}

module.exports = {
  name: "replay",
  type: "fetch",
  buildRequest,
};
