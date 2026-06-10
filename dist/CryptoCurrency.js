// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: dollar-sign;

/*
 * author   :  seiun
 * date     :  2025/12/26
 * build    :  2026-06-11 00:23:36
 * desc     :  数字货币
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/CryptoCurrency.tsx
var dependencyFileName = "Seiun.Env.js";
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, GenrateView, h, Utils } =
  runtimeRequire(dependencyFileName);
var Widget = class extends WidgetBase {
  constructor(arg) {
    super(arg);
    this.httpData = null;
    this.isRequestSuccess = false;
    this.dataSource = [];
    this.coinOptions = [];
    this.endpoint = "https://api.coingecko.com/api/v3";
    this.currentSettings = {
      basicSettings: {
        btcType: { val: [], type: this.settingValTypeArray },
      },
    };
    this.init = async () => {
      try {
        await this.loadCoinOptions();
        await this.cacheData();
      } catch (e) {
        console.log(e);
      }
    };
    this.renderSmall = async (w) => {
      if (!this.dataSource || this.dataSource.length === 0) {
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
      const market = this.dataSource[0] || {};
      const image = await this.getImageByUrl(market.image, null, "coinIcon");
      const backgroundImg = await this.getSmallBg(image);
      GenrateView.setListWidget(w);
      return /* @__PURE__ */ h(
        "wbox",
        {
          background: backgroundImg || this.backGroundColor,
          href: `https://www.coingecko.com/en/coins/${market.id}`,
          padding: [12, 12, 12, 12],
        },
        /* @__PURE__ */ h(
          "wtext",
          {
            textColor: this.widgetColor,
            font: Font.heavySystemFont(24),
            textAlign: "right",
          },
          market.symbol.toUpperCase(),
        ),
        /* @__PURE__ */ h(
          "wtext",
          {
            textColor: Color.gray(),
            font: Font.systemFont(10),
            textAlign: "right",
          },
          market.name,
        ),
        /* @__PURE__ */ h("wspacer", {}),
        /* @__PURE__ */ h(
          "wtext",
          {
            textColor:
              market.price_change_percentage_24h >= 0
                ? Color.green()
                : Color.red(),
            font: Font.semiboldSystemFont(16),
            textAlign: "right",
          },
          `${market.price_change_percentage_24h.toFixed(2)}%`,
        ),
        /* @__PURE__ */ h(
          "wtext",
          {
            textColor: this.widgetColor,
            font: Font.boldSystemFont(28),
            textAlign: "right",
            maxLine: 1,
            scale: 0.1,
          },
          `$ ${market.current_price}`,
        ),
        /* @__PURE__ */ h(
          "wtext",
          {
            textColor: Color.gray(),
            font: Font.systemFont(10),
            textAlign: "right",
            maxLine: 1,
            scale: 0.1,
          },
          `H: ${market.high_24h}, L: ${market.low_24h}`,
        ),
      );
    };
    this.renderRowCell = async (market) => {
      const image = await this.getImageByUrl(market.image, null, "coinIcon");
      const changeColor =
        market.price_change_percentage_24h >= 0 ? Color.green() : Color.red();
      const changeText =
        (market.price_change_percentage_24h >= 0 ? "+" : "") +
        market.price_change_percentage_24h.toFixed(2) +
        "%";
      return /* @__PURE__ */ h(
        "wstack",
        {
          flexDirection: "row",
          href: `https://www.coingecko.com/zh/coins/${market.id}`,
        },
        /* @__PURE__ */ h("wimage", {
          src: image,
          width: 28,
          height: 28,
          borderRadius: 14,
        }),
        /* @__PURE__ */ h("wspacer", { length: 10 }),
        /* @__PURE__ */ h(
          "wstack",
          {
            flexDirection: "column",
          },
          /* @__PURE__ */ h(
            "wstack",
            {
              flexDirection: "row",
            },
            /* @__PURE__ */ h(
              "wtext",
              {
                textColor: this.widgetColor,
                font: Font.semiboldSystemFont(16),
              },
              market.symbol,
            ),
            /* @__PURE__ */ h("wspacer", {}),
            /* @__PURE__ */ h(
              "wtext",
              {
                textColor: this.widgetColor,
                font: Font.semiboldSystemFont(15),
                textAlign: "right",
              },
              `$ ${market.current_price}`,
            ),
          ),
          /* @__PURE__ */ h(
            "wstack",
            {
              flexDirection: "row",
            },
            /* @__PURE__ */ h(
              "wtext",
              {
                textColor: Color.gray(),
                font: Font.semiboldSystemFont(10),
              },
              market.name,
            ),
            /* @__PURE__ */ h("wspacer", {}),
            /* @__PURE__ */ h(
              "wtext",
              {
                textColor: Color.gray(),
                font: Font.semiboldSystemFont(10),
                textAlign: "right",
              },
              `H: ${market.high_24h}, L: ${market.low_24h}`,
            ),
          ),
        ),
        /* @__PURE__ */ h("wspacer", { length: 8 }),
        /* @__PURE__ */ h(
          "wstack",
          {
            width: 72,
            height: 28,
            verticalAlign: "center",
            background: changeColor,
            borderRadius: 4,
          },
          /* @__PURE__ */ h(
            "wtext",
            {
              textColor: new Color("#fff", 0.9),
              font: Font.semiboldSystemFont(14),
              textAlign: "center",
              maxLine: 1,
              scale: 0.01,
            },
            changeText,
          ),
        ),
      );
    };
    this.renderMedium = async (w) => {
      if (!this.dataSource || this.dataSource.length === 0) {
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
      const items = [];
      for (
        let index = 0;
        index < Math.min(this.dataSource.length, 3);
        index++
      ) {
        items.push(await this.renderRowCell(this.dataSource[index]));
        if (index < 2) {
          items.push(/* @__PURE__ */ h("wspacer", {}));
        }
      }
      GenrateView.setListWidget(w);
      return /* @__PURE__ */ h(
        "wbox",
        {
          spacing: 0,
          padding: [12, 12, 12, 12],
        },
        ...items,
      );
    };
    this.renderLarge = async (w) => {
      if (!this.dataSource || this.dataSource.length === 0) {
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
      const items = [];
      for (let index = 0; index < this.dataSource.length; index++) {
        items.push(await this.renderRowCell(this.dataSource[index]));
        if (index < this.dataSource.length - 1) {
          items.push(/* @__PURE__ */ h("wspacer", {}));
        }
      }
      GenrateView.setListWidget(w);
      return /* @__PURE__ */ h(
        "wbox",
        {
          spacing: 0,
          padding: [12, 12, 12, 12],
        },
        ...items,
      );
    };
    this.name = "数字货币";
    this.en = "CryptoCurrency";
    this.storageExpirationMinutes = 60;
    this.Run();
  }
  async loadCoinOptions() {
    try {
      const btcAll = await this.getAllJson();
      if (Array.isArray(btcAll) && btcAll.length > 0) {
        this.coinOptions = btcAll.map((item) => ({
          label: `${item.symbol.toUpperCase()} - ${item.name}`,
          value: item.symbol.toUpperCase(),
        }));
      } else {
        throw new Error("币种列表为空或格式错误");
      }
    } catch (e) {
      console.log(`加载币种列表失败: ${e}`);
      this.coinOptions = [
        { label: "BTC - Bitcoin", value: "BTC" },
        { label: "ETH - Ethereum", value: "ETH" },
        { label: "BNB - Binance Coin", value: "BNB" },
      ];
    }
  }
  async getAllJson() {
    const cacheKey = "btc_all_coins";
    const cached = this.storage.getStorage(cacheKey, 360);
    if (cached && Array.isArray(cached)) {
      console.log(`[+]使用缓存的币种列表，共 ${cached.length} 个`);
      return cached;
    }
    try {
      console.log(
        `[+]请求币种列表: ${this.endpoint}/coins/markets?vs_currency=usd&ids=`,
      );
      const response = await this.$request.get(
        `${this.endpoint}/coins/markets?vs_currency=usd&ids=`,
      );
      console.log(
        `[+]币种列表响应类型: ${typeof response}, 是否为数组: ${Array.isArray(response)}`,
      );
      if (response) {
        console.log(
          `[+]币种列表响应数据: ${JSON.stringify(response).substring(0, 200)}...`,
        );
      }
      if (Array.isArray(response)) {
        console.log(`[+]币种列表获取成功，共 ${response.length} 个`);
        this.storage.setStorage(cacheKey, response);
        return response;
      } else if (response && typeof response === "object") {
        const obj = response;
        if (obj.status && obj.status.error_code === 429) {
          console.log(`[+]API限流，使用缓存数据`);
          const fallbackCache = this.storage.getStorage(cacheKey);
          if (fallbackCache && Array.isArray(fallbackCache)) {
            console.log(`[+]使用过期缓存数据，共 ${fallbackCache.length} 个`);
            return fallbackCache;
          }
          console.log(`[+]无缓存数据可用`);
          return [];
        }
        console.log(`[+]响应是对象，尝试解析...`);
        if (obj.data && Array.isArray(obj.data)) {
          console.log(`[+]从 response.data 获取数组，共 ${obj.data.length} 个`);
          this.storage.setStorage(cacheKey, obj.data);
          return obj.data;
        } else {
          console.log(
            `[+]币种列表格式错误: 不是数组，类型: ${typeof response}`,
          );
          const fallbackCache = this.storage.getStorage(cacheKey);
          if (fallbackCache && Array.isArray(fallbackCache)) {
            console.log(`[+]使用过期缓存数据，共 ${fallbackCache.length} 个`);
            return fallbackCache;
          }
          return [];
        }
      } else {
        console.log(`[+]币种列表格式错误: ${typeof response}`);
        const fallbackCache = this.storage.getStorage(cacheKey);
        if (fallbackCache && Array.isArray(fallbackCache)) {
          console.log(`[+]使用过期缓存数据，共 ${fallbackCache.length} 个`);
          return fallbackCache;
        }
        return [];
      }
    } catch (e) {
      console.log(`[+]获取币种列表失败: ${e}`);
      const fallbackCache = this.storage.getStorage(cacheKey);
      if (fallbackCache && Array.isArray(fallbackCache)) {
        console.log(`[+]使用过期缓存数据，共 ${fallbackCache.length} 个`);
        return fallbackCache;
      }
      return [];
    }
  }
  async transforBtcType(params) {
    if (!params || !Array.isArray(params) || params.length === 0) {
      return "";
    }
    const btcAll = await this.getAllJson();
    if (!Array.isArray(btcAll) || btcAll.length === 0) {
      return "";
    }
    return params
      .map((symbol) => {
        const result =
          btcAll.find(
            (btc) => btc.symbol.toUpperCase() === symbol.toUpperCase(),
          ) || {};
        return result.id;
      })
      .filter((item) => !!item)
      .join(",");
  }
  async cacheData() {
    try {
      const btcType = this.currentSettings.basicSettings.btcType.val || [];
      console.log(`[+]当前选择的币种: ${JSON.stringify(btcType)}`);
      const ids = await this.transforBtcType(btcType);
      console.log(`[+]转换后的币种ID: ${ids}`);
      if (!ids) {
        console.log(`[+]未选择币种，不获取数据`);
        this.dataSource = [];
        this.isRequestSuccess = false;
        return;
      }
      const cacheKey = `btc_data_${this.md5(ids)}`;
      const cached = this.storage.getStorage(cacheKey, 360);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log(`[+]使用缓存的数据，共 ${cached.length} 个币种`);
        this.dataSource = cached;
        this.isRequestSuccess = true;
        return;
      }
      console.log(
        `[+]请求币种数据: ${this.endpoint}/coins/markets?vs_currency=usd&ids=${ids}`,
      );
      const responseStr = await this.$request.get(
        `${this.endpoint}/coins/markets?vs_currency=usd&ids=${ids}`,
        "STRING",
      );
      console.log(
        `[+]币种数据响应类型: ${typeof responseStr}, 长度: ${responseStr ? responseStr.length : 0}`,
      );
      if (responseStr) {
        console.log(`[+]币种数据响应预览: ${responseStr.substring(0, 200)}...`);
      }
      this.dataSource = [];
      const response = JSON.parse(responseStr);
      console.log(
        `[+]解析后的类型: ${typeof response}, 是否为数组: ${Array.isArray(response)}`,
      );
      if (
        response &&
        typeof response === "object" &&
        !Array.isArray(response)
      ) {
        const obj = response;
        if (obj.status && obj.status.error_code === 429) {
          console.log(`[+]API限流(429)，使用缓存数据`);
          const fallbackCache = this.storage.getStorage(cacheKey);
          if (
            fallbackCache &&
            Array.isArray(fallbackCache) &&
            fallbackCache.length > 0
          ) {
            console.log(
              `[+]使用过期缓存数据，共 ${fallbackCache.length} 个币种`,
            );
            this.dataSource = fallbackCache;
            this.isRequestSuccess = true;
            return;
          }
          console.log(`[+]无缓存数据可用`);
          this.isRequestSuccess = false;
          return;
        }
      }
      if (!Array.isArray(response) || !response.length) {
        console.log(`[+]币种数据格式错误或为空，尝试使用缓存`);
        const fallbackCache = this.storage.getStorage(cacheKey);
        if (
          fallbackCache &&
          Array.isArray(fallbackCache) &&
          fallbackCache.length > 0
        ) {
          console.log(`[+]使用过期缓存数据，共 ${fallbackCache.length} 个币种`);
          this.dataSource = fallbackCache;
          this.isRequestSuccess = true;
          return;
        }
        this.isRequestSuccess = false;
        return;
      }
      const markets = response;
      console.log(`[+]币种数据获取成功，共 ${markets.length} 个`);
      const idsData = ids.split(",");
      idsData.forEach((id) => {
        const it = markets.find((item) => item.id === id);
        if (it) {
          this.dataSource.push({
            id: it.id,
            name: it.name,
            image: it.image,
            symbol: it.symbol.toUpperCase(),
            current_price: "" + it.current_price,
            high_24h: it.high_24h,
            low_24h: it.low_24h,
            price_change_percentage_24h: it.price_change_percentage_24h,
            last_updated: it.last_updated,
          });
        }
      });
      console.log(`[+]处理后的数据源，共 ${this.dataSource.length} 个币种`);
      this.storage.setStorage(cacheKey, this.dataSource);
      this.isRequestSuccess = true;
    } catch (e) {
      console.log(`[+]获取数据失败: ${e}`);
      this.isRequestSuccess = false;
    }
  }
  Run() {
    if (config.runsInApp) {
      this.registerSettingCategory("basicSettings", "基础设置", [
        {
          title: "关注币种",
          desc: "选择关注的加密货币种类(可多选)\n缺省值: 未选择",
          icon: { name: "centsign.circle", color: "#feda31" },
          type: "select",
          option: {
            btcType: [],
          },
          config: {
            selectOptions: this.coinOptions,
            defaultShowContent: "未选择",
            multiple: true,
            editable: true,
          },
        },
      ]);
      this.registerSetting({
        title: "参数配置",
        icon: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/setting.png",
        onAction: async () => {
          await this.loadCoinOptions();
          await this.presentSettings(["basicSettings"]);
          return true;
        },
      });
    }
  }
  async getSmallBg(image) {
    if (!image) return null;
    try {
      const base64 = Data.fromPNG(image).toBase64String();
      const webview = new WebView();
      const result = await webview.evaluateJavaScript(
        `
                (function() {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    const img = new Image()
                    return new Promise((resolve) => {
                        img.onload = () => {
                            const { width, height } = img
                            canvas.width = width
                            canvas.height = height
                            ctx.globalAlpha = 0.3
                            ctx.drawImage(img, -width / 2 + 50, -height / 2 + 50, width, height)
                            resolve(canvas.toDataURL())
                        }
                        img.onerror = () => resolve(null)
                        img.src = 'data:image/png;base64,${base64}'
                    })
                })()
            `,
        true,
      );
      if (result) {
        const imageData = result.replace(/^data\:image\/\w+;base64,/, "");
        return Image.fromData(Data.fromBase64String(imageData));
      }
    } catch (e) {
      console.log(`生成背景图失败: ${e}`);
    }
    return null;
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
