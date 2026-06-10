// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: film;

/*
 * author   :  seiun
 * date     :  2025/12/26
 * build    :  2026-06-11 03:05:38
 * desc     :  每日电影推荐日历，含豆瓣评分、农历与海报背景
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/电影日历.tsx
var dependencyFileName = "Seiun.Env.js";
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, GenrateView, h, Utils } =
  runtimeRequire(dependencyFileName);
var Widget = class extends WidgetBase {
  constructor(arg) {
    super(arg);
    this.httpData = null;
    this.lunarInfo = null;
    this.isRequestSuccess = false;
    this.currentSettings = {
      basicSettings: {
        refreshInterval: { val: "120", type: this.settingValTypeString },
      },
      displaySettings: {
        descColor: { val: "#EEEEEE", type: this.settingValTypeString },
        titleColor: { val: "#FFFFFF", type: this.settingValTypeString },
        subTitleColor: { val: "#CCCCCC", type: this.settingValTypeString },
        timeColor: { val: "#FFFFFF", type: this.settingValTypeString },
        autoTimeColor: { val: false, type: this.settingValTypeBool },
      },
    };
    this.init = async () => {
      try {
        await this.getMovieData();
        await this.getLunarInfo();
      } catch (e) {
        console.log(e);
      }
    };
    this.renderCommon = async (
      w,
      sizeSplit,
      descSpan,
      useMoviePoster4FullBG,
      name,
    ) => {
      const data = await this.prepareCommonData();
      if (!data) {
        GenrateView.setListWidget(w);
        return /* @__PURE__ */ h(
          "wbox",
          {},
          /* @__PURE__ */ h(
            "wtext",
            { textColor: this.widgetColor },
            "加载中...",
          ),
        );
      }
      const infoLunarText = this.lunarInfo?.infoLunarText || "";
      const widgetSize = this.getWidgetSize(name);
      w.setPadding(0, 0, 0, 0);
      let timeColor = new Color(
        this.currentSettings.displaySettings.timeColor.val || "#FFFFFF",
      );
      if (
        this.currentSettings.displaySettings.autoTimeColor.val &&
        data.image
      ) {
        timeColor = await this.analyzeImageColor(data.image);
      }
      const currDate = /* @__PURE__ */ new Date();
      const date = currDate.getDate();
      const month = currDate.toLocaleString("zh-CN", { month: "long" });
      const week = currDate.toLocaleString("zh-CN", { weekday: "long" });
      GenrateView.setListWidget(w);
      return /* @__PURE__ */ h(
        "wbox",
        {
          background: useMoviePoster4FullBG
            ? data.image
            : this.backGroundColor || new Color("#000000"),
          padding: [0, 0, 0, 0],
        },
        /* @__PURE__ */ h(
          "wstack",
          {
            flexDirection: "row",
          },
          /* @__PURE__ */ h(
            "wstack",
            {
              flexDirection: "column",
              padding: [descSpan, descSpan, descSpan, descSpan],
              width: widgetSize.width * (1 - sizeSplit),
              height: widgetSize.height,
              background: useMoviePoster4FullBG
                ? null
                : this.backGroundColor || new Color("#000000"),
            },
            this.generateMovieInfo(data, 18, 17, 13, 14, 12),
            ...this.generateMovieDesc(data, 14, 12),
          ),
          /* @__PURE__ */ h(
            "wstack",
            {
              flexDirection: "column",
              width: widgetSize.width * sizeSplit,
              height: widgetSize.height,
              background: useMoviePoster4FullBG ? null : data.image,
              verticalAlign: "center",
              padding: [10, 10, 10, 10],
              href: "https://www.cikeee.com/wangri",
            },
            /* @__PURE__ */ h(
              "wtext",
              {
                textColor: timeColor,
                font: Font.semiboldSystemFont(48),
                textAlign: "center",
              },
              date < 10 ? `0${date}` : `${date}`,
            ),
            /* @__PURE__ */ h("wspacer", { length: 4 }),
            /* @__PURE__ */ h(
              "wtext",
              {
                textColor: timeColor,
                font: Font.mediumSystemFont(13),
                textAlign: "center",
              },
              `${month} | ${week}`,
            ),
            infoLunarText ? /* @__PURE__ */ h("wspacer", { length: 4 }) : null,
            infoLunarText
              ? /* @__PURE__ */ h(
                  "wtext",
                  {
                    textColor: timeColor,
                    font: Font.mediumSystemFont(11),
                    textAlign: "center",
                    minimumScaleFactor: 0.8,
                  },
                  `农历${infoLunarText}`,
                )
              : null,
          ),
        ),
      );
    };
    this.renderSmall = async (w) => {
      const data = await this.prepareCommonData();
      if (!data) {
        GenrateView.setListWidget(w);
        return /* @__PURE__ */ h(
          "wbox",
          {},
          /* @__PURE__ */ h(
            "wtext",
            { textColor: this.widgetColor },
            "加载中...",
          ),
        );
      }
      const widgetSize = this.getWidgetSize("小号");
      w.setPadding(0, 0, 0, 0);
      const backgroundImg = await this.generatePosterBackground(
        data.image,
        widgetSize,
        0.35,
      );
      GenrateView.setListWidget(w);
      return /* @__PURE__ */ h(
        "wbox",
        {
          background:
            backgroundImg || this.backGroundColor || new Color("#000000"),
          padding: [8, 8, 8, 8],
        },
        this.generateMovieInfo(data, 14, 15, 11, 11, 11),
        /* @__PURE__ */ h("wspacer", { length: 4 }),
        ...this.generateMovieDesc(data, 11, 10),
      );
    };
    this.renderMedium = async (w) => {
      return await this.renderCommon(w, 0.35, 10, false, "中号");
    };
    this.renderLarge = async (w) => {
      return await this.renderCommon(w, 0.3, 16, true, "大号");
    };
    this.name = "电影日历";
    this.en = "MovieCalendar";
    this.storageExpirationMinutes = 30;
    this.domain = "https://www.cikeee.com";
    this.Run();
  }
  getWidgetSize(name) {
    const sizes = {
      小号: { width: 155, height: 155 },
      中号: { width: 329, height: 155 },
      大号: { width: 329, height: 345 },
    };
    return sizes[name] || sizes["大号"];
  }
  getSFSymbol(name) {
    const symbol = SFSymbol.named(name);
    return symbol ? symbol.image : null;
  }
  // Scriptable 真机的 JSContext 没有全局 URL 类，不能用 new URL 做相对路径解析
  resolveUrl(url) {
    const raw = String(url || "").trim();
    if (!raw) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("//")) return `https:${raw}`;
    if (raw.startsWith("data:")) return raw;
    const schemeMatch = raw.match(/^[a-z][\w+.-]*:(?:\/\/[^/]*)?(\/.*)?$/i);
    const path = schemeMatch ? schemeMatch[1] || "" : raw;
    if (!path) return raw;
    return path.startsWith("/")
      ? `${this.domain}${path}`
      : `${this.domain}/${path}`;
  }
  decodeHtmlText(text) {
    return String(text || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim();
  }
  extractHtmlById(html, id) {
    const match = String(html || "").match(
      new RegExp(
        `<([a-zA-Z0-9]+)[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
        "i",
      ),
    );
    return match ? match[0] : "";
  }
  extractInnerHtmlById(html, id) {
    const source = String(html || "");
    const idIndex = source.search(new RegExp(`id=["']${id}["']`, "i"));
    if (idIndex === -1) return "";
    const openStart = source.lastIndexOf("<", idIndex);
    if (openStart === -1) return "";
    const tagMatch = source.slice(openStart + 1).match(/^([a-zA-Z0-9]+)/);
    const tagName = tagMatch ? tagMatch[1] : "";
    if (!tagName) return "";
    const closeMatch = source
      .slice(idIndex)
      .match(new RegExp(`<\\/${tagName}>`, "i"));
    if (!closeMatch || closeMatch.index === void 0) return "";
    const beforeClose = source.slice(openStart, idIndex + closeMatch.index);
    const contentStart = beforeClose.lastIndexOf(">");
    return contentStart === -1 ? "" : beforeClose.slice(contentStart + 1);
  }
  extractAttr(html, name) {
    const match = String(html || "").match(
      new RegExp(`${name}=["']([^"']+)["']`, "i"),
    );
    return match ? this.decodeHtmlText(match[1]) : "";
  }
  extractText(html) {
    return this.decodeHtmlText(String(html || "").replace(/<[^>]+>/g, ""));
  }
  parseMovieDataFromHtml(html) {
    const movieImgHtml = this.extractHtmlById(html, "movie-img");
    const bgimgHtml = this.extractHtmlById(html, "bgimg");
    const movieNameHtml = this.extractHtmlById(html, "movie-name");
    const movieInfoHtml = this.extractHtmlById(html, "movie-information");
    const movieTextHtml = this.extractHtmlById(html, "movie-text");
    const movieLinkHtml = this.extractHtmlById(html, "movie-img-a");
    const backgroundMatch = bgimgHtml.match(
      /background-image:\s*url\(["']?(.+?)["']?\)/i,
    );
    const movieImg =
      this.extractAttr(movieImgHtml, "src") ||
      (backgroundMatch ? this.decodeHtmlText(backgroundMatch[1]) : "");
    const movieDesc = this.extractText(
      this.extractInnerHtmlById(html, "movie-text") || movieTextHtml,
    );
    const movieName = this.extractText(
      this.extractInnerHtmlById(html, "movie-name") || movieNameHtml,
    ).replaceAll("——", "");
    let movieInformation = this.extractText(
      this.extractInnerHtmlById(html, "movie-information") || movieInfoHtml,
    );
    const movieRating = movieInformation.slice(0, 3);
    movieInformation = movieInformation.slice(5);
    const movieLink =
      this.extractAttr(movieLinkHtml, "href") ||
      this.extractAttr(movieNameHtml, "href");
    if (!movieImg || !movieName) return null;
    return {
      movieImg,
      movieDesc,
      movieName,
      movieInformation,
      movieRating,
      movieLink,
    };
  }
  normalizeMovieData(data) {
    if (!data) return data;
    return {
      ...data,
      movieImg: this.resolveUrl(data.movieImg),
      movieLink: this.resolveUrl(data.movieLink),
    };
  }
  isValidMovieData(data) {
    return Boolean(
      data &&
      data.movieImg &&
      data.movieName &&
      data.movieDesc &&
      data.movieInformation &&
      !Number.isNaN(Number(data.movieRating)),
    );
  }
  async analyzeImageColor(img) {
    if (!img) return new Color("#FFFFFF");
    try {
      const base64 = Data.fromPNG(img).toBase64String();
      const webview = new WebView();
      await webview.loadHTML(`
                <canvas id="canvas"></canvas>
                <script>
                    const canvas = document.getElementById('canvas')
                    const ctx = canvas.getContext('2d')
                    const img = new Image()
                    img.onload = () => {
                        canvas.width = Math.min(img.width, 100)
                        canvas.height = Math.min(img.height, 100)
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                        const data = imageData.data
                        let r = 0, g = 0, b = 0, count = 0
                        for (let i = 0; i < data.length; i += 16) {
                            r += data[i]
                            g += data[i + 1]
                            b += data[i + 2]
                            count++
                        }
                        r = Math.floor(r / count)
                        g = Math.floor(g / count)
                        b = Math.floor(b / count)
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000
                        window.result = brightness > 140 ? '#000000' : '#FFFFFF'
                    }
                    img.src = 'data:image/png;base64,${base64}'
                </script>
            `);
      await new Promise((resolve) =>
        Timer.schedule(500, false, () => resolve()),
      );
      const result = await webview.evaluateJavaScript(
        'window.result || "#FFFFFF"',
      );
      return new Color(result || "#FFFFFF");
    } catch (e) {
      console.log(`图片颜色分析失败: ${e}`);
      return new Color("#FFFFFF");
    }
  }
  async getLunarInfo() {
    const day = /* @__PURE__ */ new Date().getDate();
    try {
      const cachedLunar = this.storage.getStorage("lunar");
      if (cachedLunar) {
        this.lunarInfo = cachedLunar;
        return cachedLunar;
      }
      const requestUrl = "https://wannianrili.51240.com/";
      const defaultHeaders = {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36",
      };
      const html = await this.$request.get(
        { url: requestUrl, headers: defaultHeaders },
        "STRING",
      );
      const webview = new WebView();
      await webview.loadHTML(html);
      const getData = `
                function getData() {
                    try {
                        infoLunarText = document.querySelector('div#wnrl_k_you_id_${day}.wnrl_k_you .wnrl_k_you_id_wnrl_nongli').innerText
                        holidayText = document.querySelectorAll('div.wnrl_k_zuo div.wnrl_riqi')[${day}].querySelector('.wnrl_td_bzl').innerText
                        lunarYearText = document.querySelector('div.wnrl_k_you_id_wnrl_nongli_ganzhi').innerText
                        lunarYearText = lunarYearText.slice(0, lunarYearText.indexOf('年')+1)
                        if(infoLunarText.search(holidayText) != -1) {
                            holidayText = ''
                        }
                    } catch {
                        holidayText = ''
                    }
                    return {infoLunarText: infoLunarText,  lunarYearText: lunarYearText,  holidayText: holidayText }
                }
                getData()`;
      const response = await webview.evaluateJavaScript(getData, false);
      console.log(`[+]农历请求成功`);
      this.storage.setStorage("lunar", response);
      this.lunarInfo = response;
      return response;
    } catch (e) {
      console.log(`[+]农历请求出错，尝试使用缓存信息：${e}`);
      this.lunarInfo = this.storage.getStorage("lunar") || {
        infoLunarText: "",
      };
      return this.lunarInfo;
    }
  }
  async loadHTML(url) {
    const defaultHeaders = {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
    };
    const html = await this.$request.get(
      { url, headers: defaultHeaders },
      "STRING",
    );
    return html.replace(/(\r\n|\n|\r)/gm, "");
  }
  async getMovieData() {
    const link = this.domain;
    const cacheKey = this.md5(link);
    const cacheTimeKey = `${cacheKey}_time`;
    const cacheMinutes = 30;
    const cachedTime = this.storage.getStorage(cacheTimeKey);
    const now = /* @__PURE__ */ new Date();
    const cachedDate = cachedTime ? new Date(cachedTime) : null;
    let shouldRefresh = false;
    if (cachedDate) {
      const nowDate = now.getDate();
      const cachedDateDay = cachedDate.getDate();
      const nowMonth = now.getMonth();
      const cachedMonth = cachedDate.getMonth();
      const nowYear = now.getFullYear();
      const cachedYear = cachedDate.getFullYear();
      if (
        nowDate !== cachedDateDay ||
        nowMonth !== cachedMonth ||
        nowYear !== cachedYear
      ) {
        shouldRefresh = true;
        console.log(`-->>检测到跨天，立即更新数据`);
      } else {
        const diffMinutes = (now.getTime() - cachedDate.getTime()) / (1e3 * 60);
        if (diffMinutes >= cacheMinutes) {
          shouldRefresh = true;
        }
      }
    } else {
      shouldRefresh = true;
    }
    const cachedData = this.storage.getStorage(cacheKey);
    if (!shouldRefresh && this.isValidMovieData(cachedData)) {
      console.log(`-->>加载缓存网页数据：${link}`);
      const normalizedCachedData = this.normalizeMovieData(cachedData);
      this.httpData = normalizedCachedData;
      this.isRequestSuccess = true;
      return normalizedCachedData;
    }
    try {
      console.log(`-->>在线加载网页数据：${link}`);
      const html = await this.loadHTML(link);
      const webview = new WebView();
      await webview.loadHTML(html);
      const getData = `
                function getData() {
                    let movieImg = document.getElementById('movie-img').src;
                    let movieDesc = document.querySelector('span#movie-text').textContent;
                    let movieName = document.querySelector('a#movie-name').textContent.replaceAll('——', '');
                    let movieInformation = document.querySelector('a#movie-information').textContent;
                    let movieRating = movieInformation.slice(0, 3);
                    movieInformation = movieInformation.slice(5);
                    let movieLink = document.querySelector('a#movie-img-a').href;
                    return { movieImg, movieDesc, movieName, movieInformation, movieRating, movieLink };
                }
                getData()
            `;
      let response = null;
      try {
        response = await webview.evaluateJavaScript(getData, false);
      } catch (error) {
        console.log(`-->>DOM解析失败，尝试HTML兜底解析：${error}`);
        response = this.parseMovieDataFromHtml(html);
      }
      response = this.normalizeMovieData(response);
      if (this.isValidMovieData(response)) {
        if (cachedData && cachedData.movieName !== response.movieName) {
          console.log(`-->>电影数据已更新，清理旧图片缓存`);
          if (cachedData.movieImg) {
            this.storage.removeFile(this.resolveUrl(cachedData.movieImg), true);
          }
        }
        this.storage.setStorage(cacheKey, response);
        this.storage.setStorage(cacheTimeKey, now.toISOString());
        this.httpData = response;
        this.isRequestSuccess = true;
        return response;
      }
      throw new Error("电影日历页面结构解析失败");
    } catch (error) {
      console.error(`🚫 请求数据出错了=>${error}`);
      this.isRequestSuccess = false;
      const fallbackData = this.storage.getStorage(cacheKey);
      if (this.isValidMovieData(fallbackData)) {
        const normalizedFallbackData = this.normalizeMovieData(fallbackData);
        this.httpData = normalizedFallbackData;
        return normalizedFallbackData;
      }
    }
    return null;
  }
  Run() {
    if (config.runsInApp) {
      this.registerSettingCategory("basicSettings", "基础设置", [
        {
          title: "刷新间隔",
          desc: "设置数据刷新间隔（分钟）",
          icon: { name: "clock", color: "#1890ff" },
          type: "text",
          option: {
            refreshInterval: "120",
          },
          config: {
            placeholder: "120",
            style: "compact",
          },
        },
      ]);
      this.registerSettingCategory("displaySettings", "显示设置", [
        {
          title: "描述文字颜色",
          desc: "缺省值: #EEEEEE",
          icon: { name: "paintbrush", color: "#1890ff" },
          type: "color",
          option: {
            descColor: "#EEEEEE",
          },
        },
        {
          title: "标题文字颜色",
          desc: "缺省值: #FFFFFF",
          icon: { name: "paintbrush.fill", color: "#722ed1" },
          type: "color",
          option: {
            titleColor: "#FFFFFF",
          },
        },
        {
          title: "副标题文字颜色",
          desc: "缺省值: #CCCCCC",
          icon: { name: "paintbrush.pointed", color: "#52c41a" },
          type: "color",
          option: {
            subTitleColor: "#CCCCCC",
          },
        },
        {
          title: "时间文字颜色",
          desc: "缺省值: #FFFFFF",
          icon: { name: "clock.fill", color: "#999999" },
          type: "color",
          option: {
            timeColor: "#FFFFFF",
          },
        },
        {
          title: "自动分析时间颜色",
          desc: "根据图片自动计算时间文字颜色",
          icon: { name: "wand.and.stars", color: "#FF6B6B" },
          type: "switch",
          option: {
            autoTimeColor: false,
          },
        },
      ]);
      this.registerSetting({
        title: "参数配置",
        icon: { name: "gear", color: "#722ed1" },
        onAction: async () => {
          await this.presentSettings(["basicSettings", "displaySettings"]);
          return true;
        },
      });
    }
  }
  async prepareCommonData() {
    if (!this.httpData) return null;
    const {
      movieImg,
      movieDesc,
      movieName,
      movieInformation,
      movieRating,
      movieLink,
    } = this.httpData;
    const descColor = new Color(
      this.currentSettings.displaySettings.descColor.val || "#EEEEEE",
    );
    const titleColor = new Color(
      this.currentSettings.displaySettings.titleColor.val || "#FFFFFF",
    );
    const subTitleColor = new Color(
      this.currentSettings.displaySettings.subTitleColor.val || "#CCCCCC",
    );
    let image = await this.getImageByUrl(movieImg, null, "movieCover");
    if (image) image = await this.shadowImage(image, "#000000", 0.4);
    return {
      movieName,
      movieDesc,
      movieInformation,
      movieRating,
      movieLink,
      image,
      descColor,
      titleColor,
      subTitleColor,
    };
  }
  generateStars(movieRating, starSize = 18) {
    const ratingColor = new Color("#F8D454");
    const emptyStar = SFSymbol.named("star").image;
    const fillStar = SFSymbol.named("star.fill").image;
    const halfStar = SFSymbol.named("star.leadinghalf.filled").image;
    const rating = Number(movieRating);
    const fillCount = Math.floor(rating / 2);
    const remainCount = rating / 2 - fillCount;
    let totalCount = 0;
    const stars = [];
    for (let index = 0; index < fillCount; index++) {
      totalCount += 1;
      stars.push(
        /* @__PURE__ */ h("wimage", {
          src: fillStar,
          width: starSize,
          height: starSize,
          filter: ratingColor,
        }),
      );
      if (index < fillCount - 1)
        stars.push(/* @__PURE__ */ h("wspacer", { length: 2 }));
    }
    if (remainCount >= 0.5) {
      totalCount += 1;
      stars.push(/* @__PURE__ */ h("wspacer", { length: 2 }));
      stars.push(
        /* @__PURE__ */ h("wimage", {
          src: halfStar || emptyStar,
          width: starSize,
          height: starSize,
          filter: ratingColor,
        }),
      );
    }
    for (let index = 0; index < 5 - totalCount; index++) {
      stars.push(/* @__PURE__ */ h("wspacer", { length: 2 }));
      stars.push(
        /* @__PURE__ */ h("wimage", {
          src: emptyStar,
          width: starSize,
          height: starSize,
          filter: ratingColor,
          opacity: 0.5,
        }),
      );
    }
    return stars;
  }
  generateMovieInfo(
    data,
    starSize,
    titleFontSize,
    subTitleFontSize,
    descFontSize,
    ratingTextSize,
  ) {
    const stars = this.generateStars(data.movieRating, starSize);
    const ratingText =
      starSize >= 18
        ? `豆瓣评分${data.movieRating}`
        : `豆瓣${data.movieRating}`;
    return /* @__PURE__ */ h(
      "wstack",
      {
        flexDirection: "column",
        href: data.movieLink,
      },
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor: data.titleColor,
          font: Font.mediumSystemFont(titleFontSize),
        },
        data.movieName,
      ),
      /* @__PURE__ */ h("wspacer", { length: starSize >= 18 ? 6 : 4 }),
      /* @__PURE__ */ h(
        "wstack",
        {
          flexDirection: "row",
          verticalAlign: "center",
        },
        ...stars,
        /* @__PURE__ */ h("wspacer", { length: starSize >= 18 ? 8 : 6 }),
        /* @__PURE__ */ h(
          "wtext",
          {
            textColor: data.subTitleColor,
            font: Font.semiboldSystemFont(ratingTextSize),
          },
          ratingText,
        ),
      ),
      /* @__PURE__ */ h("wspacer", { length: starSize >= 18 ? 6 : 4 }),
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor: data.subTitleColor,
          font: Font.semiboldSystemFont(subTitleFontSize),
        },
        data.movieInformation,
      ),
    );
  }
  generateMovieDesc(data, descFontSize, quoteFontSize) {
    const spacerLength = descFontSize >= 14 ? 12 : 8;
    return [
      /* @__PURE__ */ h("wspacer", { length: spacerLength }),
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor: data.descColor,
          font: Font.lightSystemFont(quoteFontSize),
        },
        "❝",
      ),
      /* @__PURE__ */ h(
        "wtext",
        {
          textColor: data.descColor,
          font: Font.systemFont(descFontSize),
          opacity: 0.9,
        },
        data.movieDesc,
      ),
      /* @__PURE__ */ h("wspacer", {}),
    ];
  }
  async generatePosterBackground(image, widgetSize, posterRatio) {
    if (!image || !image.size) return null;
    try {
      const ctx = new DrawContext();
      ctx.opaque = false;
      ctx.respectScreenScale = true;
      ctx.size = new Size(widgetSize.width, widgetSize.height);
      const bgColor = this.backGroundColor || new Color("#000000");
      if (bgColor instanceof LinearGradient && Array.isArray(bgColor.colors)) {
        const gradient = new LinearGradient();
        gradient.locations = [0, 1];
        gradient.colors = bgColor.colors;
        gradient.startPoint = new Point(0, 0);
        gradient.endPoint = new Point(widgetSize.width, widgetSize.height);
        ctx.setFillGradient(gradient);
      } else {
        ctx.setFillColor(bgColor);
      }
      ctx.fillRect(new Rect(0, 0, widgetSize.width, widgetSize.height));
      const posterWidth = widgetSize.width * posterRatio;
      const posterHeight = widgetSize.height;
      const posterX = widgetSize.width - posterWidth;
      const imageAspect = image.size.width / image.size.height;
      const targetAspect = posterWidth / posterHeight;
      let cropX = 0;
      let cropY = 0;
      let cropWidth = image.size.width;
      let cropHeight = image.size.height;
      if (imageAspect > targetAspect) {
        cropHeight = image.size.height;
        cropWidth = image.size.height * targetAspect;
        cropX = (image.size.width - cropWidth) / 2;
      } else {
        cropWidth = image.size.width;
        cropHeight = image.size.width / targetAspect;
        cropY = (image.size.height - cropHeight) / 2;
      }
      const cropCtx = new DrawContext();
      cropCtx.opaque = false;
      cropCtx.respectScreenScale = true;
      cropCtx.size = new Size(cropWidth, cropHeight);
      cropCtx.drawImageInRect(
        image,
        new Rect(-cropX, -cropY, image.size.width, image.size.height),
      );
      const croppedImage = cropCtx.getImage();
      ctx.drawImageInRect(
        croppedImage,
        new Rect(posterX, 0, posterWidth, posterHeight),
      );
      return `data:image/png;base64,${Data.fromPNG(ctx.getImage()).toBase64String()}`;
    } catch (e) {
      console.log(`生成背景图失败: ${e}`);
      return null;
    }
  }
  async render() {
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    await this.init();
    switch (this.widgetFamily) {
      case "small":
        await this.renderSmall(widget);
        break;
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
