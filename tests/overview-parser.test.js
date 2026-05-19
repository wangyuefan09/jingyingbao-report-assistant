const assert = require("node:assert/strict");

const { parseOverview } = require("../src/lib/overview-parser");

function buildSampleOverview() {
  return {
    type: "component",
    code: 0,
    msg: "ok",
    title: null,
    success: true,
    pageName: "overview",
    data: [
      {
        head: {
          name: "客流分析",
          subName: "近7天",
        },
        componentId: "trafficSummaryLineTrade",
        body: [
          {
            name: "曝光人数",
            variable: "view_uv",
            suffix: "人",
            value: "7,190",
            subName: "较上7天",
            subValue: '<i class="up">+334%</i>',
            line: {
              type: "line",
              color: "#FFAF2E",
              yAxis: [262, 726, 1100, 1364, 1276, 1278, 1184],
            },
          },
          {
            name: "访问人数",
            variable: "shop_uv",
            suffix: "人",
            value: "1,103",
            subName: "较上7天",
            subValue: '<i class="up">+207%</i>',
            line: {
              type: "line",
              color: "#2BB0FF",
              yAxis: [80, 168, 165, 188, 164, 187, 151],
            },
          },
          {
            name: "下单人数",
            variable: "buy_uv",
            suffix: "人",
            value: "110",
            subName: "较上7天",
            subValue: '<i class="up">+1267%</i>',
            line: {
              type: "line",
              color: "#FA6673",
              yAxis: [1, 4, 1, 3, 4, 3, 11],
            },
          },
          {
            name: "核销人次",
            variable: "csm_uv",
            suffix: "人",
            value: "104",
            subName: "较上7天",
            subValue: '<i class="up">+3367%</i>',
            line: {
              type: "line",
              color: "#A06BFF",
              yAxis: [0, 4, 1, 1, 3, 1, 16],
            },
          },
        ],
      },
      {
        head: {
          name: "下单分析",
          subName: "近7天",
        },
        componentId: "salesTabGraph",
        body: [
          {
            name: "下单券数",
            variable: "ind_buy_cnt",
            value: "130",
            subName: "较上7天",
            subValue: '<i class="up">+2500%</i>',
            graph: {
              type: "line",
              data: {
                type: "line",
                xAxis: ["04/30", "05/01", "05/02", "05/03", "05/04", "05/05", "05/06"],
                series: [{ name: "下单券数", data: [6, 20, 19, 20, 12, 40, 13] }],
              },
            },
          },
          {
            name: "下单金额（原价）",
            variable: "ind_buy_amt",
            value: "5.56万",
            subName: "较上7天",
            subValue: '<i class="up">+1247%</i>',
            graph: {
              type: "line",
              data: {
                type: "line",
                xAxis: ["04/30", "05/01", "05/02", "05/03", "05/04", "05/05", "05/06"],
                series: [{ name: "下单金额（原价）", data: [2528, 8768, 8940, 8328, 6184, 12508, 5554] }],
              },
            },
          },
        ],
      },
      {
        head: {
          name: "核销分析",
          subName: "近7天",
        },
        componentId: "tradeTabGraph",
        body: [
          {
            name: "核销金额（原价）",
            variable: "csm_amt",
            value: "4.82万",
            subName: "较上7天",
            subValue: '<i class="up">+6824%</i>',
            graph: {
              type: "line",
              data: {
                type: "line",
                xAxis: ["04/30", "05/01", "05/02", "05/03", "05/04", "05/05", "05/06"],
                series: [{ name: "核销金额（原价）", data: [1988, 7108, 6470, 7808, 5816, 12196, 6808] }],
              },
            },
          },
          {
            name: "核销券数",
            variable: "csm_cnt",
            value: "111",
            subName: "较上7天",
            subValue: '<i class="up">+3600%</i>',
            graph: {
              type: "line",
              data: {
                type: "line",
                xAxis: ["04/30", "05/01", "05/02", "05/03", "05/04", "05/05", "05/06"],
                series: [{ name: "核销券数", data: [4, 18, 15, 18, 13, 27, 16] }],
              },
            },
          },
        ],
      },
      {
        head: {
          name: "评价分析",
          subName: "近7天",
        },
        componentId: "reviewSummaryPC",
        body: [
          {
            name: "新增评价数",
            variable: "review_new_cnt",
            value: "30",
            subName: "较上7天",
            subValue: '<i class="up">+173%</i>',
          },
          {
            name: "新增差评数",
            variable: "bad_review_new_cnt",
            value: "0",
            subName: "较上7天",
            subValue: "持平",
          },
          {
            name: "差评回复率",
            variable: "bad_review_reply_rate",
            value: "--",
            subName: "较上7天",
            subValue: "持平",
          },
        ],
      },
      {
        head: {
          name: "星级分析",
          subName: "近7天",
        },
        componentId: "starSummaryPC",
        body: [
          {
            name: "大众点评星级",
            value: "3.8星",
            subName: "较上7天",
            subValue: "持平",
            star: {
              value: 35,
              platform: "dp",
            },
          },
          {
            name: "美团星级",
            value: "4.7星",
            subName: "较上7天",
            subValue: "持平",
            star: {
              value: 45,
              platform: "mt",
            },
          },
        ],
      },
      {
        head: {
          name: "咨询分析",
          subName: "近7天",
        },
        componentId: "imSummaryPC",
        body: [
          {
            name: "在线咨询人数",
            variable: "ask_user_cnt",
            value: "57",
            subName: "较上7天",
            subValue: '<i class="up">+111%</i>',
            subVariable: "",
          },
          {
            name: "平均响应时长",
            variable: "avg_reply_duration",
            value: "22.8分钟",
            subName: "较上7天",
            subValue: '<i class="down">-76%</i>',
            subVariable: "",
          },
        ],
      },
      {
        componentId: "midasAdvertisingPC",
        body: {
          title: "推广通数据：",
          subTitle: "近7天花费金额：￥780.91",
          icon: "https://example.com/icon.png",
          link: {
            name: "查看更多",
            url: "//e.dianping.com/app/peon-merchant-product-menu/html/index.html",
          },
        },
      },
    ],
  };
}

module.exports = [
  {
    name: "parseOverview extracts structured sections and normalized values",
    fn() {
      const parsed = parseOverview(buildSampleOverview());

      assert.equal(parsed.source.componentCount, 7);
      assert.equal(parsed.sections.traffic.title, "客流分析");
      assert.equal(parsed.sections.traffic.metrics.view_uv.value, 7190);
      assert.equal(parsed.sections.traffic.metrics.view_uv.rawValue, "7,190");
      assert.equal(parsed.sections.traffic.metrics.view_uv.unit, "人");
      assert.equal(parsed.sections.traffic.metrics.view_uv.trend.value, 334);
      assert.equal(parsed.sections.traffic.metrics.view_uv.trend.direction, "up");
      assert.deepEqual(parsed.sections.traffic.metrics.view_uv.series, [262, 726, 1100, 1364, 1276, 1278, 1184]);

      assert.equal(parsed.sections.sales.metrics.ind_buy_amt.value, 55600);
      assert.equal(parsed.sections.sales.metrics.ind_buy_amt.displayUnit, "万");
      assert.deepEqual(parsed.sections.sales.metrics.ind_buy_cnt.graph.xAxis, [
        "04/30",
        "05/01",
        "05/02",
        "05/03",
        "05/04",
        "05/05",
        "05/06",
      ]);

      assert.equal(parsed.sections.trade.metrics.csm_amt.value, 48200);
      assert.equal(parsed.sections.reviews.metrics.bad_review_reply_rate.value, null);
      assert.equal(parsed.sections.reviews.metrics.bad_review_reply_rate.rawValue, "--");
      assert.equal(parsed.sections.stars.platforms.dp.value, 3.8);
      assert.equal(parsed.sections.stars.platforms.mt.value, 4.7);
      assert.equal(parsed.sections.im.metrics.avg_reply_duration.value, 22.8);
      assert.equal(parsed.sections.im.metrics.avg_reply_duration.unit, "分钟");

      assert.equal(parsed.sections.advertising.title, "推广通数据");
      assert.equal(parsed.sections.advertising.spend.label, "近7天花费金额");
      assert.equal(parsed.sections.advertising.spend.value, 780.91);
      assert.equal(parsed.sections.advertising.spend.currency, "CNY");

      assert.equal(parsed.report["曝光人数"].value, 7190);
      assert.equal(parsed.report["下单金额（原价）"].value, 55600);
      assert.equal(parsed.report["大众点评星级"].value, 3.8);
      assert.equal(parsed.report["推广通近7天花费金额"].value, 780.91);
    },
  },
  {
    name: "parseOverview tolerates missing sections and non-object input",
    fn() {
      assert.deepEqual(parseOverview(null), {
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
      });
    },
  },
];
