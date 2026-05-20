const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const { runCaptureFlow, getPaths } = require("./browser-flow");
const api = require("./lib/api");
const { normalizeDatePreset } = require("./lib/api/date-utils");
const { buildDailyReport } = require("./lib/daily-report");
const { parseOverview } = require("./lib/overview-parser");

const PORT = Number(process.env.PORT || 3000);
const INDEX_HTML_PATH = path.join(__dirname, "..", "public", "index.html");
const INLINED_INDEX_HTML = require("./generated/index-html");
const BASE_DATA_DIR = process.pkg
  ? path.join(path.dirname(process.execPath), "data")
  : path.join(__dirname, "..", "data");

/** accountId 只允许字母数字/连字符/下划线，最长32位，防止路径穿越 */
const VALID_ACCOUNT_ID = /^[a-zA-Z0-9_-]{1,32}$/;

function validateAccountId(accountId) {
  if (!accountId || !VALID_ACCOUNT_ID.test(accountId)) {
    return false;
  }
  return true;
}

let activeRun = null; // 同一时刻只允许一个抓取流程

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

async function serveIndex(response) {
  const html = INLINED_INDEX_HTML || (await fs.readFile(INDEX_HTML_PATH, "utf8"));
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(html);
}

async function readJsonOrNull(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function parseResponseBody(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { rawText: text };
  }
}

async function fetchApiPayload(requestFactory, extractMetrics) {
  try {
    const { url, options } = requestFactory();
    const response = await fetch(url, options);
    const payload = await parseResponseBody(response);

    return {
      ok: response.ok,
      payload,
      metrics: extractMetrics ? extractMetrics(payload) : null,
    };
  } catch (_error) {
    return {
      ok: false,
      payload: null,
      metrics: null,
    };
  }
}

async function fetchLiveReportData(captureResult, datePreset) {
  if (
    !captureResult?.summary?.overviewUrl ||
    !captureResult?.cookieHeader ||
    !captureResult?.request
  ) {
    return null;
  }

  const requestContext = {
    overviewUrl: captureResult.summary.overviewUrl,
    cookieHeader: captureResult.cookieHeader,
    request: captureResult.request,
    datePreset,
  };

  const [
    overviewResult,
    flowResult,
    promoFinanceResult,
    promoBoardResult,
    promoCodeResult,
    adOrderResult,
    tradeResult,
  ] =
    await Promise.all([
      fetchApiPayload(
        () => api.replay.buildRequest(requestContext),
        null
      ),
      fetchApiPayload(
        () => api.flowAnalysis.buildRequest(requestContext),
        api.flowAnalysis.extractMetrics
      ),
      fetchApiPayload(
        () => api.promoFinance.buildRequest(requestContext),
        api.promoFinance.extractMetrics
      ),
      fetchApiPayload(
        () => api.promoBoardReport.buildRequest(requestContext),
        api.promoBoardReport.extractMetrics
      ),
      fetchApiPayload(
        () => api.promoCodeKpi.buildRequest(requestContext),
        api.promoCodeKpi.extractMetrics
      ),
      fetchApiPayload(
        () => api.adOrder.buildRequest(requestContext),
        api.adOrder.extractMetrics
      ),
      fetchApiPayload(
        () => api.trade.buildRequest(requestContext),
        api.trade.extractMetrics
      ),
    ]);

  if (
      !overviewResult.ok &&
      !flowResult.ok &&
      !promoFinanceResult.ok &&
      !promoBoardResult.ok &&
      !promoCodeResult.ok &&
      !adOrderResult.ok &&
      !tradeResult.ok
  ) {
    return null;
  }

  return {
    parsedOverview: overviewResult.ok ? parseOverview(overviewResult.payload) : null,
    flowMetrics: flowResult.metrics ?? null,
    promoFinanceMetrics: promoFinanceResult.metrics ?? null,
    promoBoardMetrics: promoBoardResult.metrics ?? null,
    promoCodeMetrics: promoCodeResult.metrics ?? null,
    adOrderMetrics: adOrderResult.metrics ?? null,
    tradeMetrics: tradeResult.metrics ?? null,
  };
}

async function buildLatestReportPayload(searchParams) {
  const accountId = searchParams.get("accountId") || "";
  if (!validateAccountId(accountId)) {
    const error = new Error("缺少或无效的 accountId");
    error.statusCode = 400;
    throw error;
  }
  const paths = getPaths(accountId);
  const captureResult = await readJsonOrNull(paths.latestCapturePath);
  const datePreset = normalizeDatePreset(searchParams.get("datePreset") || "");
  const liveData = await fetchLiveReportData(captureResult, datePreset);

  if (datePreset !== "yesterday" && !liveData) {
    const error = new Error("当前日期范围需要重新抓取，请点击【打开经营宝并抓取】后再试");
    error.statusCode = 502;
    throw error;
  }

  const parsedOverview =
    liveData?.parsedOverview ?? (await readJsonOrNull(paths.latestOverviewParsedPath));
  const report = buildDailyReport({
    parsedOverview,
    flowMetrics: liveData?.flowMetrics ?? captureResult?.flowAnalysis?.metrics ?? null,
    promoFinanceMetrics:
      liveData?.promoFinanceMetrics ?? captureResult?.promoFinance?.metrics ?? null,
    promoBoardMetrics:
      liveData?.promoBoardMetrics ?? captureResult?.promoBoardReport?.metrics ?? null,
    promoCodeMetrics:
      liveData?.promoCodeMetrics ?? captureResult?.promoCodeKpi?.metrics ?? null,
    adOrderMetrics:
      liveData?.adOrderMetrics ?? captureResult?.adOrder?.metrics ?? null,
    tradeMetrics: liveData?.tradeMetrics ?? captureResult?.trade?.metrics ?? null,
    storeName: await readStoreName(paths.dataDir),
    note: searchParams.get("note") || "",
    datePreset,
    dateSourcePostData: captureResult?.request?.postData || "",
  });

  return {
    ...report,
    capturedAt: captureResult?.capturedAt || null,
    files: {
      latestOverviewParsedPath: paths.latestOverviewParsedPath,
      latestPromoBoardReportPath: paths.latestPromoBoardReportPath,
      latestPromoFinancePath: paths.latestPromoFinancePath,
      latestCapturePath: paths.latestCapturePath,
    },
  };
}

/** 读取账号目录下 settings.json 中保存的门店名称 */
async function readStoreName(dataDir) {
  try {
    const settings = JSON.parse(
      await fs.readFile(path.join(dataDir, "settings.json"), "utf8")
    );
    return settings.storeName || "";
  } catch (_e) {
    return "";
  }
}

/** GET /api/accounts — 列出所有已抓取的门店账号 */
async function handleAccounts(response) {
  const dataDir = BASE_DATA_DIR;
  let entries = [];
  try {
    entries = await fs.readdir(dataDir, { withFileTypes: true });
  } catch (_e) {}

  const accounts = await Promise.all(
    entries
      .filter((e) => e.isDirectory() && e.name !== "_new")
      .map(async (e) => {
        const id = e.name;
        const accountPaths = getPaths(id);
        const storeName = await readStoreName(accountPaths.dataDir);
        let capturedAt = null;
        try {
          const capture = JSON.parse(
            await fs.readFile(accountPaths.latestCapturePath, "utf8")
          );
          capturedAt = capture.capturedAt || null;
        } catch (_e) {}
        return { id, storeName, capturedAt };
      })
  );

  writeJson(response, 200, accounts);
}

async function handleCapture(response, searchParams) {
  if (activeRun) {
    writeJson(response, 409, {
      error: "已有一个抓取流程正在执行，请先完成当前扫码登录。",
    });
    return;
  }

  // accountId 可以为空（新增门店时不传），系统将在扫码后自动确定
  const accountId = searchParams.get("accountId") || null;
  if (accountId && !validateAccountId(accountId)) {
    writeJson(response, 400, { error: "无效的 accountId" });
    return;
  }

  activeRun = runCaptureFlow(accountId);

  try {
    const { captureResult, accountId: realAccountId, paths } = await activeRun;
    writeJson(response, 200, {
      ...captureResult,
      accountId: realAccountId,
      files: paths,
    });
  } catch (error) {
    console.error("[capture] error:", error.stack);
    writeJson(response, 500, { error: error.message });
  } finally {
    activeRun = null;
  }
}

async function handleLatestReport(request, response) {
  const requestUrl = new URL(request.url, `http://127.0.0.1:${PORT}`);
  try {
    const payload = await buildLatestReportPayload(requestUrl.searchParams);
    writeJson(response, 200, payload);
  } catch (error) {
    writeJson(response, error.statusCode || 500, { error: error.message });
  }
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/") {
      await serveIndex(response);
      return;
    }

    if (request.method === "GET" && request.url === "/api/accounts") {
      await handleAccounts(response);
      return;
    }

    if (request.method === "POST" && request.url.startsWith("/api/capture")) {
      const requestUrl = new URL(request.url, `http://127.0.0.1:${PORT}`);
      await handleCapture(response, requestUrl.searchParams);
      return;
    }

    if (request.method === "GET" && request.url.startsWith("/api/latest-report")) {
      await handleLatestReport(request, response);
      return;
    }

    writeJson(response, 404, { error: "Not found" });
  } catch (error) {
    console.error("[server] unhandled error:", error.stack);
    writeJson(response, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Jingyingbao capture service listening on http://127.0.0.1:${PORT}`);
});
