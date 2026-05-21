const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile, spawn } = require("node:child_process");

const { chromium } = require("playwright");

const { buildCaptureResult } = require("./lib/capture-result");
const api = require("./lib/api");
const { getBaseDataDir } = require("./lib/data-dir");
const { parseOverview } = require("./lib/overview-parser");

const JINGYINGBAO_URL = "https://e.dianping.com/app/merchant-platform";
const OVERVIEW_WAIT_TIMEOUT_MS = 180_000;

/** 根据 accountId 生成该账号的所有文件路径 */
function getPaths(accountId) {
  const dataDir = path.join(getBaseDataDir(), accountId);
  const profileDir = path.join(dataDir, "browser-profile");
  return {
    dataDir,
    profileDir,
    storageStatePath:         path.join(dataDir, "storage-state.json"),
    latestCapturePath:        path.join(dataDir, "latest-capture.json"),
    latestOverviewParsedPath: path.join(dataDir, "latest-overview-parsed.json"),
  };
}

async function ensureDataDir(dataDir) {
  await fs.mkdir(dataDir, { recursive: true });
}

async function renameWithRetry(src, dest, retries = 3, delayMs = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.rename(src, dest);
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function saveJson(filePath, payload) {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function parseTasklistProcessIds(output, imageName) {
  const normalizedImageName = imageName.toLowerCase();

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.match(/^"([^"]+)","(\d+)"/))
    .filter((match) => match && match[1].toLowerCase() === normalizedImageName)
    .map((match) => Number(match[2]))
    .filter(Number.isInteger);
}

function diffProcessIds(beforeIds, afterIds) {
  const before = new Set(beforeIds);
  return afterIds.filter((pid) => !before.has(pid));
}

function getWindowsChromeProcessIds() {
  return new Promise((resolve) => {
    execFile(
      "tasklist.exe",
      ["/FI", "IMAGENAME eq chrome.exe", "/FO", "CSV", "/NH"],
      { windowsHide: true },
      (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }
        resolve(parseTasklistProcessIds(stdout, "chrome.exe"));
      }
    );
  });
}

function killWindowsProcessTree(pid) {
  return new Promise((resolve) => {
    const child = spawn("taskkill.exe", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
    });
    child.on("exit", () => resolve());
    child.on("error", () => resolve());
  });
}

function killChromeByProfileDir(profileDir, chromeProcessIds = []) {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      Promise.all(chromeProcessIds.map((pid) => killWindowsProcessTree(pid))).then(resolve);
    } else {
      const child = spawn("/bin/sh", [
        "-c",
        `pgrep -f ${JSON.stringify(profileDir)} | xargs -r kill -9 2>/dev/null || true`,
      ]);
      child.on("exit", () => resolve());
      child.on("error", () => resolve());
    }
  });
}

async function closeContextForcefully(context, profileDir, chromeProcessIds = []) {
  const CLOSE_TIMEOUT_MS = 5_000;

  for (const page of context.pages()) {
    await page.close({ runBeforeUnload: false }).catch(() => {});
  }

  try {
    await Promise.race([
      context.close(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("context.close timeout")), CLOSE_TIMEOUT_MS)
      ),
    ]);
  } catch (error) {
    console.warn("[browser-flow] context.close 超时或失败:", error.message);
    try {
      await context.browser()?.close();
    } catch (_e) {}
  }

  await killChromeByProfileDir(profileDir, chromeProcessIds);
}

async function parseResponseBody(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {
      rawText: text,
    };
  }
}

function createOverviewWatcher(page) {
  return page.waitForResponse((response) => api.overview.matchUrl(response.url()), {
    timeout: OVERVIEW_WAIT_TIMEOUT_MS,
  });
}

async function waitForMerchantPage(page) {
  await page.waitForURL(/e\.dianping\.com/, { timeout: 0 });
  await page.waitForLoadState("domcontentloaded");
}

/**
 * 从经营宝页面提取门店名称。
 * 依次尝试顶部导航中包含门店名的元素，降级到页面 title。
 * 截图显示门店名在 header 左上角 logo 右侧的下拉按钮中。
 */
async function extractShopName(page) {
  // 经营宝 PC shell 顶部导航——按优先级排列
  const SELECTORS = [
    // 基于截图中元素的可能 class 名（经营宝 / 美团商家端常见命名）
    '[class*="shopName"]',
    '[class*="shop-name"]',
    '[class*="storeName"]',
    '[class*="store-name"]',
    '[class*="poiName"]',
    '[class*="poi-name"]',
    '[class*="merchantName"]',
    '[class*="merchant-name"]',
    '[class*="shopTitle"]',
    '[class*="shop-title"]',
    '[class*="storeTitle"]',
    '[class*="store-title"]',
    // header / navbar 里的第一个文字按钮
    'header [class*="name"]',
    'nav [class*="name"]',
    '.nav-header [class*="name"]',
    '.header [class*="name"]',
    // 兜底：header 里第一个非空的 span/div（但要过滤掉太短的导航项）
  ];

  for (const sel of SELECTORS) {
    try {
      const el = page.locator(sel).first();
      const text = (await el.innerText({ timeout: 1_500 })).trim();
      // 门店名一般包含中文且长度 > 3
      const cleaned = text.replace(/\s*商户通\s*$/, "").trim();
      if (cleaned.length > 3 && /[\u4e00-\u9fa5]/.test(cleaned)) {
        return cleaned;
      }
    } catch (_e) {
      // 选择器不存在则继续
    }
  }

  // 降级：用页面 title，去掉"- 经营宝 / 美团"后缀
  try {
    const title = await page.title();
    const name = title.replace(/\s*[-–—|]\s*(经营宝|美团|大众点评).*$/g, "").trim();
    if (name.length > 3 && /[\u4e00-\u9fa5]/.test(name)) {
      return name;
    }
  } catch (_e) {}

  return null;
}

async function tryOpenOverviewPage(page) {
  for (const [groupLabel, itemLabel] of api.overview.MENU_CANDIDATES) {
    try {
      await page.getByText(groupLabel, { exact: true }).first().click({ timeout: 5_000 });
      await page.getByText(itemLabel, { exact: true }).first().click({ timeout: 5_000 });
      return true;
    } catch (_error) {
      // Try the next selector combination.
    }
  }

  return false;
}

/** 用 replay 接口探测 cookie 是否仍然有效 */
async function isCookieAlive(captureResult) {
  try {
    const replayRequest = api.replay.buildRequest({
      overviewUrl: captureResult.summary.overviewUrl,
      cookieHeader: captureResult.cookieHeader,
      request: captureResult.request,
    });
    const response = await fetch(replayRequest.url, replayRequest.options);
    if (!response.ok) return false;
    const json = await response.json();
    return json?.code === 0;
  } catch (_e) {
    return false;
  }
}

/** 纯 fetch 流程：cookie 有效时跳过浏览器，直接抓取所有接口数据 */
async function runFetchFlow(accountId) {
  const paths = getPaths(accountId);

  const cached = JSON.parse(await fs.readFile(paths.latestCapturePath, "utf8"));
  const overviewUrl = cached.summary.overviewUrl;
  const cookieHeader = cached.cookieHeader;
  const request = cached.request;

  // 用 replay 拿昨日单天数据作为 overview
  const replayRequest = api.replay.buildRequest({ overviewUrl, cookieHeader, request });
  const replayResponse = await fetch(replayRequest.url, replayRequest.options);
  const replayJson = await parseResponseBody(replayResponse);

  const captureResult = {
    capturedAt: new Date().toISOString(),
    cookieHeader,
    summary: cached.summary,
    request,
    storeName: cached.storeName,
    parsedOverview: replayResponse.ok ? parseOverview(replayJson) : cached.parsedOverview,
    replay: {
      ok: replayResponse.ok,
      status: replayResponse.status,
      url: replayRequest.url,
      topLevelKeys: replayJson && typeof replayJson === "object" ? Object.keys(replayJson) : [],
    },
  };

  if (replayResponse.ok) {
    await saveJson(paths.latestOverviewParsedPath, captureResult.parsedOverview);
  }

  try {
    const req = api.flowAnalysis.buildRequest({ overviewUrl, cookieHeader, request });
    const res = await fetch(req.url, req.options);
    const json = await parseResponseBody(res);
    captureResult.flowAnalysis = { ok: res.ok, status: res.status, url: req.url, metrics: api.flowAnalysis.extractMetrics(json) };
  } catch (error) {
    captureResult.flowAnalysis = { ok: false, status: null, url: null, metrics: {}, error: error.message };
  }

  try {
    const req = api.promoFinance.buildRequest({ cookieHeader, request });
    const res = await fetch(req.url, req.options);
    const json = await parseResponseBody(res);
    captureResult.promoFinance = { ok: res.ok, status: res.status, url: req.url, metrics: api.promoFinance.extractMetrics(json) };
  } catch (error) {
    captureResult.promoFinance = { ok: false, status: null, url: null, metrics: {}, error: error.message };
  }

  try {
    const req = api.promoBoardReport.buildRequest({ cookieHeader, request });
    const res = await fetch(req.url, req.options);
    const json = await parseResponseBody(res);
    captureResult.promoBoardReport = { ok: res.ok, status: res.status, url: req.url, metrics: api.promoBoardReport.extractMetrics(json) };
  } catch (error) {
    captureResult.promoBoardReport = { ok: false, status: null, url: null, metrics: {}, error: error.message };
  }

  try {
    const req = api.promoCodeKpi.buildRequest({ overviewUrl, cookieHeader, request });
    const res = await fetch(req.url, req.options);
    const json = await parseResponseBody(res);
    captureResult.promoCodeKpi = { ok: res.ok, status: res.status, url: req.url, metrics: api.promoCodeKpi.extractMetrics(json) };
  } catch (error) {
    captureResult.promoCodeKpi = { ok: false, status: null, url: null, metrics: {}, error: error.message };
  }

  try {
    const req = api.adOrder.buildRequest({ overviewUrl, cookieHeader, request });
    const res = await fetch(req.url, req.options);
    const json = await parseResponseBody(res);
    captureResult.adOrder = { ok: res.ok, status: res.status, url: req.url, metrics: api.adOrder.extractMetrics(json) };
  } catch (error) {
    captureResult.adOrder = { ok: false, status: null, url: null, metrics: {}, error: error.message };
  }

  try {
    const req = api.trade.buildRequest({ overviewUrl, cookieHeader, request });
    const res = await fetch(req.url, req.options);
    const json = await parseResponseBody(res);
    captureResult.trade = { ok: res.ok, status: res.status, url: req.url, metrics: api.trade.extractMetrics(json) };
  } catch (error) {
    captureResult.trade = { ok: false, status: null, url: null, metrics: {}, error: error.message };
  }

  await saveJson(paths.latestCapturePath, captureResult);

  return { captureResult, accountId, paths };
}

/**
 * 新增门店时传 null/undefined，系统使用临时目录并在扫码后自动从 postData.shopIds
 * 提取账号 ID；重新抓取已有门店时传已知的 accountId。
 */
async function runCaptureFlow(accountId) {
  // 已有账号时，先尝试用缓存 cookie 直接 fetch，跳过浏览器
  if (accountId) {
    const paths = getPaths(accountId);
    try {
      const cached = JSON.parse(await fs.readFile(paths.latestCapturePath, "utf8"));
      const alive = await isCookieAlive(cached);
      if (alive) {
        console.log("[browser-flow] cookie 有效，跳过浏览器直接抓取");
        return runFetchFlow(accountId);
      }
      console.log("[browser-flow] cookie 已失效，启动浏览器重新登录");
    } catch (_e) {
      // 没有缓存文件，走浏览器流程
    }
  }

  return runBrowserFlow(accountId);
}

async function runBrowserFlow(accountId) {
  const isNew = !accountId;
  const launchAccountId = isNew ? "_new" : accountId;
  const launchPaths = getPaths(launchAccountId);
  await ensureDataDir(launchPaths.dataDir);

  let paths = launchPaths;
  let realAccountId = launchAccountId;
  const chromeProcessIdsBeforeLaunch =
    process.platform === "win32" ? await getWindowsChromeProcessIds() : [];

  const context = await chromium.launchPersistentContext(launchPaths.profileDir, {
    channel: "chrome",
    headless: false,
    viewport: null,
  });
  const launchedChromeProcessIds =
    process.platform === "win32"
      ? diffProcessIds(chromeProcessIdsBeforeLaunch, await getWindowsChromeProcessIds())
      : [];

  try {
    const page = context.pages()[0] || (await context.newPage());
    const overviewResponsePromise = createOverviewWatcher(page);

    await page.goto(JINGYINGBAO_URL, { waitUntil: "domcontentloaded" });

    await waitForMerchantPage(page);

    try {
      await Promise.race([overviewResponsePromise, page.waitForTimeout(8_000)]);
    } catch (_error) {
      // Ignore here and try to navigate the menu below.
    }

    await tryOpenOverviewPage(page, launchPaths);

    const overviewResponse = await overviewResponsePromise;
    const overviewJson = await overviewResponse.json();

    const shopName = await extractShopName(page);
    if (shopName) {
      console.log(`[browser-flow] 提取到门店名称: ${shopName}`);
    } else {
      try {
        const headerClasses = await page.evaluate(() => {
          const els = document.querySelectorAll("header *, nav *, .nav-header *");
          return [...els]
            .filter((el) => el.textContent.trim().length > 3)
            .map((el) => ({ tag: el.tagName, class: el.className, text: el.textContent.trim().slice(0, 30) }))
            .slice(0, 20);
        });
        console.log("[browser-flow] 未命中门店名，header 元素候选:", JSON.stringify(headerClasses, null, 2));
      } catch (_e) {}
    }

    const cookies = await context.cookies("https://e.dianping.com");

    const captureResult = buildCaptureResult({
      overviewUrl: overviewResponse.url(),
      cookies,
      overviewJson,
    });

    captureResult.request = {
      method: overviewResponse.request().method(),
      postData: overviewResponse.request().postData() || "",
      headers: await overviewResponse.request().allHeaders(),
      finalPageUrl: page.url(),
    };

    if (isNew) {
      const postParams = new URLSearchParams(captureResult.request.postData);
      const shopId = postParams.get("shopIds") || `store-${Date.now()}`;
      realAccountId = shopId;
      paths = getPaths(realAccountId);
      await ensureDataDir(paths.dataDir);
    }

    if (shopName) {
      await saveJson(path.join(paths.dataDir, "settings.json"), { storeName: shopName });
      captureResult.storeName = shopName;
    }

    await context.storageState({ path: paths.storageStatePath });
    captureResult.parsedOverview = parseOverview(overviewJson);

    try {
      const req = api.flowAnalysis.buildRequest({ overviewUrl: overviewResponse.url(), cookieHeader: captureResult.cookieHeader, request: captureResult.request });
      const res = await fetch(req.url, req.options);
      const json = await parseResponseBody(res);
      captureResult.flowAnalysis = { ok: res.ok, status: res.status, url: req.url, metrics: api.flowAnalysis.extractMetrics(json) };
    } catch (error) {
      captureResult.flowAnalysis = { ok: false, status: null, url: null, metrics: {}, error: error.message };
    }

    try {
      const req = api.promoFinance.buildRequest({ cookieHeader: captureResult.cookieHeader, request: captureResult.request });
      const res = await fetch(req.url, req.options);
      const json = await parseResponseBody(res);
      captureResult.promoFinance = { ok: res.ok, status: res.status, url: req.url, metrics: api.promoFinance.extractMetrics(json) };
    } catch (error) {
      captureResult.promoFinance = { ok: false, status: null, url: null, metrics: {}, error: error.message };
    }

    try {
      const req = api.promoBoardReport.buildRequest({ cookieHeader: captureResult.cookieHeader, request: captureResult.request });
      const res = await fetch(req.url, req.options);
      const json = await parseResponseBody(res);
      captureResult.promoBoardReport = { ok: res.ok, status: res.status, url: req.url, metrics: api.promoBoardReport.extractMetrics(json) };
    } catch (error) {
      captureResult.promoBoardReport = { ok: false, status: null, url: null, metrics: {}, error: error.message };
    }

    try {
      const req = api.promoCodeKpi.buildRequest({ overviewUrl: overviewResponse.url(), cookieHeader: captureResult.cookieHeader, request: captureResult.request });
      const res = await fetch(req.url, req.options);
      const json = await parseResponseBody(res);
      captureResult.promoCodeKpi = { ok: res.ok, status: res.status, url: req.url, metrics: api.promoCodeKpi.extractMetrics(json) };
    } catch (error) {
      captureResult.promoCodeKpi = { ok: false, status: null, url: null, metrics: {}, error: error.message };
    }

    try {
      const req = api.adOrder.buildRequest({ overviewUrl: overviewResponse.url(), cookieHeader: captureResult.cookieHeader, request: captureResult.request });
      const res = await fetch(req.url, req.options);
      const json = await parseResponseBody(res);
      captureResult.adOrder = { ok: res.ok, status: res.status, url: req.url, metrics: api.adOrder.extractMetrics(json) };
    } catch (error) {
      captureResult.adOrder = { ok: false, status: null, url: null, metrics: {}, error: error.message };
    }

    try {
      const req = api.trade.buildRequest({ overviewUrl: overviewResponse.url(), cookieHeader: captureResult.cookieHeader, request: captureResult.request });
      const res = await fetch(req.url, req.options);
      const json = await parseResponseBody(res);
      captureResult.trade = { ok: res.ok, status: res.status, url: req.url, metrics: api.trade.extractMetrics(json) };
    } catch (error) {
      captureResult.trade = { ok: false, status: null, url: null, metrics: {}, error: error.message };
    }

    const replayRequest = api.replay.buildRequest({
      overviewUrl: overviewResponse.url(),
      cookieHeader: captureResult.cookieHeader,
      request: captureResult.request,
    });
    const replayResponse = await fetch(replayRequest.url, replayRequest.options);
    const replayJson = await parseResponseBody(replayResponse);

    if (replayResponse.ok) {
      captureResult.parsedOverview = parseOverview(replayJson);
    }

    captureResult.replay = {
      ok: replayResponse.ok,
      status: replayResponse.status,
      url: replayRequest.url,
      topLevelKeys: replayJson && typeof replayJson === "object" ? Object.keys(replayJson) : [],
    };

    await saveJson(paths.latestCapturePath, captureResult);
    await saveJson(paths.latestOverviewParsedPath, captureResult.parsedOverview);

    return { captureResult, accountId: realAccountId, paths };
  } catch (error) {
    throw error;
  } finally {
    await closeContextForcefully(context, launchPaths.profileDir, launchedChromeProcessIds);

    if (isNew && realAccountId !== "_new") {
      try {
        const properPaths = getPaths(realAccountId);
        await fs.rm(properPaths.profileDir, { recursive: true, force: true });
        await renameWithRetry(launchPaths.profileDir, properPaths.profileDir);
      } catch (renameErr) {
        console.error("[browser-flow] profile 移动失败，下次需重新扫码:", renameErr.message);
      }
      await fs.rm(launchPaths.dataDir, { recursive: true, force: true }).catch(() => {});
    } else if (isNew && realAccountId === "_new") {
      await fs.rm(launchPaths.dataDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

module.exports = {
  runCaptureFlow,
  getPaths,
  diffProcessIds,
  parseTasklistProcessIds,
};
