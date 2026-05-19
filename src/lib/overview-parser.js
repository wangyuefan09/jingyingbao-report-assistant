const COMPONENT_SECTION_MAP = {
  trafficSummaryLineTrade: "traffic",
  salesTabGraph: "sales",
  tradeTabGraph: "trade",
  reviewSummaryPC: "reviews",
  starSummaryPC: "stars",
  imSummaryPC: "im",
  midasAdvertisingPC: "advertising",
};

function cleanLabel(value) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  return value.trim().replace(/[：:]+$/, "");
}

function stripHtml(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/<[^>]*>/g, "").trim();
}

function roundNumber(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Number(value.toFixed(10));
}

function normalizeNumber(rawValue) {
  if (typeof rawValue !== "string") {
    return {
      rawValue: rawValue ?? null,
      value: null,
      unit: null,
      displayUnit: null,
      currency: null,
    };
  }

  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === "--") {
    return {
      rawValue: trimmed || null,
      value: null,
      unit: null,
      displayUnit: null,
      currency: null,
    };
  }

  let candidate = trimmed.replace(/,/g, "").replace(/\s+/g, "");
  let currency = null;

  if (candidate.startsWith("￥")) {
    currency = "CNY";
    candidate = candidate.slice(1);
  }

  const match = candidate.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
  if (!match) {
    return {
      rawValue: trimmed,
      value: null,
      unit: null,
      displayUnit: null,
      currency,
    };
  }

  const baseValue = Number(match[1]);
  const unit = match[2] || null;
  const scaleUnit = unit && (unit.startsWith("万") || unit.startsWith("亿")) ? unit[0] : null;

  let value = baseValue;
  if (scaleUnit === "万") {
    value = baseValue * 10_000;
  } else if (scaleUnit === "亿") {
    value = baseValue * 100_000_000;
  }

  return {
    rawValue: trimmed,
    value: roundNumber(value),
    unit: unit || null,
    displayUnit: scaleUnit,
    currency,
  };
}

function parseTrend(rawValue) {
  const text = stripHtml(rawValue);
  if (!text) {
    return {
      rawValue: rawValue ?? null,
      text: null,
      value: null,
      unit: null,
      direction: null,
    };
  }

  if (text === "持平") {
    return {
      rawValue,
      text,
      value: 0,
      unit: null,
      direction: "flat",
    };
  }

  const numeric = normalizeNumber(text);

  let direction = null;
  if (typeof rawValue === "string" && rawValue.includes("down")) {
    direction = "down";
  } else if (typeof rawValue === "string" && rawValue.includes("up")) {
    direction = "up";
  } else if (text.startsWith("-")) {
    direction = "down";
  } else if (text.startsWith("+")) {
    direction = "up";
  }

  return {
    rawValue,
    text,
    value: numeric.value,
    unit: numeric.unit,
    direction,
  };
}

function parseGraph(graph) {
  const graphData = graph?.data;
  if (!graphData || !Array.isArray(graphData.xAxis)) {
    return null;
  }

  return {
    type: graph?.type || graphData.type || null,
    xAxis: graphData.xAxis,
    series: Array.isArray(graphData.series)
      ? graphData.series.map((item) => ({
          name: item?.name ?? null,
          data: Array.isArray(item?.data) ? item.data : [],
        }))
      : [],
  };
}

function buildMetric(component, entry) {
  const normalized = normalizeNumber(entry?.value);

  return {
    label: entry?.name ?? null,
    variable: entry?.variable ?? null,
    componentId: component?.componentId ?? null,
    rawValue: normalized.rawValue,
    value: normalized.value,
    unit: entry?.suffix || normalized.unit,
    displayUnit: normalized.displayUnit,
    currency: normalized.currency,
    trendLabel: entry?.subName ?? null,
    trend: parseTrend(entry?.subValue),
    series: Array.isArray(entry?.line?.yAxis) ? entry.line.yAxis : null,
    lineColor: entry?.line?.color ?? null,
    graph: parseGraph(entry?.graph),
    platform: entry?.star?.platform ?? null,
    starValue: entry?.star?.value ?? null,
  };
}

function buildMetricSection(component) {
  const items = [];
  const metrics = {};

  for (const entry of Array.isArray(component?.body) ? component.body : []) {
    const metric = buildMetric(component, entry);
    const key = entry?.variable || entry?.star?.platform || entry?.name;
    if (key) {
      metrics[key] = metric;
    }
    items.push(metric);
  }

  return {
    componentId: component?.componentId ?? null,
    title: cleanLabel(component?.head?.name),
    dateLabel: cleanLabel(component?.head?.subName),
    metrics,
    items,
  };
}

function parseAdvertisingSubTitle(subTitle) {
  if (typeof subTitle !== "string" || !subTitle.trim()) {
    return null;
  }

  const normalizedText = subTitle.trim();
  const separatorIndex = normalizedText.search(/[：:]/);
  if (separatorIndex === -1) {
    const numeric = normalizeNumber(normalizedText);
    return {
      label: normalizedText,
      ...numeric,
    };
  }

  const label = cleanLabel(normalizedText.slice(0, separatorIndex));
  const rawValue = normalizedText.slice(separatorIndex + 1).trim();
  return {
    label,
    ...normalizeNumber(rawValue),
  };
}

function buildAdvertisingSection(component) {
  const body = component?.body && typeof component.body === "object" ? component.body : {};
  const spend = parseAdvertisingSubTitle(body.subTitle);

  return {
    componentId: component?.componentId ?? null,
    title: cleanLabel(body.title),
    rawTitle: body.title ?? null,
    subTitle: body.subTitle ?? null,
    spend,
    link: body.link ?? null,
    icon: body.icon ?? null,
  };
}

function buildReport(sections) {
  const report = {};

  for (const section of Object.values(sections)) {
    if (!section || typeof section !== "object") {
      continue;
    }

    if (section.metrics && typeof section.metrics === "object") {
      for (const metric of Object.values(section.metrics)) {
        if (metric?.label) {
          report[metric.label] = metric;
        }
      }
    }

    if (section.platforms && typeof section.platforms === "object") {
      for (const metric of Object.values(section.platforms)) {
        if (metric?.label) {
          report[metric.label] = metric;
        }
      }
    }
  }

  if (sections.advertising?.spend?.label) {
    const prefix = (sections.advertising.title || "推广通").replace(/数据$/, "");
    report[`${prefix}${sections.advertising.spend.label}`] = sections.advertising.spend;
  }

  return report;
}

function parseOverview(overviewJson) {
  if (!overviewJson || typeof overviewJson !== "object") {
    return {
      parsedAt: null,
      source: {
        type: null,
        code: null,
        msg: null,
        success: false,
        pageName: null,
        componentCount: 0,
      },
      sections: {},
      report: {},
    };
  }

  const components = Array.isArray(overviewJson.data) ? overviewJson.data : [];
  const sections = {};

  for (const component of components) {
    const sectionKey = COMPONENT_SECTION_MAP[component?.componentId];
    if (!sectionKey) {
      continue;
    }

    if (sectionKey === "advertising") {
      sections[sectionKey] = buildAdvertisingSection(component);
      continue;
    }

    const section = buildMetricSection(component);
    if (sectionKey === "stars") {
      section.platforms = Object.fromEntries(
        section.items
          .filter((item) => item.platform)
          .map((item) => [item.platform, item])
      );
    }
    sections[sectionKey] = section;
  }

  return {
    parsedAt: new Date().toISOString(),
    source: {
      type: overviewJson.type ?? null,
      code: overviewJson.code ?? null,
      msg: overviewJson.msg ?? null,
      success: Boolean(overviewJson.success),
      pageName: overviewJson.pageName ?? null,
      componentCount: components.length,
    },
    sections,
    report: buildReport(sections),
  };
}

module.exports = {
  parseOverview,
  normalizeNumber,
};
