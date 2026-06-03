// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: tv;

/*
 * author   :  seiun
 * date     :  2021/10/20
 * build    :  2026-06-04 00:58:47
 * desc     :  B站榜单
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/BilibiliMonitor.tsx
var dependencyFileName = "Seiun.Env.js";
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, Utils, GenrateView, h } =
  runtimeRequire(dependencyFileName);
var rankTypeOptions = [
  "全站",
  "动画",
  "音乐",
  "游戏",
  "娱乐",
  "科技",
  "鬼畜",
  "舞蹈",
];
var rankTypes = {
  全站: 0,
  动画: 1,
  音乐: 3,
  游戏: 4,
  娱乐: 5,
  科技: 36,
  鬼畜: 119,
  舞蹈: 129,
};
var BilibiliMonitor = class extends WidgetBase {
  constructor(scriptName) {
    super(scriptName);
    this.name = "B站榜单";
    this.en = "BilibiliMonitor";
    this.widgetParam = args.widgetParameter;
    this.contentRowSpacing = 5;
    this.httpData = null;
    this.isRequestSuccess = false;
    this.ridTypeDic = rankTypes;
    this.currentSettings = {
      basicSettings: {
        ridType: { val: "全站", type: this.settingValTypeString },
        urlJumpType: { val: "跳转至app", type: this.settingValTypeString },
      },
      displaySettings: {
        mediaWidgetShowDataNum: { val: 6, type: this.settingValTypeInt },
        largeWidgetShowDataNum: { val: 15, type: this.settingValTypeInt },
        listDataColorShowType: {
          val: "随机颜色",
          type: this.settingValTypeString,
        },
        listDataUpdateTimeShowType: {
          val: "显示",
          type: this.settingValTypeString,
        },
      },
    };
    this.init = async () => {
      try {
        await this.getData();
      } catch (error) {
        console.log(error);
      }
    };
    this.renderMedium = async (widget) => {
      return await this.renderCommon(widget);
    };
    this.renderLarge = async (widget) => {
      return await this.renderCommon(widget);
    };
    this.Run();
  }
  async getData() {
    this.isRequestSuccess = false;
    try {
      const settingRid = this.currentSettings.basicSettings.ridType.val;
      const realRidId = this.widgetParam
        ? parseInt(this.widgetParam)
        : this.ridTypeDic[settingRid] || 0;
      this.httpData = await this.$request.get(
        `https://app.bilibili.com/x/v2/rank/region?rid=${realRidId}`,
      );
      this.isRequestSuccess = true;
      console.log(this.httpData);
    } catch (error) {
      console.log(error);
    }
  }
  Run() {
    if (!config.runsInApp) return;
    this.registerSettingCategory("basicSettings", "基础设置", [
      {
        title: "榜单类型",
        desc: "缺省值: 全站",
        icon: { name: "list.star", color: "#22B1EE" },
        type: "select",
        option: { ridType: "全站" },
        config: {
          selectOptions: rankTypeOptions.map((item) => ({
            label: item,
            value: item,
          })),
          defaultShowContent: "全站",
          multiple: false,
          editable: true,
        },
      },
      {
        title: "跳转方式",
        desc: "点击榜单条目链接跳转方式\n选择 跳转至app 时若未安装app，则会无响应\n缺省值: 跳转至app",
        icon: { name: "link", color: "#D371E3" },
        type: "select",
        option: { urlJumpType: "跳转至app" },
        config: {
          selectOptions: [
            { label: "跳转至浏览器", value: "跳转至浏览器" },
            { label: "跳转至app", value: "跳转至app" },
          ],
          defaultShowContent: "跳转至app",
          multiple: false,
        },
      },
    ]);
    this.registerSettingCategory("displaySettings", "显示设置", [
      {
        title: "中组件数据条数",
        desc: "缺省值：6",
        icon: { name: "number.square", color: "#5BD078" },
        type: "text",
        option: { mediaWidgetShowDataNum: "6" },
      },
      {
        title: "大组件数据条数",
        desc: "缺省值：15",
        icon: { name: "number.square", color: "#3478F6" },
        type: "text",
        option: { largeWidgetShowDataNum: "15" },
      },
      {
        title: "数据条目颜色",
        desc: "缺省值: 随机颜色",
        icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png",
        type: "select",
        option: { listDataColorShowType: "随机颜色" },
        config: {
          selectOptions: [
            { label: "组件文本颜色", value: "组件文本颜色" },
            { label: "随机颜色", value: "随机颜色" },
          ],
          defaultShowContent: "随机颜色",
          multiple: false,
        },
      },
      {
        title: "数据更新时间",
        desc: "缺省值: 显示",
        icon: { name: "arrow.clockwise", color: "#D11D0C" },
        type: "select",
        option: { listDataUpdateTimeShowType: "显示" },
        config: {
          selectOptions: [
            { label: "显示", value: "显示" },
            { label: "不显示", value: "不显示" },
          ],
          defaultShowContent: "显示",
          multiple: false,
        },
      },
    ]);
    this.registerSetting({
      title: "参数配置",
      icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/setting.png",
      onAction: async () => {
        await this.presentSettings(["basicSettings", "displaySettings"]);
      },
    });
  }
  decideGoto(item) {
    switch (this.currentSettings.basicSettings.urlJumpType.val) {
      case "跳转至浏览器":
        return `https://bilibili.com/${item.goto}${item.param}`;
      case "跳转至app":
        return item.uri;
      default:
        return void 0;
    }
  }
  async renderCommon(widget) {
    if (
      !this.httpData ||
      !(this.httpData.code === 0 || this.httpData.code === "0")
    )
      return;
    const itemCount =
      this.widgetFamily === "medium"
        ? this.currentSettings.displaySettings.mediaWidgetShowDataNum.val
        : this.currentSettings.displaySettings.largeWidgetShowDataNum.val;
    const items = this.httpData.data.splice(
      0,
      Math.min(itemCount, this.httpData.data.length),
    );
    items.forEach((item) => console.log(`• ${item.title}`));
    GenrateView.setListWidget(widget);
    return /* @__PURE__ */ h(
      "wbox",
      { spacing: this.contentRowSpacing },
      /* @__PURE__ */ h("wspacer", { length: this.contentRowSpacing }),
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor: this.widgetColor,
          font: new Font("SF Mono", 15),
          opacity: 0.7,
        },
        "💗 B站榜单",
      ),
      items.map((item) => {
        const itemColor =
          this.currentSettings.displaySettings.listDataColorShowType.val ===
          "随机颜色"
            ? new Color(Utils.randomColor16())
            : this.widgetColor;
        return /* @__PURE__ */ h(
          "wstack",
          { verticalAlign: "center", href: this.decideGoto(item) },
          /* @__PURE__ */ h(
            "wtext",
            {
              textColor: itemColor,
              font: Font.mediumSystemFont(12),
              maxLine: 1,
            },
            `• ${item.title}`,
          ),
          /* @__PURE__ */ h("wspacer", null),
          /* @__PURE__ */ h(
            "wtext",
            {
              textColor: itemColor,
              font: Font.systemFont(11),
              opacity: 0.6,
              textAlign: "right",
            },
            item.name || "",
          ),
        );
      }),
      this.currentSettings.displaySettings.listDataUpdateTimeShowType.val ===
        "显示" &&
        /* @__PURE__ */ h(
          "wstack",
          { verticalAlign: "center", padding: [0, 0, 5, 0] },
          /* @__PURE__ */ h("wspacer", null),
          /* @__PURE__ */ h("wimage", {
            src: "arrow.clockwise",
            width: 10,
            height: 10,
            filter: this.widgetColor,
            opacity: 0.5,
          }),
          /* @__PURE__ */ h("wspacer", { length: 5 }),
          /* @__PURE__ */ h(
            "wtext",
            {
              textColor: this.isRequestSuccess ? this.widgetColor : Color.red(),
              font: new Font("SF Mono", 10),
              textAlign: "right",
              opacity: 0.5,
            },
            Utils.time("HH:mm:ss"),
          ),
        ),
    );
  }
  async render() {
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    await this.init();
    switch (this.widgetFamily) {
      case "medium":
        await this.renderMedium(widget);
        break;
      case "large":
        await this.renderLarge(widget);
        break;
      default:
        await Utils.renderUnsupport(widget);
        break;
    }
    return widget;
  }
};
EndAwait(() => Runing(BilibiliMonitor, args.widgetParameter, false));

await __topLevelAwait__();
