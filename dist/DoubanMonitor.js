// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: film;

/*
 * author   :  seiun
 * date     :  2021/10/20
 * build    :  2026-06-10 18:57:50
 * desc     :  豆瓣电影推荐榜单
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/DoubanMonitor.tsx
var dependencyFileName = "Seiun.Env.js";
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, GenrateView, h, Utils } =
  runtimeRequire(dependencyFileName);
var Widget = class extends WidgetBase {
  constructor(arg) {
    super(arg);
    // 组件传入参数
    this.widgetParam = args.widgetParameter;
    this.url =
      "https://m.douban.com/rexxar/api/v2/subject_collection/movie_real_time_hotest/items?start=0&count=50&items_only=1&for_mobile=1";
    this.dbheader = `https://m.douban.com/pwa/cache_worker`;
    this.defaultHeaders = {
      Accept: "*/*",
      "Content-Type": "application/json",
    };
    this.contentRowSpacing = 5;
    this.httpData = null;
    this.isRequestSuccess = false;
    // 组件当前设置
    this.currentSettings = {
      basicSettings: {
        urlJumpType: { val: "跳转至浏览器", type: this.settingValTypeString },
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
      } catch (e) {
        console.log(e);
      }
    };
    this.renderCommon = async (w) => {
      if (
        this.httpData &&
        this.httpData["count"] &&
        this.httpData["count"] > 0
      ) {
        const items = this.httpData["subject_collection_items"].splice(
          0,
          Math.min(
            this.widgetFamily == "medium"
              ? this.currentSettings.displaySettings.mediaWidgetShowDataNum.val
              : this.currentSettings.displaySettings.largeWidgetShowDataNum.val,
            this.httpData["subject_collection_items"].length,
          ),
        );
        items.map((item) => {
          console.log(`• ${item.title}`);
        });
        GenrateView.setListWidget(w);
        return /* @__PURE__ */ h(
          "wbox",
          {
            spacing: this.contentRowSpacing,
          },
          /* @__PURE__ */ h("wspacer", {
            length: this.contentRowSpacing,
          }),
          /* @__PURE__ */ h(
            "wtext",
            {
              textColor: this.widgetColor,
              font: new Font("SF Mono", 15),
              opacity: 0.7,
            },
            `🎞 豆瓣电影`,
          ),
          items.map((item) => {
            const gTitle = item.title;
            const rating = item.rating;
            const itemColor =
              this.currentSettings.displaySettings.listDataColorShowType.val ===
              "随机颜色"
                ? new Color(Utils.randomColor16())
                : this.widgetColor;
            if (
              rating == null ||
              (parseInt(rating["star_count"]) <= 0 &&
                parseInt(rating["value"]) <= 0)
            ) {
              return h(
                "wstack",
                {
                  verticalAlign: "center",
                  href: this.decideGoto(item),
                },
                h(
                  "wtext",
                  {
                    textColor: itemColor,
                    font: Font.mediumSystemFont(12),
                    maxLine: 1,
                  },
                  `• ${gTitle}`,
                ),
                h("wspacer"),
                h(
                  "wtext",
                  {
                    textColor: itemColor,
                    font: Font.systemFont(10),
                    opacity: 0.5,
                  },
                  `暂无评分`,
                ),
              );
            } else {
              return h(
                "wstack",
                {
                  verticalAlign: "center",
                  href: this.decideGoto(item),
                },
                h(
                  "wtext",
                  {
                    textColor: itemColor,
                    font: Font.mediumSystemFont(12),
                  },
                  `• ${gTitle}`,
                ),
                h("wspacer", { length: 6 }),
                ...this.renderStars(rating["star_count"], itemColor),
                h("wspacer"),
                h(
                  "wtext",
                  {
                    textColor: itemColor,
                    font: Font.boldSystemFont(11),
                    opacity: 0.8,
                  },
                  rating["value"],
                ),
              );
            }
          }),
          this.currentSettings.displaySettings.listDataUpdateTimeShowType
            .val === "显示" &&
            /* @__PURE__ */ h(
              "wstack",
              {
                verticalAlign: "center",
                padding: [0, 0, 5, 0],
              },
              /* @__PURE__ */ h("wspacer", null),
              /* @__PURE__ */ h("wimage", {
                src: "arrow.clockwise",
                width: 10,
                height: 10,
                filter: this.widgetColor,
                opacity: 0.5,
              }),
              /* @__PURE__ */ h("wspacer", {
                length: 5,
              }),
              /* @__PURE__ */ h(
                "wtext",
                {
                  textColor: this.isRequestSuccess
                    ? this.widgetColor
                    : Color.red(),
                  font: new Font("SF Mono", 10),
                  textAlign: "right",
                  opacity: 0.5,
                },
                Utils.time("HH:mm:ss"),
              ),
            ),
        );
      }
    };
    this.renderMedium = async (w) => {
      return await this.renderCommon(w);
    };
    this.renderLarge = async (w) => {
      return await this.renderCommon(w);
    };
    this.name = "豆瓣电影推荐榜单";
    this.en = "DoubanMonitor";
    this.Run();
  }
  async getData() {
    this.isRequestSuccess = false;
    try {
      const data = await this.$request.get({
        url: this.url,
        headers: { Referer: this.dbheader },
      });
      this.httpData = data;
      this.isRequestSuccess = true;
      console.log(this.httpData);
    } catch (error) {
      console.log(error);
    }
  }
  Run() {
    if (config.runsInApp) {
      this.registerSettingCategory("basicSettings", "基础设置", [
        {
          title: "跳转方式",
          desc: "点击榜单条目链接跳转方式\n选择 跳转至app 时若未安装app，则会无响应\n\n缺省值: 跳转至浏览器",
          icon: { name: "link", color: "#D371E3" },
          type: "select",
          option: {
            urlJumpType: "跳转至浏览器",
          },
          config: {
            selectOptions: [
              { label: "跳转至浏览器", value: "跳转至浏览器" },
              { label: "跳转至app", value: "跳转至app" },
            ],
            defaultShowContent: "跳转至浏览器",
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
          option: {
            mediaWidgetShowDataNum: "6",
          },
        },
        {
          title: "大组件数据条数",
          desc: "缺省值：15",
          icon: { name: "number.square", color: "#3478F6" },
          type: "text",
          option: {
            largeWidgetShowDataNum: "15",
          },
        },
        {
          title: "数据条目颜色",
          desc: "缺省值: 随机颜色",
          icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png",
          type: "select",
          option: {
            listDataColorShowType: "随机颜色",
          },
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
          option: {
            listDataUpdateTimeShowType: "显示",
          },
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
          return true;
        },
      });
    }
  }
  decideGoto(item) {
    switch (this.currentSettings.basicSettings.urlJumpType.val) {
      case "跳转至浏览器":
        return item.url;
      case "跳转至app":
        return item.uri;
      default:
        return void 0;
    }
  }
  renderStars(starCount, color) {
    if (!starCount || starCount <= 0) return [];
    const fullStars = Math.floor(starCount);
    const hasHalfStar = starCount % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const stars = [];
    const starSize = 11;
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        h("wimage", {
          src: "star.fill",
          width: starSize,
          height: starSize,
          filter: color,
          opacity: 0.9,
        }),
      );
      if (i < 4) stars.push(h("wspacer", { length: 1 }));
    }
    if (hasHalfStar) {
      stars.push(
        h("wimage", {
          src: "star.leadinghalf.filled",
          width: starSize,
          height: starSize,
          filter: color,
          opacity: 0.9,
        }),
      );
      if (emptyStars > 0) stars.push(h("wspacer", { length: 1 }));
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        h("wimage", {
          src: "star",
          width: starSize,
          height: starSize,
          filter: color,
          opacity: 0.5,
        }),
      );
      if (i < emptyStars - 1) stars.push(h("wspacer", { length: 1 }));
    }
    return stars;
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
EndAwait(() => Runing(Widget, args.widgetParameter, false));

await __topLevelAwait__();
