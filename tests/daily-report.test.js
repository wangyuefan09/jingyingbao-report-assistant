const assert = require("node:assert/strict");

const { buildDailyReport } = require("../src/lib/daily-report");

function buildParsedOverview() {
  return {
    parsedAt: "2026-05-07T13:45:41.346Z",
    source: {
      type: "component",
      code: 0,
      msg: "ok",
      success: true,
      pageName: null,
      componentCount: 7,
    },
    sections: {
      traffic: {
        metrics: {
          view_uv: {
            label: "曝光人数",
            value: 1184,
            rawValue: "1,184",
            series: [262, 726, 1100, 1364, 1276, 1278, 1184],
          },
          shop_uv: {
            label: "访问人数",
            value: 151,
            rawValue: "151",
            series: [80, 168, 165, 188, 164, 187, 151],
          },
          buy_uv: {
            label: "下单人数",
            value: 11,
            rawValue: "11",
            series: [6, 20, 17, 16, 10, 30, 11],
          },
          csm_uv: {
            label: "核销人次",
            value: 16,
            rawValue: "16",
            series: [6, 16, 15, 14, 11, 26, 16],
          },
        },
      },
      sales: {
        metrics: {
          ind_buy_cnt: {
            label: "下单券数",
            value: 13,
            rawValue: "13",
            graph: {
              xAxis: ["04/30", "05/01", "05/02", "05/03", "05/04", "05/05", "05/06"],
              series: [{ name: "下单券数", data: [6, 20, 19, 20, 12, 40, 13] }],
            },
          },
          ind_buy_amt: {
            label: "下单金额（原价）",
            value: 5554,
            rawValue: "5,554",
            graph: {
              xAxis: ["04/30", "05/01", "05/02", "05/03", "05/04", "05/05", "05/06"],
              series: [{ name: "下单金额（原价）", data: [2528, 8768, 8940, 8328, 6184, 12508, 5554] }],
            },
          },
        },
      },
      trade: {
        metrics: {
          csm_cnt: {
            label: "核销券数",
            value: 16,
            rawValue: "16",
            graph: {
              xAxis: ["04/30", "05/01", "05/02", "05/03", "05/04", "05/05", "05/06"],
              series: [{ name: "核销券数", data: [4, 18, 15, 18, 13, 27, 16] }],
            },
          },
          csm_amt: {
            label: "核销金额（原价）",
            value: 6808,
            rawValue: "6,808",
            graph: {
              xAxis: ["04/30", "05/01", "05/02", "05/03", "05/04", "05/05", "05/06"],
              series: [{ name: "核销金额（原价）", data: [1988, 7108, 6470, 7808, 5816, 12196, 6808] }],
            },
          },
        },
      },
      reviews: {
        metrics: {
          review_new_cnt: {
            label: "新增评价数",
            value: 30,
            rawValue: "30",
          },
        },
      },
      im: {
        metrics: {
          ask_user_cnt: {
            label: "在线咨询人数",
            value: 57,
            rawValue: "57",
          },
        },
      },
      advertising: {
        title: "推广通数据",
        spend: {
          label: "近7天花费金额",
          value: 780.91,
          rawValue: "￥780.91",
          currency: "CNY",
        },
      },
    },
  };
}

module.exports = [
  {
    name: "buildDailyReport formats the final daily copy text from the latest series values",
    fn() {
      const report = buildDailyReport({
        parsedOverview: buildParsedOverview(),
        flowMetrics: {
          "新增收藏人数": { label: "新增收藏人数", value: "2" },
          "新增打卡人数": { label: "新增打卡人数", value: "0" },
        },
        promoFinanceMetrics: {
          "推广通余额": { label: "推广通余额", value: "171.05" },
        },
        promoBoardMetrics: {
          "花费(元)": { label: "花费(元)", value: "124.44" },
          "点击均价": { label: "点击均价", value: "1.45" },
          "7日团购订单量": { label: "7日团购订单量", value: "7" },
          "查看电话(次)": { label: "查看电话(次)", value: "6" },
          "查看地址(次)": { label: "查看地址(次)", value: "41" },
        },
        promoCodeMetrics: {
          "扫码评价数": { label: "扫码评价数", value: "55" },
        },
        adOrderMetrics: {
          "广告单": { label: "广告单", value: "10" },
        },
        storeName: "仟逸轩·轻奢足疗·养生会馆(阎良区店)",
        note: "今天邮件已查看，无违规无异常。",
        datePreset: "yesterday",
        dateSourcePostData:
          "source=1&device=pc&date=2026-04-30%2C2026-05-06&platform=0&shopIds=123",
        now: new Date("2026-05-20T12:00:00+08:00"),
      });

      assert.equal(report.storeName, "仟逸轩·轻奢足疗·养生会馆(阎良区店)");
      assert.equal(report.note, "今天邮件已查看，无违规无异常。");
      assert.equal(report.dateLabel, "2026-05-19");
      assert.equal(report.values["曝光人数"], "1,184");
      assert.equal(report.values["访问人数"], "151");
      assert.equal(report.values["下单人数"], "11");
      assert.equal(report.values["下单券数"], "13");
      assert.equal(report.values["核销人数"], "16");
      assert.equal(report.values["核销券数"], "16");
      assert.equal(report.values["下单售价金额"], "5,554");
      assert.equal(report.values["核销售价金额"], "6,808");
      assert.equal(report.values["电话点击"], "6");
      assert.equal(report.values["地址点击"], "41");
      assert.equal(report.values["在线咨询"], "57");
      assert.equal(report.values["新增收藏"], "2");
      assert.equal(report.values["新增打卡"], "0");
      assert.equal(report.values["新增评价"], "30");
      assert.equal(report.values["推广通消耗"], "124.44");
      assert.equal(report.values["推广通点击单价"], "1.45");
      assert.equal(report.values["推广通下单量"], "7");
      assert.equal(report.values["推广通余额"], "171.05");
      assert.equal(report.values["近7天优惠码订单是否达标"], "55（达标）");
      assert.equal(report.values["广告单"], "10");
      assert.equal(report.values["留评率（30%达标）"], "272.73%");
      assert.equal(report.values["收藏率（40%达标）"], "18.18%");

      assert.ok(!report.missingFields.includes("电话点击"));
      assert.ok(!report.missingFields.includes("地址点击"));
      assert.ok(!report.missingFields.includes("在线咨询"));
      assert.ok(!report.missingFields.includes("新增评价"));
      assert.ok(!report.missingFields.includes("推广通消耗"));
      assert.ok(!report.missingFields.includes("近7天优惠码订单是否达标"));
      assert.ok(!report.missingFields.includes("广告单"));
      assert.ok(!report.missingFields.includes("留评率（30%达标）"));
      assert.ok(!report.missingFields.includes("收藏率（40%达标）"));

      assert.deepEqual(report.supplemental, [
        { label: "推广通近7天花费金额", value: "￥780.91" },
      ]);

      assert.equal(
        report.text,
        [
          "仟逸轩·轻奢足疗·养生会馆(阎良区店)\t今天邮件已查看，无违规无异常。",
          "数据报表\t2026-05-19",
          "【美团点评广告结果数据】",
          "曝光人数：1,184",
          "访问人数：151",
          "下单人数：11",
          "下单券数：13",
          "核销人数：16",
          "核销券数：16",
          "电话点击：6",
          "地址点击：41",
          "在线咨询：57",
          "",
          "【店内干预数据】",
          "新增收藏：2",
          "新增打卡：0",
          "新增评价：30",
          "",
          "【推广通数据】",
          "推广通消耗：124.44",
          "推广通点击单价：1.45",
          "推广通下单量：7",
          "推广通余额：171.05",
          "",
          "留评率（30%达标）：272.73%",
          "收藏率（40%达标）：18.18%",
          "近7天优惠码订单是否达标：55（达标）",
          "广告单：10",
          "",
          "下单售价金额：5,554",
          "核销售价金额：6,808",
          "优惠后核销金额：--",
        ].join("\n")
      );
    },
  },
  {
    name: "buildDailyReport falls back to placeholders when there is no parsed overview",
    fn() {
      const report = buildDailyReport({
        parsedOverview: null,
        flowMetrics: null,
        promoFinanceMetrics: null,
        promoBoardMetrics: null,
        storeName: "",
        note: "",
        datePreset: "today",
        now: new Date("2026-05-19T12:00:00+08:00"),
      });

      assert.equal(report.storeName, "门店名称待填写");
      assert.equal(report.note, "今天邮件已查看，无违规无异常。");
      assert.equal(report.dateLabel, "2026-05-19");
      assert.equal(report.values["曝光人数"], "--");
      assert.ok(report.text.includes("数据报表\t2026-05-19"));
    },
  },
  {
    name: "buildDailyReport prefers overview daily points over page aggregate cards for core metrics",
    fn() {
      const report = buildDailyReport({
        parsedOverview: buildParsedOverview(),
        flowMetrics: null,
        promoFinanceMetrics: null,
        promoBoardMetrics: null,
        storeName: "",
        note: "",
        datePreset: "recent7",
        now: new Date("2026-05-19T12:00:00+08:00"),
      });

      assert.equal(report.values["曝光人数"], "1,184");
      assert.equal(report.values["访问人数"], "151");
      assert.equal(report.values["下单人数"], "11");
      assert.equal(report.values["下单券数"], "13");
      assert.equal(report.values["核销人数"], "16");
      assert.equal(report.values["核销券数"], "16");
      assert.equal(report.values["下单售价金额"], "5,554");
      assert.equal(report.values["核销售价金额"], "6,808");
      assert.equal(report.dateLabel, "2026-05-13 ~ 2026-05-19");
    },
  },
  {
    name: "buildDailyReport keeps rate placeholders when 下单人数 missing or zero",
    fn() {
      const report = buildDailyReport({
        parsedOverview: null,
        flowMetrics: {
          "新增收藏人数": { label: "新增收藏人数", value: "2" },
        },
        promoFinanceMetrics: null,
        promoBoardMetrics: null,
        promoCodeMetrics: {
          "扫码评价数": { label: "扫码评价数", value: "10" },
        },
        tradeMetrics: null,
        storeName: "",
        note: "",
        datePreset: "today",
        now: new Date("2026-05-19T12:00:00+08:00"),
      });

      assert.equal(report.values["下单人数"], "--");
      assert.equal(report.values["近7天优惠码订单是否达标"], "10（不达标）");
      assert.equal(report.values["留评率（30%达标）"], "--");
      assert.equal(report.values["收藏率（40%达标）"], "--");
    },
  },
];
