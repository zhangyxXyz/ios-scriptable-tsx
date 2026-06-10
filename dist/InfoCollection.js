// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: fingerprint;

/*
 * author   :  seiun
 * date     :  2021/10/24
 * build    :  2026-06-11 00:23:36
 * desc     :  万年历、天气、电池、年进度等信息聚合面板
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/InfoCollection.tsx
var dependencyFileName = "Seiun.Env.js";
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, GenrateView, h, Utils, Storage } =
  runtimeRequire(dependencyFileName);
var storage = new Storage("InfoCollectionData");
var lunarDayNames = [
  "",
  "初一",
  "初二",
  "初三",
  "初四",
  "初五",
  "初六",
  "初七",
  "初八",
  "初九",
  "初十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
  "二十",
  "廿一",
  "廿二",
  "廿三",
  "廿四",
  "廿五",
  "廿六",
  "廿七",
  "廿八",
  "廿九",
  "三十",
];
var InfoCollection = class extends WidgetBase {
  constructor(scriptName) {
    super(scriptName);
    this.name = "信息合集";
    this.en = "InfoCollection";
    this.widgetParam = args.widgetParameter;
    this.progressBarWidth = 24;
    this.padding = { top: 10, left: 10, bottom: 10, right: 10 };
    this.locationInfo = null;
    this.areaInfo = null;
    this.lunarInfo = null;
    this.weatherInfo = null;
    this.honeyInfo = null;
    this.currentSettings = {
      accountSettings: {
        userName: { val: "seiun", type: this.settingValTypeString },
        weatherKey: { val: "", type: this.settingValTypeString },
        tencentApiKey: { val: "", type: this.settingValTypeString },
        lockLocation: { val: "不锁定", type: this.settingValTypeString },
      },
      displaySettings: {
        lunarInfoColorHex: { val: "#C6FFDD", type: this.settingValTypeString },
        honeyInfoColorHex: { val: "#BBD676", type: this.settingValTypeString },
        weatherInfoColorHex: {
          val: "#FBD786",
          type: this.settingValTypeString,
        },
        batteryInfoColorHex: {
          val: "#00FF00",
          type: this.settingValTypeString,
        },
        yearProgressColorHex: {
          val: "#F19C65",
          type: this.settingValTypeString,
        },
        listDataColorShowType: {
          val: "组件文本颜色",
          type: this.settingValTypeString,
        },
      },
    };
    this.init = async () => {
      try {
        await this.getLocation();
        await this.getLocationArea();
        await this.getWeather();
        await this.getLunar(/* @__PURE__ */ new Date().getDate() - 1);
        await this.getHoney();
      } catch (error) {
        console.log(error);
      }
    };
    this.Run();
  }
  async getLocation() {
    this.locationInfo = storage.getStorage("location");
    if (
      this.currentSettings.accountSettings.lockLocation.val === "锁定" &&
      this.locationInfo
    ) {
      console.log("[+]位置已锁定，使用缓存数据");
    } else {
      try {
        const currentLocation = await Location.current();
        storage.setStorage("location", currentLocation);
        this.locationInfo = currentLocation;
        console.log("[+]定位成功");
      } catch (error) {
        console.log(`[+]无法定位，尝试使用缓存数据：${error}`);
      }
    }
    console.log(this.locationInfo);
    return this.locationInfo;
  }
  async getLocationArea() {
    const storageArea = storage.getStorage("area", 1);
    if (storageArea) {
      console.log("[+]腾讯位置 API 请求间隔过短，使用缓存数据");
      this.areaInfo = storageArea;
    } else {
      try {
        const location = this.locationInfo || (await this.getLocation());
        if (!location) throw new Error("定位不可用");
        const testKey = "OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77";
        const apiKey =
          this.currentSettings.accountSettings.tencentApiKey.val === ""
            ? testKey
            : this.currentSettings.accountSettings.tencentApiKey.val;
        const areaReqUrl = `https://apis.map.qq.com/ws/geocoder/v1/?location=${location.latitude},${location.longitude}&key=${apiKey}&get_poi=0`;
        const area = await this.$request.get({
          url: areaReqUrl,
          headers: { Referer: "https://lbs.qq.com/" },
        });
        console.log(
          `[+]腾讯位置 API 请求成功：location=${location.latitude},${location.longitude}&hasKey=${Boolean(apiKey)}`,
        );
        storage.setStorage("area", area);
        this.areaInfo = area;
      } catch (error) {
        console.log(
          `[+]getLocationArea 出错，尝试使用缓存数据：${this.sanitizeUrlKeys(error)}`,
        );
        this.areaInfo = storage.getStorage("area");
      }
    }
    console.log(this.areaInfo);
  }
  async getWeather() {
    if (!this.currentSettings.accountSettings.weatherKey.val) {
      console.log("[+]和风天气 API key 未配置，跳过天气请求");
      this.weatherInfo = { message: "请配置和风天气 API key" };
      return;
    }
    const storageWeather = storage.getStorage("weather", 1);
    if (storageWeather?.now) {
      console.log("[+]天气请求间隔过短，使用缓存数据");
      this.weatherInfo = storageWeather;
    } else {
      try {
        const location = this.locationInfo || (await this.getLocation());
        if (!location) throw new Error("定位不可用");
        const weatherReqUrl = `https://devapi.heweather.net/v7/weather/now?location=${location.longitude},${location.latitude}&key=${this.currentSettings.accountSettings.weatherKey.val}&lang=zh-cn`;
        const weather = await this.$request.get(weatherReqUrl);
        console.log(
          `[+]天气信息请求成功：location=${location.longitude},${location.latitude}&lang=zh-cn&hasKey=${Boolean(
            this.currentSettings.accountSettings.weatherKey.val,
          )}`,
        );
        storage.setStorage("weather", weather);
        this.weatherInfo = weather;
      } catch (error) {
        console.log(
          `[+]天气信息请求失败，尝试使用缓存数据：${this.sanitizeUrlKeys(error)}`,
        );
        this.weatherInfo = storage.getStorage("weather");
      }
    }
    console.log(this.sanitizeUrlKeys(this.weatherInfo));
  }
  sanitizeUrlKeys(value) {
    if (typeof value === "string")
      return value.replace(/([?&]key=)[^&\s"]+/g, "$1***");
    try {
      return JSON.parse(
        JSON.stringify(value).replace(/([?&]key=)[^&\s"]+/g, "$1***"),
      );
    } catch {
      return String(value).replace(/([?&]key=)[^&\s"]+/g, "$1***");
    }
  }
  async getLunar(day) {
    try {
      const requestUrl = "https://wannianrili.51240.com/";
      const defaultHeaders = {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1",
        "Accept-Language": "zh-CN,zh;q=0.9",
      };
      const html = await this.$request.get(
        { url: requestUrl, headers: defaultHeaders },
        "STRING",
      );
      const webview = new WebView();
      await webview.loadHTML(html);
      const getData = `
                function getData() {
                    let infoLunarText = ''
                    let holidayText = ''
                    let lunarYearText = ''
                    try {
                        const dayPanel =
                            document.querySelector('#wnrl_k_you_id_${day}.wnrl_k_you') ||
                            document.querySelector('.wnrl_k_you[style*="block"]') ||
                            document.querySelectorAll('.wnrl_k_you')[${day}]
                        infoLunarText = dayPanel?.querySelector('.wnrl_k_you_id_wnrl_nongli')?.innerText || ''
                        const dayCell = document.querySelectorAll('div.wnrl_k_zuo div.wnrl_riqi')[${day}]
                        holidayText = dayCell?.querySelector('.wnrl_td_bzl')?.innerText || ''
                        lunarYearText = dayPanel?.querySelector('.wnrl_k_you_id_wnrl_nongli_ganzhi')?.innerText || ''
                        lunarYearText = lunarYearText.includes('\\u5e74')
                            ? lunarYearText.slice(0, lunarYearText.indexOf('\\u5e74') + 1)
                            : lunarYearText
                        if (infoLunarText.search(holidayText) !== -1) {
                            holidayText = ''
                        }
                    } catch {
                        holidayText = ''
                    }
                    return {infoLunarText, lunarYearText, holidayText}
                }
                getData()`;
      const response = await webview.evaluateJavaScript(getData, false);
      if (
        !response.infoLunarText &&
        !response.lunarYearText &&
        !response.holidayText
      ) {
        Object.assign(
          response,
          this.getFallbackLunarInfo(/* @__PURE__ */ new Date()),
        );
      }
      console.log("[+]农历请求成功");
      storage.setStorage("lunar", response);
      this.lunarInfo = response;
    } catch (error) {
      console.log(`[+]农历请求失败，尝试使用缓存信息：${error}`);
      this.lunarInfo = storage.getStorage("lunar");
    }
    console.log(JSON.stringify(this.lunarInfo));
  }
  getFallbackLunarInfo(date) {
    try {
      const monthDay = new Intl.DateTimeFormat("zh-u-ca-chinese", {
        month: "long",
        day: "numeric",
      }).format(date);
      const year = new Intl.DateTimeFormat("zh-u-ca-chinese", {
        year: "numeric",
      }).format(date);
      const dayMatch = monthDay.match(/(\d+)/);
      const day = dayMatch ? parseInt(dayMatch[1]) : 0;
      const month = monthDay.replace(/\d+日?/, "");
      return {
        infoLunarText: `${month}${lunarDayNames[day] || dayMatch?.[1] || ""}`,
        lunarYearText: year.replace(/^\d+/, ""),
        holidayText: "",
      };
    } catch {
      return { infoLunarText: "", lunarYearText: "", holidayText: "" };
    }
  }
  async getHoney() {
    try {
      const honeyData = await this.$request.get(
        "https://api.lovelive.tools/api/SweetNothings?type=json",
      );
      if (
        honeyData.code === 200 &&
        honeyData.returnObj &&
        honeyData.returnObj[0]
      ) {
        console.log("[+]情话获取成功");
        this.honeyInfo = {
          data: {
            content: honeyData.returnObj[0],
          },
        };
        storage.setStorage("honey", this.honeyInfo);
      } else {
        throw new Error(`return unexpected error code: ${honeyData.code}`);
      }
    } catch (error) {
      console.log(`[+]获取情话失败，尝试使用缓存数据：${error}`);
      this.honeyInfo = storage.getStorage("honey");
    }
    console.log(JSON.stringify(this.honeyInfo));
  }
  getDayHourGreetings(date) {
    const time = date || /* @__PURE__ */ new Date();
    const hour = time.getHours();
    if (hour < 8) return "midnight";
    if (hour >= 8 && hour < 12) return "morning";
    if (hour >= 12 && hour < 19) return "afternoon";
    if (hour >= 19 && hour < 21) return "evening";
    if (hour >= 21) return "night";
    return "mood";
  }
  renderProgress(progress) {
    const used = "▓".repeat(Math.floor(progress * this.progressBarWidth));
    const left = "░".repeat(this.progressBarWidth - used.length);
    return `${used}${left} ${Math.floor(progress * 100)}%`;
  }
  renderBattery() {
    return this.renderProgress(Device.batteryLevel());
  }
  renderYearProgress() {
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear() + 1, 0, 1);
    return this.renderProgress(
      (now.getTime() - start.getTime()) / (end.getTime() - start.getTime()),
    );
  }
  Run() {
    if (!config.runsInApp) return;
    this.registerSettingCategory("accountSettings", "账号设置", [
      {
        title: "如何称呼您？",
        desc: "提示语内对您的称呼",
        icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/flow.png",
        type: "text",
        option: { userName: "seiun" },
        config: {
          placeholder: "如何称呼您？",
          style: "compact",
        },
      },
      {
        title: "和风天气 API key",
        desc: "申请地址：https://dev.heweather.com/",
        icon: { name: "cloud.sun", color: "#787877" },
        type: "password",
        option: { weatherKey: "" },
        config: {
          placeholder: "和风天气 API key",
          style: "compact",
        },
      },
      {
        title: "腾讯地图 API key",
        desc: "自带官方 demo key，也可以使用自己申请的 key",
        icon: { name: "mappin.and.ellipse", color: "#46ACFF" },
        type: "password",
        option: { tencentApiKey: "" },
        config: {
          placeholder: "腾讯地图 API key",
          style: "compact",
        },
      },
      {
        title: "是否锁定位置信息",
        desc: "锁定后将持续使用缓存位置信息。默认：不锁定",
        icon: { name: "location.slash", color: "#D371E3" },
        type: "select",
        option: { lockLocation: "不锁定" },
        config: {
          selectOptions: [
            { label: "锁定", value: "锁定" },
            { label: "不锁定", value: "不锁定" },
          ],
          defaultShowContent: "不锁定",
          multiple: false,
        },
      },
    ]);
    this.registerSettingCategory("displaySettings", "显示设置", [
      {
        title: "万年历字体颜色",
        desc: "默认值：#C6FFDD",
        icon: { name: "calendar", color: "#C6FFDD" },
        type: "color",
        option: { lunarInfoColorHex: "#C6FFDD" },
      },
      {
        title: "情话字体颜色",
        desc: "默认值：#BBD676",
        icon: { name: "heart.fill", color: "#BBD676" },
        type: "color",
        option: { honeyInfoColorHex: "#BBD676" },
      },
      {
        title: "天气信息字体颜色",
        desc: "默认值：#FBD786",
        icon: { name: "cloud.sun.fill", color: "#FBD786" },
        type: "color",
        option: { weatherInfoColorHex: "#FBD786" },
      },
      {
        title: "电池信息字体颜色",
        desc: "默认值：#00FF00",
        icon: { name: "battery.100", color: "#00FF00" },
        type: "color",
        option: { batteryInfoColorHex: "#00FF00" },
      },
      {
        title: "年进度字体颜色",
        desc: "默认值：#F19C65",
        icon: { name: "chart.bar.fill", color: "#F19C65" },
        type: "color",
        option: { yearProgressColorHex: "#F19C65" },
      },
      {
        title: "数据条目颜色",
        desc: "默认值：组件文本颜色",
        icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png",
        type: "select",
        option: { listDataColorShowType: "组件文本颜色" },
        config: {
          selectOptions: [
            { label: "组件文本颜色", value: "组件文本颜色" },
            { label: "随机颜色", value: "随机颜色" },
          ],
          defaultShowContent: "组件文本颜色",
          multiple: false,
        },
      },
    ]);
    this.registerSetting({
      title: "账号设置",
      icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/account.png",
      onAction: async () => {
        await this.presentSettings(["accountSettings"]);
        return true;
      },
    });
    this.registerSetting({
      title: "显示设置",
      icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png",
      onAction: async () => {
        await this.presentSettings(["displaySettings"]);
        return true;
      },
    });
  }
  async renderCommon(widget) {
    const time = /* @__PURE__ */ new Date();
    const dfTime = new DateFormatter();
    dfTime.locale = "zh-cn";
    dfTime.useMediumDateStyle();
    dfTime.useNoTimeStyle();
    const lunarInfo = this.lunarInfo || {};
    const honeyInfo = this.honeyInfo || {};
    const weatherInfo = this.weatherInfo || {};
    const areaInfo = this.areaInfo || {};
    const city = areaInfo.result?.address_component?.city || "";
    const district = areaInfo.result?.address_component?.district || "";
    const weatherNow = weatherInfo.now || {};
    const weatherText =
      weatherNow.text || weatherInfo.message || weatherInfo.data?.title || "";
    const weatherTemp = weatherNow.temp ?? "";
    const weatherFeelsLike = weatherNow.feelsLike ?? "";
    const weatherWindDir =
      weatherNow.windDir || weatherInfo.data?.summary || "";
    GenrateView.setListWidget(widget);
    return /* @__PURE__ */ h(
      "wbox",
      { spacing: 6, padding: [12, 12, 12, 0] },
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor:
            this.currentSettings.displaySettings.listDataColorShowType.val.includes(
              "随机颜色",
            )
              ? new Color(Utils.randomColor16())
              : this.widgetColor,
          font: new Font("Menlo", 11),
          textAlign: "left",
        },
        `[🤖]Hi, ${this.currentSettings.accountSettings.userName.val}. Good ${this.getDayHourGreetings(time)}`,
      ),
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor: new Color(
            this.currentSettings.displaySettings.lunarInfoColorHex.val,
          ),
          font: new Font("Menlo", 11),
          textAlign: "left",
        },
        `[🗓]${dfTime.string(time)} 农历${lunarInfo.infoLunarText || ""}·${lunarInfo.lunarYearText || ""} ${lunarInfo.holidayText || ""}`,
      ),
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor: new Color(
            this.currentSettings.displaySettings.honeyInfoColorHex.val,
          ),
          font: new Font("Menlo", 11),
          textAlign: "left",
          maxLine: 1,
        },
        `[🐷]${honeyInfo.data?.content || ""}`,
      ),
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor: new Color(
            this.currentSettings.displaySettings.weatherInfoColorHex.val,
          ),
          font: new Font("Menlo", 11),
          textAlign: "left",
        },
        `[🌤]${city}·${district} ${weatherText} T:${weatherTemp}°  F:${weatherFeelsLike}° ${weatherWindDir}`,
      ),
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor: new Color(
            this.currentSettings.displaySettings.batteryInfoColorHex.val,
          ),
          font: new Font("Menlo", 10),
          textAlign: "left",
          maxLine: 1,
          scale: 0.75,
        },
        `[${Device.isCharging() ? "⚡️" : "🔋"}]${this.renderBattery()} Battery`,
      ),
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor: new Color(
            this.currentSettings.displaySettings.yearProgressColorHex.val,
          ),
          font: new Font("Menlo", 10),
          textAlign: "left",
          maxLine: 1,
          scale: 0.75,
        },
        `[⏳]${this.renderYearProgress()} YearProgress`,
      ),
    );
  }
  async renderMedium(widget) {
    return await this.renderCommon(widget);
  }
  async renderLarge(widget) {
    return await this.renderCommon(widget);
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
EndAwait(() => Runing(InfoCollection, args.widgetParameter, false));

await __topLevelAwait__();
