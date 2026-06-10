// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: cogs;

/*
 * author   :  seiun
 * date     :  2021/11/13
 * build    :  2026-06-11 00:02:41
 * desc     :  Scriptable Widget env scripts, 基于2Ya的DmYY依赖 https://github.com/dompling/Scriptable/tree/master/Scripts
 * version  :  2.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 *   v2.0.0 (2025/12/3)
 *     - 使用 WebView 重写设置
 *     - 拼音字典剥离脚本，从远端加载
 *   v1.0.0
 *     - 初始版本
 */

const MODULE = module;

let URLSchemeFrom;
(function (URLSchemeFrom2) {
  URLSchemeFrom2["WIDGET"] = "widget";
})(URLSchemeFrom || (URLSchemeFrom = {}));
const DEFAULT_TRUNCATE_LENGTH = 10;
let globalStorage;
function isInICloud() {
  return MODULE.filename.includes("Documents/iCloud~");
}
function fm() {
  return FileManager[isInICloud() ? "iCloud" : "local"]();
}
function isHttpUrl(str) {
  return (
    typeof str === "string" &&
    (str.startsWith("http://") || str.startsWith("https://"))
  );
}
function isEmpty(obj) {
  if (typeof obj == "undefined" || obj == null || obj == "") {
    return true;
  } else {
    return false;
  }
}
function hash(string) {
  let hash2 = 0,
    i,
    chr;
  for (i = 0; i < string.length; i++) {
    chr = string.charCodeAt(i);
    hash2 = (hash2 << 5) - hash2 + chr;
    hash2 |= 0;
  }
  return `hash_${hash2}`;
}
function createWidgetBaseRuntime(deps2) {
  const {
    DEFAULT_TRUNCATE_LENGTH: DEFAULT_TRUNCATE_LENGTH2,
    Storage: Storage2,
    globalStorage: globalStorage2,
    isInICloud: isInICloud2,
    isHttpUrl: isHttpUrl2,
    isEmpty: isEmpty2,
    hash: hash2,
  } = deps2;
  const phoneWidgetSizes = {
    // Pixel sizes and positions for widgets on all supported phones.
    // 数据来源: Apple HIG、mzeryck/3a97ccd1e059b3afa3c6666d27a496c9 和社区透明组件表
    // iPhone 17 Pro Max, 16 Pro Max (6.9")
    2868: {
      small: 534,
      medium: 1146,
      large: 1200,
      left: 114,
      right: 726,
      top: 276,
      middle: 930,
      bottom: 1584,
    },
    // iPhone 14 Pro Max, 15 Pro Max, 15 Plus, 16 Plus (6.7")
    2796: {
      small: 510,
      medium: 1092,
      large: 1146,
      left: 99,
      right: 681,
      top: 282,
      middle: 918,
      bottom: 1554,
    },
    // iPhone 14 Plus, 13 Pro Max, 12 Pro Max (6.7")
    2778: {
      small: 510,
      medium: 1092,
      large: 1146,
      left: 96,
      right: 678,
      top: 246,
      middle: 882,
      bottom: 1518,
    },
    // iPhone Air (6.5")
    // 新 1260x2736px 档位；尺寸按 420x912pt @3x 推算，位置需真机透明背景截图校正。
    2736: {
      small: 510,
      medium: 1086,
      large: 1143,
      left: 87,
      right: 663,
      top: 276,
      middle: 912,
      bottom: 1548,
    },
    // iPhone 17, 17 Pro, 16 Pro (6.3")
    2622: {
      small: 486,
      medium: 1032,
      large: 1098,
      left: 87,
      right: 633,
      top: 261,
      middle: 872,
      bottom: 1485,
    },
    // iPhone 14 Pro, 15 Pro, 15, 16, 16e (6.1" Dynamic Island)
    2556: {
      small: 474,
      medium: 1014,
      large: 1062,
      left: 81,
      right: 621,
      top: 276,
      middle: 864,
      bottom: 1452,
    },
    // iPhone 17e, 14, 13, 13 Pro, 12, 12 Pro (6.1")
    2532: {
      small: 474,
      medium: 1014,
      large: 1062,
      left: 78,
      right: 618,
      top: 231,
      middle: 819,
      bottom: 1407,
    },
    // iPhone 12 mini, 13 mini (5.4")
    2340: {
      small: 465,
      medium: 987,
      large: 1035,
      left: 69,
      right: 591,
      top: 231,
      middle: 801,
      bottom: 1371,
    },
    // iPhone 11 Pro Max, XS Max (6.5")
    2688: {
      small: 507,
      medium: 1080,
      large: 1137,
      left: 81,
      right: 654,
      top: 228,
      middle: 858,
      bottom: 1488,
    },
    // iPhone 11 Pro, XS, X (5.8")
    2436: {
      small: 465,
      medium: 987,
      large: 1035,
      left: 69,
      right: 591,
      top: 213,
      middle: 783,
      bottom: 1353,
    },
    // iPhone 11, XR (6.1" LCD)
    1792: {
      small: 338,
      medium: 720,
      large: 758,
      left: 54,
      right: 436,
      top: 160,
      middle: 580,
      bottom: 1e3,
    },
    // iPhone 6/6S/7/8 Plus (5.5")
    2208: {
      small: 471,
      medium: 1044,
      large: 1071,
      left: 99,
      right: 672,
      top: 114,
      middle: 696,
      bottom: 1278,
    },
    // iPhone SE 2/3, 6/6S/7/8 (4.7")
    1334: {
      small: 296,
      medium: 642,
      large: 648,
      left: 54,
      right: 400,
      top: 60,
      middle: 412,
      bottom: 764,
    },
    // iPhone SE 1, 5/5S/5C (4")
    1136: {
      small: 282,
      medium: 584,
      large: 622,
      left: 30,
      right: 332,
      top: 59,
      middle: 399,
      bottom: 399,
    },
    // iPhone 11, XR in Display Zoom mode
    1624: {
      small: 310,
      medium: 658,
      large: 690,
      left: 46,
      right: 394,
      top: 142,
      middle: 522,
      bottom: 902,
    },
    // Plus phones in Display Zoom mode
    2001: {
      small: 444,
      medium: 963,
      large: 972,
      left: 81,
      right: 600,
      top: 90,
      middle: 618,
      bottom: 1146,
    },
  };
  class WidgetBase2 {
    constructor(arg) {
      this.arg = arg;
      try {
        this._init();
      } catch (error) {
        console.log(`[WidgetBase][constructor]`, error);
      }
      this.isNight = Device.isUsingDarkAppearance();
    }
    _actions = {};
    BACKGROUND_DAY_KEY = "dayBg";
    BACKGROUND_NIGHT_KEY = "nightBg";
    BACKGROUND_TRANSPARENT_KEY = "transparentBg";
    widgetScale = 1;
    widgetColor = void 0;
    backGroundColor = void 0;
    useBoxJS = true;
    isNight;
    _actionsIcon = {};
    storageExpirationMinutes = 30;
    // 个性化设置相关(头像使用文件缓存，无默认值)
    userConfigMap = /* @__PURE__ */ new Map([
      ["avatar", null],
      ["nickname", "昵称"],
      ["homePageDesc", "点击配置个性化设置！"],
      ["avatarUrl", "https://github.com/zhangyxXyz/ios-scriptable"],
    ]);
    BaseCacheKey = "Scriptable_Seiun_Base_Settings";
    baseSettings = {};
    get userConfigKeys() {
      return Array.from(this.userConfigMap.keys());
    }
    get storage() {
      if (!this._storage) {
        const namespace =
          this.en || MODULE.filename.split("/").pop().replace(".js", "");
        this._storage = new Storage2(
          namespace,
          this.storageExpirationMinutes,
          isInICloud2(),
        );
      }
      return this._storage;
    }
    get settingsStorage() {
      if (!this._settingsStorage) {
        const namespace =
          this.en || MODULE.filename.split("/").pop().replace(".js", "");
        this._settingsStorage = new Storage2(
          `${namespace}/settings`,
          0,
          isInICloud2(),
        );
      }
      return this._settingsStorage;
    }
    getUserConfig(key) {
      return this.baseSettings.hasOwnProperty(key)
        ? this.baseSettings[key]
        : this.userConfigMap.get(key);
    }
    // 组件设置（统一存储所有注册的设置项）
    _settings = {};
    // 组件当前设置
    currentSettings = {};
    // 无分类名称（未指定分类的当前设置存放在 this.settings[this.noneCategoryName]）
    noneCategoryName = "noneCategory";
    basicSettingsCategoryName = "basicSettings";
    settingValTypeString = "string";
    stttingValTypeStringEmptyCheck = "stringecheck";
    // 如果是空字符 赋值为 null
    settingValTypeInt = "int";
    settingValTypeFloat = "float";
    settingValTypeBool = "bool";
    settingValTypeArray = "array";
    // 获取 Request 对象
    getRequest = (url2 = "") => {
      return new Request(url2);
    };
    // 发起请求
    http = async (options = { headers: {}, url: "" }, type = "JSON") => {
      try {
        let request;
        if (type !== "IMG") {
          request = this.getRequest();
          Object.keys(options).forEach((key) => {
            request[key] = options[key];
          });
          request.headers = { ...this.defaultHeaders, ...options.headers };
        } else {
          request = this.getRequest(options.url);
          return (await request.loadImage()) || SFSymbol.named("photo").image;
        }
        if (type === "JSON") {
          return await request.loadJSON();
        }
        if (type === "STRING") {
          return await request.loadString();
        }
        return await request.loadJSON();
      } catch (e) {
        console.log(`[WidgetBase][http] error: ${e}`);
        if (type === "IMG") return SFSymbol.named("photo").image;
      }
    };
    //request 接口请求
    $request = {
      get: async (url2 = "", options = {}, type = "JSON") => {
        let params = { ...options, method: "GET" };
        if (typeof url2 === "object") {
          params = { ...params, ...url2 };
        } else {
          params.url = url2;
        }
        let _type = type;
        if (typeof options === "string") _type = options;
        return await this.http(params, _type);
      },
      post: async (url2 = "", options = {}, type = "JSON") => {
        let params = { ...options, method: "POST" };
        if (typeof url2 === "object") {
          params = { ...params, ...url2 };
        } else {
          params.url = url2;
        }
        let _type = type;
        if (typeof options === "string") _type = options;
        return await this.http(params, _type);
      },
    };
    getCache = async (key = "", notify = true) => {
      try {
        let url2 = "http://" + this.prefix + "/query/boxdata";
        if (key) url2 = "http://" + this.prefix + "/query/data/" + key;
        const boxdata = await this.$request.get(
          url2,
          key ? { timeoutInterval: 1 } : {},
        );
        if (key) {
          this.settings.BoxJSData = {
            ...this.settings.BoxJSData,
            [key]: boxdata.val,
          };
          this.saveSettings(false);
        }
        if (boxdata.val) return boxdata.val;
        return boxdata.datas;
      } catch (e) {
        if (key && this.settings.BoxJSData && this.settings.BoxJSData[key]) {
          return this.settings.BoxJSData[key];
        }
        if (notify) {
          await this.notify(
            "BoxJS 数据读取失败",
            "请检查 BoxJS 域名是否为代理复写的域名，如（boxjs.com 或 boxjs.net）。\n若没有配置 BoxJS 相关模块，请点击通知查看教程",
            "https://chavyleung.gitbook.io/boxjs/awesome/videos",
          );
        }
        return false;
      }
    };
    transforJSON = (str) => {
      if (typeof str == "string") {
        try {
          return JSON.parse(str);
        } catch (e) {
          console.log(`[WidgetBase][transforJSON]`, e);
          return str;
        }
      }
      console.log(`[WidgetBase][transforJSON] It is not a string!`);
    };
    // 选择图片并缓存
    chooseImg = async () => {
      return await Photos.fromLibrary();
    };
    // 根据 URL/路径读取图片（支持自定义 storage 和 cacheKey）
    getImageByUrl = async (imageUrl, storage = null, cacheKey = null) => {
      if (!imageUrl) return null;
      const targetStorage = storage || this.storage;
      if (isHttpUrl2(imageUrl)) {
        return await targetStorage.getImage(imageUrl, true, true, false);
      } else if (imageUrl.startsWith("data:image")) {
        return await targetStorage.getImage(
          imageUrl,
          true,
          true,
          false,
          cacheKey,
        );
      } else if (imageUrl.startsWith("@album:")) {
        const fileKey = imageUrl.replace("@album:", "");
        return await targetStorage.getFile(fileKey, true, false);
      } else {
        return null;
      }
    };
    // 设置 widget 背景图片
    getWidgetBackgroundImage = async (widget) => {
      const backgroundImageUrl = this.getBackgroundImage();
      if (backgroundImageUrl) {
        const backgroundImage = await this.getImageByUrl(backgroundImageUrl);
        if (backgroundImage) {
          const opacity = Device.isUsingDarkAppearance()
            ? Number(this.settings.darkOpacity)
            : Number(this.settings.lightOpacity);
          widget.backgroundImage = await this.shadowImage(
            backgroundImage,
            "#000",
            opacity,
          );
          return true;
        }
      }
      if (this.backGroundColor.colors) {
        widget.backgroundGradient = this.backGroundColor;
      } else {
        widget.backgroundColor = this.backGroundColor;
      }
      return false;
    };
    /**
     * 验证图片尺寸： 图片像素超过 1000 左右的时候会导致背景无法加载
     * @param img Image
     */
    verifyImage = async (img) => {
      try {
        const { width, height } = img.size;
        const direct = true;
        if (width > 1e3) {
          const options = ["取消", "打开图像处理"];
          const message =
            "您的图片像素为" +
            width +
            " x " +
            height +
            "\n请将图片" +
            (direct ? "宽度" : "高度") +
            "调整到 1000 以下\n" +
            (!direct ? "宽度" : "高度") +
            "自动适应";
          const index = await this.generateAlert(message, options);
          if (index === 1)
            Safari.openInApp("https://www.sojson.com/image/change.html", false);
          return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    };
    /**
     * 获取截图中的组件剪裁图
     * 可用作透明背景
     * 返回图片image对象
     * 代码改自：https://gist.github.com/mzeryck/3a97ccd1e059b3afa3c6666d27a496c9
     * @param {string} title 开始处理前提示用户截图的信息，可选（适合用在组件自定义透明背景时提示）
     */
    async getWidgetScreenShot(title = null) {
      function cropImage(img2, rect) {
        const draw = new DrawContext();
        draw.size = new Size(rect.width, rect.height);
        draw.drawImageAtPoint(img2, new Point(-rect.x, -rect.y));
        return draw.getImage();
      }
      const phoneSizes = () => phoneWidgetSizes;
      let message =
        title || "开始之前，请先前往桌面，截取空白界面的截图。然后回来继续";
      const exitOptions = ["我已截图", "前去截图 >"];
      const shouldExit = await this.generateAlert(message, exitOptions);
      if (shouldExit) return;
      const img = await Photos.fromLibrary();
      const height = img.size.height;
      const phone = phoneSizes()[height];
      if (!phone) {
        message = "好像您选择的照片不是正确的截图，请先前往桌面";
        await this.generateAlert(message, ["我已知晓"]);
        return;
      }
      message = "截图中要设置透明背景组件的尺寸类型是？";
      const sizes = ["小尺寸", "中尺寸", "大尺寸"];
      const size = await this.generateAlert(message, sizes);
      const widgetSize = sizes[size];
      message = "要设置透明背景的小组件在哪个位置？";
      message +=
        height === 1136
          ? " （备注：当前设备只支持两行小组件，所以下边选项中的「中间」和「底部」的选项是一致的）"
          : "";
      const crop = { w: "", h: "", x: "", y: "" };
      if (widgetSize === "小尺寸") {
        crop.w = phone.small;
        crop.h = phone.small;
        const positions = [
          "左上角",
          "右上角",
          "中间左",
          "中间右",
          "左下角",
          "右下角",
        ];
        const _posotions = [
          "Top left",
          "Top right",
          "Middle left",
          "Middle right",
          "Bottom left",
          "Bottom right",
        ];
        const position = await this.generateAlert(message, positions);
        const keys = _posotions[position].toLowerCase().split(" ");
        crop.y = phone[keys[0]];
        crop.x = phone[keys[1]];
      } else if (widgetSize === "中尺寸") {
        crop.w = phone.medium;
        crop.h = phone.small;
        crop.x = phone.left;
        const positions = ["顶部", "中间", "底部"];
        const _positions = ["Top", "Middle", "Bottom"];
        const position = await this.generateAlert(message, positions);
        const key = _positions[position].toLowerCase();
        crop.y = phone[key];
      } else if (widgetSize === "大尺寸") {
        crop.w = phone.medium;
        crop.h = phone.large;
        crop.x = phone.left;
        const positions = ["顶部", "底部"];
        const position = await this.generateAlert(message, positions);
        crop.y = position ? phone.middle : phone.top;
      }
      return cropImage(img, new Rect(crop.x, crop.y, crop.w, crop.h));
    }
    setLightAndDark = async (title, desc, val) => {
      try {
        const a = new Alert();
        a.title = title;
        a.message = desc;
        a.addTextField("", `${this.settings[val]}`);
        a.addAction("确定");
        a.addCancelAction("取消");
        const id = await a.presentAlert();
        if (id === -1) return;
        this.settings[val] = a.textFieldValue(0);
        this.saveSettings();
      } catch (e) {
        console.log(`[WidgetBase][setLightAndDark]`, e);
      }
    };
    saveSettingsData = (data2, category) => {
      if (category) {
        Object.keys(data2).forEach((key) => {
          this.settings[category] = this.settings[category] || {};
          this.settings[category][key] = data2[key];
        });
      } else {
        this.settings = { ...this.settings, ...data2 };
      }
      return this.saveSettings();
    };
    /**
     * 弹出输入框
     * @param title 标题
     * @param desc  描述
     * @param opt   属性
     * @param category 属性分类
     * @param isSave 是否保存设置
     * @returns {Promise<void>}
     */
    setAlertInput = async (
      title,
      desc,
      opt = {},
      category = null,
      isSave = true,
    ) => {
      const a = new Alert();
      a.title = title;
      a.message = !desc ? "" : desc;
      Object.keys(opt).forEach((key) => {
        const curCategory = category || this.noneCategoryName;
        a.addTextField(
          String(opt[key]),
          String(
            curCategory !== this.noneCategoryName
              ? this.settings.hasOwnProperty(curCategory) &&
                this.settings[curCategory].hasOwnProperty(key)
                ? this.settings[curCategory][key] || ""
                : ""
              : this.settings[key] || "",
          ),
        );
      });
      a.addAction("确定");
      a.addCancelAction("取消");
      const id = await a.presentAlert();
      if (id === -1) return;
      const data2 = {};
      Object.keys(opt).forEach((key, index) => {
        data2[key] = a.textFieldValue(index);
        const curCategory = category || this.noneCategoryName;
        if (
          this.currentSettings.hasOwnProperty(curCategory) &&
          this.currentSettings[curCategory].hasOwnProperty(key)
        ) {
          this.updateCurrentSettings(
            this.currentSettings[curCategory][key],
            data2[key],
          );
        }
      });
      if (isSave) {
        return this.saveSettingsData(data2, category);
      }
      return data2;
    };
    /**
     * 弹出选择框
     * @param title 标题
     * @param desc  描述
     * @param settingKey 设置项key
     * @param menu   菜单
     * @param category 属性分类
     * @param isSave 是否保存设置
     * @returns {Promise<void>}
     */
    setAlertSelect = async (
      title,
      desc,
      settingKey,
      menu = [],
      category = null,
      isSave = true,
    ) => {
      const a = new Alert();
      a.title = title;
      a.message = !desc ? "" : desc;
      a.addCancelAction("取消");
      const menuKeys = Array.isArray(menu)
        ? menu.map((_, i) => i)
        : Object.keys(menu);
      menuKeys.forEach((key) => {
        a.addAction(menu[key]);
      });
      const id = await a.presentAlert();
      if (id === -1) return;
      const data2 = {};
      const selectedKey = Array.isArray(menu) ? id : menuKeys[id];
      data2[settingKey] = menu[selectedKey];
      const curCategory = category || this.noneCategoryName;
      if (
        this.currentSettings.hasOwnProperty(curCategory) &&
        this.currentSettings[curCategory].hasOwnProperty(settingKey)
      ) {
        this.updateCurrentSettings(
          this.currentSettings[curCategory][settingKey],
          data2[settingKey],
        );
      }
      if (isSave) {
        return this.saveSettingsData(data2, category);
      }
      return data2;
    };
    /**
     * 弹出颜色选择器（使用WebView原生颜色选择器）
     * @param title 标题
     * @param desc  描述
     * @param val   设置项key
     * @param category 属性分类（可选）
     * @param defaultValue 默认值（可选）
     * @returns {Promise<void>}
     */
    setColorInput = async (
      title,
      desc,
      val,
      category = null,
      defaultValue = "#ffffff",
    ) => {
      try {
        let currentColor = defaultValue;
        if (category) {
          if (this.settings[category] && this.settings[category][val]) {
            currentColor = this.settings[category][val];
          }
        } else {
          currentColor = this.settings[val] || defaultValue;
        }
        currentColor = currentColor.split(",")[0];
        const html = `
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                                * { margin: 0; padding: 0; }
                                body {
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    min-height: 100vh;
                                    background: transparent;
                                }
                                input[type="color"] {
                                    -webkit-appearance: none;
                                    width: 200px;
                                    height: 200px;
                                    border: none;
                                    cursor: pointer;
                                    padding: 0;
                                    background: transparent;
                                }
                                input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
                                input[type="color"]::-webkit-color-swatch { border: none; border-radius: 20px; }
                            </style>
                        </head>
                        <body>
                            <input type="color" id="colorPicker" value="${currentColor}">
                            <script>
                                document.getElementById('colorPicker').click();
                            </script>
                        </body>
                    </html>`;
        const webView = new WebView();
        await webView.loadHTML(html);
        await webView.present();
        const result = await webView.evaluateJavaScript(
          'document.getElementById("colorPicker").value',
        );
        if (result) {
          if (category) {
            if (!this.settings[category]) {
              this.settings[category] = {};
            }
            this.settings[category][val] = result;
          } else {
            this.settings[val] = result;
          }
          this.saveSettings();
        }
      } catch (e) {
        console.log(`[WidgetBase][setColorInput]`, e);
      }
    };
    /**
     * 设置当前项目的 boxJS 缓存
     * @param opt key value
     * @returns {Promise<void>}
     */
    setCacheBoxJSData = async (opt = {}) => {
      const options = ["取消", "确定"];
      const message = "代理缓存仅支持 BoxJS 相关的代理！";
      const index = await this.generateAlert(message, options);
      if (index === 0) return;
      try {
        const boxJSData = await this.getCache();
        Object.keys(opt).forEach((key) => {
          this.settings[key] = boxJSData[opt[key]] || "";
        });
        this.saveSettings();
      } catch (e) {
        console.log(`[WidgetBase][setCacheBoxJSData]`, e);
        this.notify(
          this.name,
          "BoxJS 缓存读取失败！点击查看相关教程",
          "https://chavyleung.gitbook.io/boxjs/awesome/videos",
        );
      }
    };
    /**
     * 个性化设置
     * @param {WebView} parentWebView 父级 WebView，用于更新头像区域
     */
    setUserInfo = async () => {
      this.baseSettings = this.getBaseSettings();
      const userSettings = {
        userInfoSettings: {
          title: "个性设置",
          items: [
            {
              type: "image",
              title: "首页头像",
              desc: "",
              icon: { name: "person", color: "#fa541c" },
              option: { avatar: this.baseSettings.avatar || "" },
              config: {
                imageSource: "both",
                showThumbnail: true,
                placeholder: "🔗请输入头像URL",
                notifyOnSet: false,
                setIcon: "person.crop.circle.fill",
                emptyIcon: "person.crop.circle.badge.plus",
              },
            },
            {
              type: "text",
              title: "首页昵称",
              desc: "个性化首页昵称",
              icon: { name: "pencil", color: "#fa8c16" },
              option: {
                [this.userConfigKeys[1]]: this.getUserConfig(
                  this.userConfigKeys[1],
                ),
              },
              config: {
                placeholder: "👤请输入头像昵称",
                truncateLength: 0,
                useRawValue: true,
              },
            },
            {
              type: "text",
              title: "首页昵称描述",
              desc: "个性化首页昵称描述",
              icon: { name: "lineweight", color: "#a0d911" },
              option: {
                [this.userConfigKeys[2]]: this.getUserConfig(
                  this.userConfigKeys[2],
                ),
              },
              config: {
                placeholder: "请输入描述",
                style: "compact",
                truncateLength: 0,
                useRawValue: true,
              },
            },
            {
              type: "text",
              title: "头像跳转链接",
              desc: "点击头像后跳转的网页地址",
              icon: { name: "link", color: "#1890ff" },
              option: {
                [this.userConfigKeys[3]]: this.getUserConfig(
                  this.userConfigKeys[3],
                ),
              },
              config: {
                placeholder: "请输入URL",
                style: "compact",
                truncateLength: 0,
                useRawValue: true,
              },
            },
          ],
        },
        otherSettings: {
          title: "",
          items: [],
        },
      };
      if (this.useBoxJS) {
        userSettings.otherSettings.items.push({
          type: "text",
          title: "BoxJS 域名",
          desc: "设置BoxJS访问域名，如：boxjs.net 或 boxjs.com",
          icon: { name: "shippingbox", color: "#f7bb10" },
          option: {
            boxjsDomain: this.baseSettings.boxjsDomain || "boxjs.com",
          },
          config: {
            placeholder: "boxjs.net",
            truncateLength: 0,
            useRawValue: true,
          },
        });
      }
      const customActionHandler = async (code2, data2, previewWebView) => {
        if (code2 === `refresh-image-status-${this.userConfigKeys[0]}`) {
          return false;
        }
        if (code2 === "__reset__") {
          const options = ["取消", "重置"];
          const message = "确定要重置个性化设置吗？脚本将自动重启";
          const index = await this.generateAlert(message, options);
          if (index === 1) {
            for (const key of this.userConfigKeys) {
              if (this.baseSettings[key]) {
                delete this.baseSettings[key];
              }
              const urlKey = key + "_url";
              if (this.baseSettings[urlKey]) {
                delete this.baseSettings[urlKey];
              }
            }
            this.globalStorage.removeFile(this.userConfigKeys[0]);
            if (this.baseSettings.boxjsDomain) {
              delete this.baseSettings.boxjsDomain;
            }
            this.saveBaseSettings({}, false);
            this.reopenScript();
            return true;
          }
          return true;
        }
        if (code2.includes("__")) {
          const [categoryKey, key] = code2.split("__");
          if (
            categoryKey === "userInfoSettings" ||
            categoryKey === "otherSettings"
          ) {
            if (
              key &&
              [...this.userConfigKeys.slice(1), "boxjsDomain"].includes(key)
            ) {
              if (data2 !== void 0) {
                this.baseSettings[key] = data2;
                this.saveBaseSettings(this.baseSettings, false);
              }
              return true;
            }
            return false;
          }
        }
        return false;
      };
      await this.presentSettings(
        userSettings,
        true,
        null,
        null,
        customActionHandler,
      );
    };
    /**
     * 重新打开脚本
     */
    reopenScript = () => {
      Safari.open(`scriptable:///run/${encodeURIComponent(Script.name())}`);
    };
    /**
     * 清空所有背景图片
     */
    clearAllBackgrounds = async () => {
      this.settings[this.BACKGROUND_DAY_KEY] = "";
      this.settings[this.BACKGROUND_NIGHT_KEY] = "";
      this.settings[this.BACKGROUND_TRANSPARENT_KEY] = "";
      this.saveSettings(false);
    };
    /**
     * 设置基础输入框
     */
    setBaseAlertInput = async (title, desc, opt = {}, isSave = true) => {
      const a = new Alert();
      a.title = title;
      a.message = desc || "";
      Object.keys(opt).forEach((key) => {
        a.addTextField(String(opt[key]), String(this.baseSettings[key] || ""));
      });
      a.addAction("确定");
      a.addCancelAction("取消");
      const id = await a.presentAlert();
      if (id === -1) return null;
      const data2 = {};
      Object.keys(opt).forEach((key, index) => {
        data2[key] = a.textFieldValue(index);
      });
      if (isSave) return this.saveBaseSettings(data2);
      return data2;
    };
    /**
     * 根据路径设置背景图片
     */
    setBackgroundImageByPath = async (img, fileName, notify = true) => {
      if (!img) {
        this.settingsStorage.removeFile(fileName);
        return false;
      }
      this.settingsStorage.setFile(fileName, img);
      if (notify) this.notify("设置成功", "组件稍后将自动刷新");
      const savedImg = await this.settingsStorage.getFile(
        fileName,
        true,
        false,
      );
      return savedImg
        ? `data:image/png;base64,${Data.fromPNG(savedImg).toBase64String()}`
        : false;
    };
    /**
     * 设置组件内容 - 采用统一注册接口
     * @returns {Promise<void>}
     */
    setWidgetConfig = async () => {
      this._settings = this._settings || {};
      this._settings.baseSettings = { title: "基础设置", items: [] };
      this._settings.bgColorSettings = { title: "背景颜色", items: [] };
      this._settings.bgImageSettings = { title: "背景图片", items: [] };
      this._settings.bgOpacitySettings = { title: "蒙层透明度", items: [] };
      this.registerSetting([
        // 基础设置
        {
          category: "baseSettings",
          title: "刷新时间",
          desc: "刷新时间仅供参考，具体刷新时间由系统判断（单位：分钟）",
          icon: { name: "arrow.clockwise", color: "#1890ff" },
          type: "text",
          option: {
            refreshAfterDate: this.settings.refreshAfterDate || "",
          },
          config: {
            placeholder: "请输入刷新时间（分钟）",
          },
        },
        {
          category: "baseSettings",
          title: "全局缩放比例",
          desc: "不同机型会造成组件显示问题，适当调整该参数，如0.95、0.9，视小组件显示效果自行调整",
          icon: {
            name: "arrow.up.left.and.arrow.down.right",
            color: "#722ed1",
          },
          type: "text",
          option: {
            widgetScale: this.settings.widgetScale || 1,
          },
          config: {
            placeholder: "1",
          },
        },
        {
          category: "baseSettings",
          title: "白天字体颜色",
          desc: "请自行去网站上搜寻颜色（Hex 颜色）",
          icon: { name: "sun.max.fill", color: "#d48806" },
          type: "color",
          option: { lightColor: this.settings.lightColor || "#000000" },
        },
        {
          category: "baseSettings",
          title: "晚上字体颜色",
          desc: "请自行去网站上搜寻颜色（Hex 颜色）",
          icon: { name: "moon.stars.fill", color: "#d4b106" },
          type: "color",
          option: { darkColor: this.settings.darkColor || "#ffffff" },
        },
        // 背景颜色
        {
          category: "bgColorSettings",
          title: "白天背景颜色",
          desc: "请自行去网站上搜寻颜色（Hex 颜色）\n支持渐变色，各颜色之间以英文逗号分隔",
          icon: { name: "photo", color: "#13c2c2" },
          type: "color",
          option: { lightBgColor: this.settings.lightBgColor || "" },
        },
        {
          category: "bgColorSettings",
          title: "晚上背景颜色",
          desc: "请自行去网站上搜寻颜色（Hex 颜色）\n支持渐变色，各颜色之间以英文逗号分隔",
          icon: { name: "photo.fill", color: "#52c41a" },
          type: "color",
          option: { darkBgColor: this.settings.darkBgColor || "" },
        },
        // 背景图片
        {
          category: "bgImageSettings",
          title: "日间背景图片",
          desc: "",
          icon: { name: "photo.on.rectangle", color: "#fa8c16" },
          type: "image",
          option: {
            [this.BACKGROUND_DAY_KEY]:
              this.settings[this.BACKGROUND_DAY_KEY] || "",
          },
          config: {
            imageSource: "album",
            showThumbnail: false,
            clearable: false,
            notifyOnSet: true,
            notifyMessages: {
              success: {
                title: "设置成功",
                body: "小组件日间背景图片已设置，稍后刷新生效",
              },
              clear: {
                title: "移除成功",
                body: "小组件日间背景图片已移除，稍后刷新生效",
              },
            },
          },
        },
        {
          category: "bgImageSettings",
          title: "夜间背景图片",
          desc: "",
          icon: { name: "photo.fill.on.rectangle.fill", color: "#fa541c" },
          type: "image",
          option: {
            [this.BACKGROUND_NIGHT_KEY]:
              this.settings[this.BACKGROUND_NIGHT_KEY] || "",
          },
          config: {
            imageSource: "album",
            showThumbnail: false,
            clearable: false,
            notifyOnSet: true,
            notifyMessages: {
              success: {
                title: "设置成功",
                body: "小组件夜间背景图片已设置，稍后刷新生效",
              },
              clear: {
                title: "移除成功",
                body: "小组件夜间背景图片已移除，稍后刷新生效",
              },
            },
          },
        },
        {
          category: "bgImageSettings",
          title: "透明背景设置",
          desc: "",
          icon: { name: "text.below.photo", color: "#faad14" },
          type: "image",
          option: {
            [this.BACKGROUND_TRANSPARENT_KEY]:
              this.settings[this.BACKGROUND_TRANSPARENT_KEY] || "",
          },
          config: {
            imageSource: "screenshot",
            showThumbnail: false,
            clearable: false,
            notifyOnSet: true,
            notifyMessages: {
              success: {
                title: "设置成功",
                body: "透明背景已设置，稍后刷新生效",
              },
              clear: {
                title: "移除成功",
                body: "透明背景已移除，稍后刷新生效",
              },
            },
          },
        },
        {
          category: "bgImageSettings",
          title: "清空背景图片",
          desc: "",
          icon: { name: "clear", color: "#f5222d" },
          type: "removeBackground",
          option: {},
        },
        // 蒙层透明度
        {
          category: "bgOpacitySettings",
          title: "日间蒙层透明",
          desc: "完全透明请设置为0",
          icon: { name: "record.circle", color: "#722ed1" },
          type: "slider",
          option: {
            lightOpacity: this.settings.lightOpacity || 0.5,
          },
          config: {
            min: 0,
            max: 1,
            step: 0.01,
            unit: "",
          },
        },
        {
          category: "bgOpacitySettings",
          title: "夜间蒙层透明",
          desc: "完全透明请设置为0",
          icon: { name: "record.circle.fill", color: "#eb2f96" },
          type: "slider",
          option: {
            darkOpacity: this.settings.darkOpacity || 0.5,
          },
          config: {
            min: 0,
            max: 1,
            step: 0.01,
            unit: "",
          },
        },
      ]);
      const widgetSettings = {
        baseSettings: this._settings.baseSettings,
        bgColorSettings: this._settings.bgColorSettings,
        bgImageSettings: this._settings.bgImageSettings,
        bgOpacitySettings: this._settings.bgOpacitySettings,
      };
      return await this.presentSettings(widgetSettings, true);
    };
    /**
     * 加载 SF Symbol 为 Base64
     * @param {string} icon SF Symbol 名称
     * @param {string} color 颜色（Hex 格式）
     * @param {number|boolean} cornerWidthOrPure 圆角背景宽度，或 true 表示纯色图标（不带背景）
     * @param {number} fontSize 纯色模式下的字体大小（仅 cornerWidthOrPure=true 时有效）
     * @returns {Promise<string>} Base64 图片字符串
     */
    loadSF2B64 = async (
      icon = "square.grid.2x2",
      color = "#56A8D6",
      cornerWidthOrPure = 42,
      fontSize = 14,
    ) => {
      if (cornerWidthOrPure === true) {
        const sfi = SFSymbol.named(icon);
        sfi.applyFont(Font.semiboldSystemFont(fontSize));
        const imgData = Data.fromPNG(sfi.image).toBase64String();
        const html = `<img id="src" src="data:image/png;base64,${imgData}" /><canvas id="c" />`;
        const js = `
                    var c = document.getElementById("c");
                    var img = document.getElementById("src");
                    var ctx = c.getContext("2d");
                    c.width = img.width;
                    c.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    var d = ctx.getImageData(0, 0, c.width, c.height);
                    var p = d.data;
                    var r = parseInt("${color}".slice(1, 3), 16);
                    var g = parseInt("${color}".slice(3, 5), 16);
                    var b = parseInt("${color}".slice(5, 7), 16);
                    for (var i = 0; i < p.length; i += 4) { p[i] = r; p[i+1] = g; p[i+2] = b; }
                    ctx.putImageData(d, 0, 0);
                    c.toDataURL()
                `;
        const wv = new WebView();
        await wv.loadHTML(html);
        return await wv.evaluateJavaScript(js);
      }
      const sfImg = await this.drawTableIcon(icon, color, cornerWidthOrPure);
      return `data:image/png;base64,${Data.fromPNG(sfImg).toBase64String()}`;
    };
    /**
     * 获取 WebView 共享的基础 CSS 样式
     * @param {Object} options 配置选项
     * @param {number} options.settingItemFontSize 设置项字体大小，默认 15
     * @param {number} options.authorNameFontSize 作者名称字体大小，默认 20
     * @param {number} options.authorDescFontSize 作者描述字体大小，默认 12
     * @returns {string} CSS 样式字符串
     */
    getSharedWebViewStyles = (options = {}) => {
      const {
        settingItemFontSize = 15,
        authorNameFontSize = 20,
        authorDescFontSize = 12,
      } = options;
      return `
                :root {
                    --color-primary: #007aff;
                    --color-text: #000;
                    --color-muted: #86868b;
                    --color-secondary: rgba(60,60,67,0.6);
                    --color-divider: rgba(60,60,67,0.16);
                    --card-bg: #fff;
                    --radius-card: 10px;
                    --radius-popup: 24px;
                    --shadow: 0 0 0 0.5px rgba(0,0,0,0.1), 0 8px 40px rgba(0,0,0,0.15);
                    --popup-blur: saturate(180%) blur(40px);
                }
                * { -webkit-user-select: none; user-select: none; }
                body {
                    margin: 10px 0;
                    -webkit-font-smoothing: antialiased;
                    font-family: "SF Pro Display","SF Pro Icons","Helvetica Neue","Helvetica","Arial",sans-serif;
                    accent-color: var(--color-primary);
                    background: #f2f2f7;
                    color: var(--color-text);
                }
                .list { margin: 15px; }
                .list__header {
                    margin: 0 18px;
                    color: var(--color-secondary);
                    font-size: 14px;
                }
                .list__header:empty { display: none; }
                .list__body {
                    margin-top: 10px;
                    background: var(--card-bg);
                    border-radius: var(--radius-card);
                    overflow: hidden;
                }
                .list__header:empty + .list__body { margin-top: 0; }
                .form-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: ${settingItemFontSize}px;
                    min-height: 2.4em;
                    padding: 0.5em 18px;
                    position: relative;
                }
                .form-item + .form-item::before,
                .form-item + .form-item-switch::before,
                .form-item-switch + .form-item::before,
                .form-item-switch + .form-item-switch::before {
                    content: "";
                    position: absolute;
                    top: 0; left: 56px; right: 0;
                    border-top: 0.5px solid var(--color-divider);
                }
                .form-label { display: flex; align-items: center; }
                .form-label-img { width: 30px; height: 30px; border-radius: 8px; }
                .form-label-title { margin-left: 12px; }
                .form-item-right-desc {
                    font-size: 14px;
                    color: var(--color-muted);
                    margin-left: auto;
                    max-width: 180px;
                    min-width: 120px;
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 6px;
                    padding-right: 4px;
                    word-break: break-all;
                    text-align: right;
                    line-height: 1.3;
                }
                .value-text { color: var(--color-primary); font-size: 15px; font-weight: 500; text-transform: uppercase; word-break: break-all; white-space: normal; }
                .value-text--compact { color: #8e8e93; font-size: 10px; font-weight: 400; max-width: 200px; text-align: right; line-height: 1.3; text-transform: none; }
                .value-text-multiline { color: var(--color-muted); font-size: 12px; font-weight: 400; text-align: right; word-break: break-all; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }
                .icon-chevron { width: 7px; height: 12px; margin-left: 6px; flex-shrink: 0; }
                .icon-select-indicator { width: 10px; height: 14px; margin-left: 6px; flex-shrink: 0; opacity: 0.6; }
                .more-icon { width: 14px; height: 14px; }
                .form-item-right-desc .more-icon { width: 24px; height: 24px; }
                .form-item-thumb {
                    width: 32px; height: 32px; border-radius: 10px;
                    background: rgba(0,0,0,0.04);
                    display: flex; align-items: center; justify-content: center;
                    box-sizing: border-box; flex-shrink: 0; margin-right: -4px;
                }
                .form-item-thumb--set {
                    background: rgba(0,0,0,0.08);
                }
                .form-item-thumb-icon { width: 20px; height: 20px; opacity: 0.9; }
                .form-item-auth {
                    display: flex; align-items: center; justify-content: space-between;
                    min-height: 4em; padding: 0.5em 18px; position: relative;
                }
                .form-item-auth-name { margin: 0 12px; font-size: ${authorNameFontSize}px; font-weight: 430; }
                .form-item-auth-desc { margin: 0 12px; font-size: ${authorDescFontSize}px; font-weight: 400; color: var(--color-muted); }
                .form-item-auth .form-item-right-desc { flex-direction: column; align-items: flex-end; justify-content: center; max-width: 45%; text-align: right; }
                .form-item-auth .desc-line { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; line-height: 1.4; }
                .form-label-author-avatar { width: 62px; height: 62px; border-radius: 50%; border: 1px solid #F6D377; }
                .avatar-link { display: block; text-decoration: none; }
                .color-picker-wrapper { position: relative; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red); padding: 3px; box-sizing: border-box; margin-right: -4px; }
                .color-picker-wrapper input[type='color'] { width: 100%; height: 100%; border: none; border-radius: 50%; padding: 0; cursor: pointer; -webkit-appearance: none; background: transparent; }
                .color-picker-wrapper input[type='color']::-webkit-color-swatch-wrapper { padding: 0; }
                .color-picker-wrapper input[type='color']::-webkit-color-swatch { border: 2px solid var(--card-bg); border-radius: 50%; }
                .slider-picker-wrapper { position: relative; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-right: -4px; background: rgba(0,0,0,0.05); }
                .slider-picker-wrapper svg { transform: rotate(-90deg); width: 32px; height: 32px; }
                .ring-bg { fill: none; stroke: #e5e5ea; stroke-width: 3; }
                .ring-progress { fill: none; stroke: var(--color-primary); stroke-width: 3; stroke-linecap: round; transition: stroke-dashoffset 0.2s ease; }
                .slider-value-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 9px; font-weight: 600; color: var(--color-primary); }
                .slider-value-left { font-size: 14px; font-weight: 500; color: var(--color-primary); margin-right: 8px; }
                /* popup 通用 */
                .slider-popup-overlay, .select-popup-overlay, .password-popup-overlay, .text-popup-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: transparent; z-index: 1000; visibility: hidden;
                    transition: visibility 0.35s ease;
                }
                .slider-popup-overlay.active, .select-popup-overlay.active, .password-popup-overlay.active, .text-popup-overlay.active { visibility: visible; }
                .slider-popup, .select-popup, .password-popup, .text-popup {
                    position: fixed; left: 8px; right: 8px; bottom: 8px;
                    background: rgba(255,255,255,0.35);
                    -webkit-backdrop-filter: var(--popup-blur);
                    backdrop-filter: var(--popup-blur);
                    border-radius: var(--radius-popup);
                    padding: 0; box-shadow: var(--shadow);
                    opacity: 0; transform: translateY(20px);
                    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.35s ease;
                    overflow: hidden; will-change: transform, opacity;
                }
                .select-popup { max-height: 70vh; }
                .slider-popup { max-height: 50vh; }
                .slider-popup-overlay.active .slider-popup,
                .select-popup-overlay.active .select-popup,
                .password-popup-overlay.active .password-popup,
                .text-popup-overlay.active .text-popup { opacity: 1; transform: translateY(0); }
                .slider-popup-handle, .select-popup-handle, .password-popup-handle, .text-popup-handle {
                    width: 36px; height: 5px; background: rgba(0,0,0,0.15); border-radius: 3px; margin: 8px auto 0;
                }
                .slider-popup-content, .select-popup-content, .password-popup-content, .text-popup-content { padding: 16px 20px 28px; }
                .slider-popup-header, .select-popup-header, .password-popup-header, .text-popup-header {
                    display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
                }
                .slider-popup-title, .select-popup-title, .password-popup-title, .text-popup-title { font-size: 17px; font-weight: 600; }
                .slider-popup-confirm, .select-popup-confirm, .password-popup-confirm, .text-popup-confirm { font-size: 17px; font-weight: 500; color: var(--color-primary); cursor: pointer; }
                .slider-popup-desc, .select-popup-desc, .password-popup-desc, .text-popup-desc { font-size: 13px; color: #8e8e93; margin-bottom: 16px; line-height: 1.4; }
                .slider-popup-range { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #8e8e93; }
                .slider-popup-slider {
                    -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px;
                    background: linear-gradient(to right, var(--color-primary) var(--slider-progress, 0%), #e5e5ea var(--slider-progress, 0%));
                    outline: none;
                }
                .slider-popup-slider::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none; width: 28px; height: 28px; border-radius: 50%;
                    background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.2); cursor: pointer;
                }
                /* select 组件 */
                .select-picker-wrapper { display: flex; align-items: center; cursor: pointer; }
                .select-value { font-size: 14px; color: var(--color-primary); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .select-value-multi { font-size: 12px; color: var(--color-muted); max-width: 120px; text-align: right; word-break: break-all; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }
                .select-popup-list { max-height: 40vh; overflow-y: auto; -webkit-overflow-scrolling: touch; }
                .select-option { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; cursor: pointer; transition: background 0.15s ease; }
                .select-option:active { background: rgba(0,0,0,0.05); }
                .select-option.selected { color: var(--color-primary); }
                .select-option-text { font-size: 17px; }
                .select-option-check {
                    width: 22px; height: 22px; border-radius: 50%;
                    border: 2px solid #c7c7cc; display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s ease;
                }
                .select-option.selected .select-option-check { background: var(--color-primary); border-color: var(--color-primary); }
                .select-option.selected .select-option-check::after {
                    content: ''; width: 6px; height: 10px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); margin-bottom: 2px;
                }
                .select-option-content, .select-option-left { display: flex; align-items: center; flex: 1; min-width: 0; }
                .select-option-delete {
                    width: 22px; height: 22px; border-radius: 50%; background: #ff3b30;
                    display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; cursor: pointer;
                }
                .select-option-delete::before { content: ''; width: 10px; height: 2px; background: white; }
                .select-option--readonly .select-option-delete { display: none; }
                .select-add-option {
                    display: flex; align-items: flex-start; padding: 10px 16px 14px 16px; cursor: pointer; color: var(--color-primary);
                    border-top: 0.5px solid var(--color-divider); margin: 10px -20px 0 -20px; gap: 8px;
                    border-radius: 0 0 var(--radius-popup) var(--radius-popup); background: rgba(0,0,0,0.05);
                }
                .select-add-input {
                    flex: 1 1 calc(100% - 100px); max-width: calc(100% - 100px); min-width: 0;
                    background: rgba(120,120,128,0.12); border-radius: 12px; padding: 8px 8px 10px; margin-left: 12px;
                    display: flex; flex-direction: column; gap: 6px;
                }
                .select-add-input input {
                    width: calc(100% - 4px); box-sizing: border-box; padding: 6px 8px; border: none; background: rgba(0,0,0,0.03); border-radius: 10px;
                    font-size: 14px; line-height: 16px; height: 24px; color: #000; outline: none;
                }
                .select-add-input input::placeholder { color: #8e8e93; }
                .select-add-btn, .select-add-option-icon {
                    width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary);
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; position: relative;
                }
                .select-add-option-icon { width: 20px; height: 20px; margin-right: 12px; }
                .select-add-btn::before, .select-add-option-icon::before { content: ''; width: 12px; height: 2px; background: white; position: absolute; }
                .select-add-btn::after, .select-add-option-icon::after { content: ''; width: 2px; height: 12px; background: white; position: absolute; }
                .select-add-btn { margin-left: 12px; }
                .select-add-option-text { font-size: 17px; }
                /* 图片菜单弹窗 */
                .image-menu-popup-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: transparent; z-index: 1000; visibility: hidden;
                    transition: visibility 0.35s ease;
                }
                .image-menu-popup-overlay.active { visibility: visible; }
                .image-menu-popup {
                    position: fixed; left: 8px; right: 8px; bottom: 8px;
                    background: rgba(255,255,255,0.35);
                    -webkit-backdrop-filter: var(--popup-blur);
                    backdrop-filter: var(--popup-blur);
                    border-radius: var(--radius-popup);
                    padding: 0; box-shadow: var(--shadow);
                    opacity: 0; transform: translateY(20px);
                    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.35s ease;
                    overflow: hidden; will-change: transform, opacity;
                    max-height: 50vh;
                }
                .image-menu-popup-overlay.active .image-menu-popup { opacity: 1; transform: translateY(0); }
                .image-menu-popup-handle { width: 36px; height: 5px; background: rgba(0,0,0,0.15); border-radius: 3px; margin: 8px auto 0; }
                .image-menu-popup-content { padding: 0 0 28px; }
                .image-menu-popup-header {
                    display: flex; align-items: center; justify-content: space-between; padding: 8px 20px 12px;
                    border-bottom: 1px solid rgba(0,0,0,0.06);
                }
                .image-menu-popup-title { font-size: 17px; font-weight: 600; }
                .image-menu-popup-close {
                    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
                    font-size: 28px; line-height: 1; color: #8e8e93; cursor: pointer; font-weight: 300;
                }
                .image-menu-options { padding: 12px 0 0; }
                .image-menu-option {
                    padding: 14px 20px; font-size: 17px; cursor: pointer; transition: background 0.15s ease;
                    display: flex; align-items: center;
                }
                .image-menu-option:active { background: rgba(0,0,0,0.05); }
                /* select 自定义选项弹窗 */
                .select-add-popup-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.4); z-index: 1001; display: flex; align-items: center; justify-content: center;
                    visibility: hidden; opacity: 0; transition: visibility 0.25s ease, opacity 0.25s ease;
                }
                .select-add-popup-overlay.active { visibility: visible; opacity: 1; }
                .select-add-popup {
                    background: var(--card-bg); border-radius: var(--radius-popup); width: calc(100% - 48px); max-width: 320px; overflow: hidden;
                    transform: scale(0.9); transition: transform 0.25s ease;
                }
                .select-add-popup-overlay.active .select-add-popup { transform: scale(1); }
                .select-add-popup-title { font-size: 17px; font-weight: 600; text-align: center; padding: 20px 16px 8px; }
                .select-add-popup-input {
                    margin: 8px 16px 16px; padding: 10px 12px; border: none; border-radius: 8px;
                    background: rgba(0,0,0,0.05); font-size: 15px; width: calc(100% - 32px); outline: none;
                }
                .select-add-popup-btns { display: flex; border-top: 0.5px solid var(--color-divider); }
                .select-add-popup-btn { flex: 1; padding: 12px; text-align: center; font-size: 17px; cursor: pointer; }
                .select-add-popup-btn:first-child { border-right: 0.5px solid var(--color-divider); color: var(--color-primary); }
                .select-add-popup-btn:last-child { color: var(--color-primary); font-weight: 600; }
                /* password */
                .password-wrapper { display: flex; align-items: center; cursor: pointer; }
                .password-value { font-size: 15px; color: var(--color-muted); letter-spacing: 2px; margin-right: 6px; }
                .password-eye-icon { width: 18px; height: 18px; opacity: 0.5; }
                .password-input-wrapper { display: flex; align-items: center; background: rgba(0,0,0,0.05); border-radius: 12px; padding: 12px 14px; }
                .password-input { flex: 1; border: none; background: transparent; font-size: 17px; outline: none; color: inherit; }
                .password-input::placeholder { color: #c7c7cc; }
                .password-toggle-btn { width: 24px; height: 24px; background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0.5; }
                .password-toggle-btn img { width: 20px; height: 20px; }
                /* text 输入 */
                .text-input-wrapper { display: flex; align-items: center; cursor: pointer; }
                .text-input-field-wrapper { background: rgba(0,0,0,0.05); border-radius: 12px; padding: 12px 14px; }
                .text-input-field { width: 100%; border: none; background: transparent; font-size: 17px; outline: none; color: inherit; }
                .text-input-field::placeholder { color: #c7c7cc; }
                .text-input { width: 100%; border: none; background: rgba(0,0,0,0.05); border-radius: 12px; padding: 12px 14px; font-size: 17px; outline: none; color: inherit; }
                .text-input::placeholder { color: #c7c7cc; }
                /* switch 开关 */
                .form-item-switch {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: ${settingItemFontSize}px;
                    min-height: 2.4em;
                    padding: 0.5em 18px;
                    position: relative;
                }
                input[type='checkbox'][role='switch'] {
                    position: relative;
                    display: inline-block;
                    appearance: none;
                    width: 40px;
                    height: 24px;
                    border-radius: 24px;
                    background: #ccc;
                    transition: 0.3s ease-in-out;
                    cursor: pointer;
                }
                input[type='checkbox'][role='switch']::before {
                    content: '';
                    position: absolute;
                    left: 2px;
                    top: 2px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #fff;
                    transition: 0.3s ease-in-out;
                }
                input[type='checkbox'][role='switch']:checked {
                    background: var(--color-primary);
                }
                input[type='checkbox'][role='switch']:checked::before {
                    transform: translateX(16px);
                }
                /* dark mode overrides */
                @media (prefers-color-scheme: dark) {
                    :root {
                        --color-text: #fff;
                        --color-muted: #8e8e93;
                        --color-divider: rgba(84,84,88,0.65);
                        --color-secondary: rgba(235,235,245,0.6);
                        --card-bg: #1c1c1e;
                        --shadow: 0 0 0 0.5px rgba(255,255,255,0.1), 0 8px 40px rgba(0,0,0,0.3);
                    }
                    body { background: #000; color: var(--color-text); }
                    .slider-picker-wrapper { background: rgba(255,255,255,0.08); }
                    .ring-bg { stroke: #3a3a3c; }
                    .ring-progress, .slider-value-center, .slider-value-left, .select-value, .select-popup-confirm, .password-popup-confirm, .text-popup-confirm { color: var(--color-primary); }
                    .slider-popup { background: rgba(44,44,46,0.4); box-shadow: var(--shadow); }
                    .slider-popup-handle { background: rgba(255,255,255,0.2); }
                    .slider-popup-slider { background: linear-gradient(to right, var(--color-primary) var(--slider-progress, 0%), #3a3a3c var(--slider-progress, 0%)); }
                    .select-popup, .password-popup, .text-popup, .image-menu-popup { background: rgba(44,44,46,0.4); box-shadow: var(--shadow); }
                    .select-popup-handle, .password-popup-handle, .text-popup-handle, .image-menu-popup-handle { background: rgba(255,255,255,0.2); }
                    .select-option:active, .image-menu-option:active { background: rgba(255,255,255,0.1); }
                    .select-option.selected { color: var(--color-primary); }
                    .select-option-check { border-color: #48484a; }
                    .select-option.selected .select-option-check { background: var(--color-primary); border-color: var(--color-primary); }
                    .select-option-delete { background: #ff453a; }
                    .select-add-option { background: rgba(255,255,255,0.08); }
                    .select-add-input { background: rgba(255,255,255,0.1); }
                    .form-item-thumb { background: rgba(255,255,255,0.08); margin-right: -4px; }
                    .form-item-thumb--set { background: rgba(255,255,255,0.14); margin-right: -4px; }
                    .select-add-input input { color: #fff; }
                    .select-add-input input::placeholder, .text-input-field::placeholder, .text-input::placeholder, .password-input::placeholder { color: #636366; }
                    .select-add-btn, .select-add-option-icon { background: var(--color-primary); }
                    .password-input-wrapper, .text-input-field-wrapper, .text-input { background: rgba(255,255,255,0.1); }
                }
            `;
    };
    /**
     * 获取 WebView 共享的 JS 代码
     * @returns {string} JS 代码字符串
     */
    getSharedWebViewJS = () => {
      return `
                (() => {
                    window.invoke = (code, data) => {
                        window.dispatchEvent(
                            new CustomEvent('JBridge', { detail: { code, data } })
                        )
                    }
    
                    // 全局图片状态更新函数（供 Scriptable 调用）
                    window.updateImageStatus = (targetId, newHtml) => {
                        const el = document.getElementById(targetId);
                        if (el) {
                            const desc = el.querySelector('.form-item-right-desc');
                            if (desc) {
                                desc.innerHTML = newHtml;
                                return true;
                            }
                        }
                        return false;
                    }
    
                    // 通用工具
                    const bindOnce = (selector, binder, flag = 'bound') => {
                        document.querySelectorAll(selector).forEach(el => {
                            if (el.dataset[flag] === 'true') return
                            el.dataset[flag] = 'true'
                            binder(el)
                        })
                    }
    
                    window.createOverlay = (html, className) => {
                        const overlay = document.createElement('div')
                        overlay.className = className
                        overlay.innerHTML = html
                        document.body.appendChild(overlay)
                        requestAnimationFrame(() => overlay.classList.add('active'))
                        return overlay
                    }
    
                    window.closeOverlay = (overlay, delay = 350) => {
                        if (!overlay) return
                        overlay.classList.remove('active')
                        setTimeout(() => overlay.remove(), delay)
                    }
    
                    window.openOverlay = (id, html, className) => {
                        if (id && document.getElementById(id)) return null
                        const overlay = createOverlay(html, className)
                        if (id) overlay.id = id
                        return overlay
                    }
    
                    const createOverlay = window.createOverlay
                    const closeOverlay = window.closeOverlay
                    const openOverlay = window.openOverlay
    
                    // 更新进度环
                    function updateRingProgress(wrapper, value, min, max) {
                        const progress = ((value - min) / (max - min)) * 100;
                        const circumference = 2 * Math.PI * 12;
                        const offset = circumference * (1 - progress / 100);
                        const ringProgress = wrapper.querySelector('.ring-progress');
                        if (ringProgress) {
                            ringProgress.style.strokeDashoffset = offset;
                        }
                        // 更新值显示（固定左侧）
                        const unit = wrapper.dataset.unit || '';
                        const valueLeft = wrapper.parentElement.querySelector('.slider-value-left');
                        if (valueLeft) {
                            valueLeft.textContent = value + unit;
                        }
                    }
    
                    // 更新弹窗滑动条进度背景
                    function updatePopupSliderProgress(slider) {
                        const min = parseFloat(slider.min) || 0;
                        const max = parseFloat(slider.max) || 100;
                        const val = parseFloat(slider.value) || 0;
                        const progress = ((val - min) / (max - min)) * 100;
                        slider.style.setProperty('--slider-progress', progress + '%');
                    }
    
                    // 点击进度环弹出浮层
                    bindOnce('.slider-picker-wrapper', (wrapper) => {
                        wrapper.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const name = wrapper.dataset.name;
                            const min = parseFloat(wrapper.dataset.min) || 0;
                            const max = parseFloat(wrapper.dataset.max) || 1;
                            const step = parseFloat(wrapper.dataset.step) || 0.01;
                            const unit = wrapper.dataset.unit || '';
                            const title = wrapper.dataset.title || '';
                            const desc = wrapper.dataset.desc || '';
                            const currentVal = parseFloat(wrapper.dataset.value) || min;
    
                            // 创建弹窗
                            const overlay = openOverlay(null, \`
                                <div class="slider-popup">
                                    <div class="slider-popup-handle"></div>
                                    <div class="slider-popup-content">
                                        <div class="slider-popup-header">
                                            <span class="slider-popup-title">\${title}</span>
                                            <span class="slider-popup-value">\${currentVal}\${unit}</span>
                                        </div>
                                        \${desc ? '<div class="slider-popup-desc">' + desc + '</div>' : ''}
                                        <input type="range" class="slider-popup-slider" min="\${min}" max="\${max}" step="\${step}" value="\${currentVal}">
                                        <div class="slider-popup-range">
                                            <span>\${min}</span>
                                            <span>\${max}</span>
                                        </div>
                                    </div>
                            </div>\`, 'slider-popup-overlay');
    
                            const slider = overlay.querySelector('.slider-popup-slider');
                            const valueDisplay = overlay.querySelector('.slider-popup-value');
                            updatePopupSliderProgress(slider);
    
                            slider.addEventListener('input', (e) => {
                                updatePopupSliderProgress(e.target);
                                valueDisplay.textContent = e.target.value + unit;
                                // 实时更新进度环
                                wrapper.dataset.value = e.target.value;
                                updateRingProgress(wrapper, parseFloat(e.target.value), min, max);
                            });
    
                            slider.addEventListener('change', (e) => {
                                if (name) {
                                    invoke(name, e.target.value);
                                }
                            });
    
                            // 保存当前值的函数
                            const saveCurrentValue = () => {
                                const currentValue = slider.value;
                                if (name && currentValue !== undefined) {
                                    invoke(name, currentValue);
                                }
                            };
    
                            // 点击遮罩关闭
                            overlay.addEventListener('click', (e) => {
                                if (e.target === overlay) {
                                    saveCurrentValue();  // ✅ 关闭前保存
                                    closeOverlay(overlay);
                                }
                            });
    
                            // 点击拖动手柄关闭
                            const handle = overlay.querySelector('.slider-popup-handle');
                            if (handle) {
                                handle.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    saveCurrentValue();  // ✅ 关闭前保存
                                    closeOverlay(overlay);
                                });
                            }
                        });
                    });
    
                    // 点击 select 选择器弹出选择浮层
                    bindOnce('.select-picker-wrapper', (wrapper) => {
                        wrapper.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const name = wrapper.dataset.name;
                            const defaultOptions = JSON.parse(wrapper.dataset.options || '[]');
                            const multiple = wrapper.dataset.multiple === 'true';
                            const editable = wrapper.dataset.editable === 'true';
                            const title = wrapper.dataset.title || '请选择';
                            const desc = wrapper.dataset.desc || '';
    
                            // 获取自定义选项（editable 模式下）
                            let customOptions = [];
                            try {
                                customOptions = JSON.parse(wrapper.dataset.customOptions || '[]');
                            } catch (e) {
                                customOptions = [];
                            }
    
                            // 合并选项：默认选项 + 自定义选项
                            const options = [
                                ...defaultOptions,
                                ...customOptions.map(v => {
                                    if (typeof v === 'object' && v !== null) {
                                        const {label = v.value, value = v.label} = v
                                        return {label, value, custom: true}
                                    }
                                    return { value: v, label: v, custom: true }
                                }),
                            ];
    
                            // 从 data-selected 属性获取当前选中值
                            const valueEl = wrapper.querySelector('.value-text, .select-value, .select-value-multi');
                            let selectedValues = [];
                            try {
                                selectedValues = JSON.parse(wrapper.dataset.selected || '[]');
                            } catch (e) {
                                selectedValues = [];
                            }
    
                            // 构建选项列表 HTML
                            function buildOptionsHtml(opts) {
                                let html = '';
                                opts.forEach((opt, idx) => {
                                    const value = typeof opt === 'object' ? opt.value : opt;
                                    const label = typeof opt === 'object' ? opt.label : opt;
                                    const isCustom = typeof opt === 'object' && opt.custom;
                                    const isSelected = selectedValues.includes(value);
                                    html += '<div class="select-option ' + (isSelected ? 'selected' : '') + (isCustom ? ' custom' : '') + '" data-value="' + value + '" data-index="' + idx + '"' + (isCustom ? ' data-custom="true"' : '') + '>' +
                                        '<div class="select-option-left">' +
                                            (editable && isCustom ? '<div class="select-option-delete" data-value="' + value + '"></div>' : '') +
                                            '<span class="select-option-text">' + label + '</span>' +
                                        '</div>' +
                                        '<div class="select-option-check"></div>' +
                                    '</div>';
                                });
                                return html;
                            }
    
                            let optionsHtml = buildOptionsHtml(options);
    
                            // 添加选项输入区（editable 模式下）
                            const addOptionHtml = editable ?
                                '<div class="select-add-option">' +
                                    '<div class="select-add-input">' +
                                        '<input type="text" class="select-add-input-label" placeholder="显示文本" />' +
                                        '<input type="text" class="select-add-input-value" placeholder="实际值" />' +
                                    '</div>' +
                                    '<div class="select-add-btn"></div>' +
                                '</div>' : '';
    
                            // 创建弹窗
                            const overlay = openOverlay(null, '<div class="select-popup">' +
                                '<div class="select-popup-handle"></div>' +
                                '<div class="select-popup-content">' +
                                    '<div class="select-popup-header">' +
                                        '<span class="select-popup-title">' + title + '</span>' +
                                        (multiple ? '<span class="select-popup-confirm">完成</span>' : '') +
                                    '</div>' +
                                    (desc ? '<div class="select-popup-desc">' + desc + '</div>' : '') +
                                    '<div class="select-popup-list">' +
                                        optionsHtml +
                                    '</div>' +
                                    addOptionHtml +
                                '</div>' +
                            '</div>', 'select-popup-overlay');
    
                            // 关闭弹窗函数
                            // 更新显示和发送数据
                            function updateAndSave() {
                                const selected = Array.from(overlay.querySelectorAll('.select-option.selected'));
                                const values = selected.map(el => el.dataset.value);
                                const labels = selected.map(el => el.querySelector('.select-option-text').textContent);
    
                                // 更新 data-selected 属性
                                wrapper.dataset.selected = JSON.stringify(values);
    
                                // 获取缺省值和截断长度
                                const defaultShowContent = wrapper.dataset.default || '请选择';
                                // truncateLength: 空或未设置使用默认值 ${DEFAULT_TRUNCATE_LENGTH2}，'0' 表示不截断
                                const truncateLengthStr = wrapper.dataset.truncate;
                                const truncateLength = truncateLengthStr === '' || truncateLengthStr === undefined
                                    ? ${DEFAULT_TRUNCATE_LENGTH2}
                                    : parseInt(truncateLengthStr);
    
                                // 更新显示
                                if (valueEl) {
                                    let displayText = defaultShowContent;
                                    if (labels.length > 0) {
                                        // 智能截断：如果 truncateLength > 0，保留完整项并显示"等N项"
                                        if (truncateLength > 0) {
                                            let currentLength = 0;
                                            let keepCount = 0;
                                            for (let i = 0; i < labels.length; i++) {
                                                const labelLen = labels[i].length;
                                                if (i === 0) {
                                                    currentLength = labelLen;
                                                    keepCount = 1;
                                                } else if (currentLength + 2 + labelLen <= truncateLength) {
                                                    currentLength += 2 + labelLen;
                                                    keepCount++;
                                                } else {
                                                    break;
                                                }
                                            }
                                            if (keepCount < labels.length) {
                                                displayText = labels.slice(0, keepCount).join(', ') + ' 等' + labels.length + '项';
                                            } else {
                                                displayText = labels.join(', ');
                                            }
                                        } else if (multiple && labels.length > 2) {
                                            // 多选且超过2项时，显示前两项 + 等N项（默认行为）
                                            displayText = labels.slice(0, 2).join(', ') + ' 等' + labels.length + '项';
                                        } else {
                                            displayText = labels.join(', ');
                                        }
                                    }
                                    valueEl.textContent = displayText;
                                }
    
                                // 发送数据：单选发送字符串，多选发送数组
                                if (name) {
                                    if (multiple) {
                                        invoke(name, JSON.stringify(values));
                                    } else {
                                        invoke(name, values[0] || '');
                                    }
                                }
                            }
    
                            // 保存自定义选项
                            function saveCustomOptions() {
                                if (editable && name) {
                                    wrapper.dataset.customOptions = JSON.stringify(customOptions);
                                    invoke(name + '_customOptions', JSON.stringify(customOptions));
                                }
                            }
    
                            // 绑定选项点击事件
                            function bindOptionEvents() {
                                    overlay.querySelectorAll('.select-option').forEach(optEl => {
                                    // 防止重复绑定
                                    if (optEl.dataset.bound === 'true') return;
                                    optEl.dataset.bound = 'true';
    
                                    optEl.addEventListener('click', (evt) => {
                                        // 如果点击的是删除按钮，不处理选中
                                        if (evt.target.classList.contains('select-option-delete')) return;
    
                                        if (multiple) {
                                            // 多选模式：切换选中状态
                                            optEl.classList.toggle('selected');
                                        } else {
                                            // 单选模式：选中并关闭
                                            overlay.querySelectorAll('.select-option').forEach(el => el.classList.remove('selected'));
                                            optEl.classList.add('selected');
                                            updateAndSave();
                                            closeOverlay(overlay);
                                        }
                                    });
                                });
    
                                // 绑定删除按钮事件（editable 模式）
                                if (editable) {
                                    overlay.querySelectorAll('.select-option-delete').forEach(delBtn => {
                                        if (delBtn.dataset.bound === 'true') return;
                                        delBtn.dataset.bound = 'true';
    
                                        delBtn.addEventListener('click', (evt) => {
                                            evt.stopPropagation();
                                            const value = delBtn.dataset.value;
                                            // 从自定义选项中移除
                                            customOptions = customOptions.filter(v => (typeof v === 'object' ? v.value : v) !== value);
                                            // 从选中值中移除
                                            selectedValues = selectedValues.filter(v => v !== value);
                                            wrapper.dataset.selected = JSON.stringify(selectedValues);
                                            // 移除 DOM 元素
                                            const optEl = delBtn.closest('.select-option');
                                            if (optEl) optEl.remove();
                                            // 保存自定义选项
                                            saveCustomOptions();
                                            // 更新显示
                                            updateAndSave();
                                        });
                                    });
                                }
                            }
    
                            bindOptionEvents();
    
                            // 添加选项功能（editable 模式）
                            if (editable) {
                                const addInputLabel = overlay.querySelector('.select-add-input-label');
                                const addInputValue = overlay.querySelector('.select-add-input-value');
                                const addBtn = overlay.querySelector('.select-add-btn');
    
                                function addNewOption() {
                                    const newLabel = addInputLabel.value.trim();
                                    const newValue = addInputValue.value.trim();
                                    if (!newLabel || !newValue) return;
    
                                    // 检查是否已存在（按 value 去重）
                                    const allValues = [
                                        ...defaultOptions.map(o => (typeof o === 'object' ? o.value : o)),
                                        ...customOptions.map(o => (typeof o === 'object' ? o.value : o)),
                                    ];
                                    if (allValues.includes(newValue)) {
                                        addInputLabel.value = '';
                                        addInputValue.value = '';
                                        return;
                                    }
    
                                    // 添加到自定义选项
                                    customOptions.push({label: newLabel, value: newValue});
    
                                    // 添加到列表 DOM
                                    const listEl = overlay.querySelector('.select-popup-list');
                                    const newOptHtml = '<div class="select-option custom" data-value="' + newValue + '" data-custom="true">' +
                                        '<div class="select-option-left">' +
                                            '<div class="select-option-delete" data-value="' + newValue + '"></div>' +
                                            '<span class="select-option-text">' + newLabel + '</span>' +
                                        '</div>' +
                                        '<div class="select-option-check"></div>' +
                                    '</div>';
                                    listEl.insertAdjacentHTML('beforeend', newOptHtml);
    
                                    // 重新绑定事件
                                    bindOptionEvents();
    
                                    // 清空输入框
                                    addInputLabel.value = '';
                                    addInputValue.value = '';
    
                                    // 保存自定义选项
                                    saveCustomOptions();
                                }
    
                                if (addBtn) {
                                    addBtn.addEventListener('click', (evt) => {
                                        evt.stopPropagation();
                                        addNewOption();
                                    });
                                }
    
                                [addInputLabel, addInputValue].forEach(inp => {
                                    if (!inp) return;
                                    inp.addEventListener('keypress', (evt) => {
                                        if (evt.key === 'Enter') {
                                            evt.preventDefault();
                                            addNewOption();
                                        }
                                    });
                                    inp.addEventListener('click', (evt) => {
                                        evt.stopPropagation();
                                    });
                                });
                            }
    
                            // 多选模式下的完成按钮
                            const confirmBtn = overlay.querySelector('.select-popup-confirm');
                            if (confirmBtn) {
                                confirmBtn.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    updateAndSave();
                                    closeOverlay(overlay);
                                });
                            }
    
                            // 点击遮罩关闭
                            overlay.addEventListener('click', (e) => {
                                if (e.target === overlay) {
                                    if (multiple) {
                                        updateAndSave();
                                    }
                                    closeOverlay(overlay);
                                }
                            });
    
                            // 点击拖动手柄关闭
                            const handle = overlay.querySelector('.select-popup-handle');
                            if (handle) {
                                handle.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    if (multiple) {
                                        updateAndSave();
                                    }
                                    closeOverlay(overlay);
                                });
                            }
                        });
                    });
    
                    // 点击 password 密码输入弹出输入浮层
                    bindOnce('.password-wrapper', (wrapper) => {
                        wrapper.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const name = wrapper.dataset.name;
                            const title = wrapper.dataset.title || '输入密码';
                            const desc = wrapper.dataset.desc || '';
                            const placeholder = wrapper.dataset.placeholder || '请输入...';
                            const currentVal = wrapper.dataset.value || '';
                            const eyeOpenIcon = wrapper.dataset.eyeOpen || '';
                            const eyeCloseIcon = wrapper.dataset.eyeClose || '';
    
                            // 创建弹窗
                            const overlay = openOverlay(null, '<div class="password-popup">' +
                                '<div class="password-popup-handle"></div>' +
                                '<div class="password-popup-content">' +
                                    '<div class="password-popup-header">' +
                                        '<span class="password-popup-title">' + title + '</span>' +
                                        '<span class="password-popup-confirm">完成</span>' +
                                    '</div>' +
                                    (desc ? '<div class="password-popup-desc">' + desc + '</div>' : '') +
                                    '<div class="password-input-wrapper">' +
                                        '<input type="password" class="password-input" placeholder="' + placeholder + '" value="' + currentVal + '">' +
                                        '<button type="button" class="password-toggle-btn" data-visible="false">' +
                                            '<img src="' + eyeCloseIcon + '">' +
                                        '</button>' +
                                    '</div>' +
                                '</div>' +
                            '</div>', 'password-popup-overlay');
    
                            requestAnimationFrame(() => {
                                overlay.classList.add('active');
                                // 自动聚焦输入框
                                const input = overlay.querySelector('.password-input');
                                if (input) {
                                    setTimeout(() => input.focus(), 350);
                                }
                            });
    
                            const input = overlay.querySelector('.password-input');
                            const toggleBtn = overlay.querySelector('.password-toggle-btn');
                            const toggleImg = toggleBtn.querySelector('img');
                            const valueEl = wrapper.querySelector('.password-value');
    
                            // 切换显示/隐藏密码
                            toggleBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const isVisible = toggleBtn.dataset.visible === 'true';
                                if (isVisible) {
                                    input.type = 'password';
                                    toggleBtn.dataset.visible = 'false';
                                    toggleImg.src = eyeCloseIcon;
                                } else {
                                    input.type = 'text';
                                    toggleBtn.dataset.visible = 'true';
                                    toggleImg.src = eyeOpenIcon;
                                }
                            });
    
                            // 保存并更新显示
                            function saveAndUpdate() {
                                const newVal = input.value;
                                wrapper.dataset.value = newVal;
                                // 更新显示（星号）
                                if (valueEl) {
                                    valueEl.textContent = newVal ? '••••••••' : '';
                                }
                                // 发送数据
                                if (name) {
                                    invoke(name, newVal);
                                }
                            }
    
                            // 完成按钮
                            const confirmBtn = overlay.querySelector('.password-popup-confirm');
                            if (confirmBtn) {
                                confirmBtn.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    saveAndUpdate();
                                    closeOverlay(overlay);
                                });
                            }
    
                            // 回车键保存
                            input.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    saveAndUpdate();
                                    closePasswordPopup();
                                }
                            });
    
                            // 点击遮罩关闭
                            overlay.addEventListener('click', (e) => {
                                if (e.target === overlay) {
                                    saveAndUpdate();
                                    closePasswordPopup();
                                }
                            });
    
                            // 点击拖动手柄关闭
                            const handle = overlay.querySelector('.password-popup-handle');
                            if (handle) {
                                handle.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    saveAndUpdate();
                                    closeOverlay(overlay);
                                });
                            }
                        });
                    });
    
                    // 点击 text 文本输入弹出输入浮层
                    bindOnce('.text-input-wrapper', (wrapper) => {
                        wrapper.addEventListener('click', (e) => {
                            e.stopPropagation();
                            // 如果有 customId，优先调用 onAction
                            const customId = wrapper.dataset.customId;
                            if (customId) {
                                invoke(customId);
                                return;
                            }
                            const name = wrapper.dataset.name;
                            const title = wrapper.dataset.title || '输入';
                            const desc = wrapper.dataset.desc || '';
                            const placeholder = wrapper.dataset.placeholder || '请输入...';
                            const currentVal = wrapper.dataset.value || '';
                            const truncateLength = wrapper.dataset.truncate ? parseInt(wrapper.dataset.truncate) : 0;
    
                            // 创建弹窗
                            const overlay = openOverlay(null, '<div class="text-popup">' +
                                '<div class="text-popup-handle"></div>' +
                                '<div class="text-popup-content">' +
                                    '<div class="text-popup-header">' +
                                        '<span class="text-popup-title">' + title + '</span>' +
                                        '<span class="text-popup-confirm">完成</span>' +
                                    '</div>' +
                                    (desc ? '<div class="text-popup-desc">' + desc + '</div>' : '') +
                                    '<div class="text-input-field-wrapper">' +
                                        '<input type="text" class="text-input-field" placeholder="' + placeholder + '" value="' + currentVal + '">' +
                                    '</div>' +
                                '</div>' +
                            '</div>', 'text-popup-overlay');
    
                            requestAnimationFrame(() => {
                                overlay.classList.add('active');
                                // 自动聚焦输入框
                                const input = overlay.querySelector('.text-input-field');
                                if (input) {
                                    setTimeout(() => input.focus(), 350);
                                }
                            });
    
                            const input = overlay.querySelector('.text-input-field');
                            const valueEl = wrapper.querySelector('.value-text');
    
                            // 关闭弹窗函数
                            // 保存并更新显示
                            function saveAndUpdate() {
                                const newVal = input.value;
                                wrapper.dataset.value = newVal;
                                // 更新显示（支持截断）
                                if (valueEl) {
                                    let displayVal = newVal;
                                    if (truncateLength > 0 && displayVal.length > truncateLength) {
                                        displayVal = displayVal.substring(0, truncateLength) + '...';
                                    }
                                    valueEl.textContent = displayVal;
                                }
                                // 发送数据
                                if (name) {
                                    invoke(name, newVal);
                                }
                            }
    
                            // 完成按钮
                            const confirmBtn = overlay.querySelector('.text-popup-confirm');
                            if (confirmBtn) {
                                confirmBtn.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    saveAndUpdate();
                                    closeOverlay(overlay);
                                });
                            }
    
                            // 回车键保存
                            input.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    saveAndUpdate();
                                    closeOverlay(overlay);
                                }
                            });
    
                            // 点击遮罩关闭
                            overlay.addEventListener('click', (e) => {
                                if (e.target === overlay) {
                                    saveAndUpdate();
                                    closeOverlay(overlay);
                                }
                            });
    
                            // 点击拖动手柄关闭
                            const handle = overlay.querySelector('.text-popup-handle');
                            if (handle) {
                                handle.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    saveAndUpdate();
                                    closeOverlay(overlay);
                                });
                            }
                        });
                    });
    
                    // 点击 switch 开关切换状态
                    for (const switchInput of document.querySelectorAll('input[type="checkbox"][role="switch"]')) {
                        switchInput.addEventListener('change', (e) => {
                            e.stopPropagation();
                            if (!e.target.name) return;
                            const newVal = e.target.checked;
                            invoke(e.target.name, newVal);
                        });
                    }
    
                    for (const btn of document.querySelectorAll('.form-item')) {
                        btn.addEventListener('click', (e) => {
                            const selectWrapper = e.currentTarget.querySelector('.select-picker-wrapper');
                            if (selectWrapper) {
                                if (e.target.closest('.select-picker-wrapper')) return;
                                e.stopPropagation();
                                selectWrapper.click();
                                return;
                            }
                            if (e.target.closest('.color-picker-wrapper')) return;
                            if (e.target.closest('.slider-picker-wrapper')) return;
                            if (e.target.closest('.password-wrapper')) return;
                            if (e.target.closest('.text-input-wrapper')) return;
                            if (e.target.closest('input[type="checkbox"][role="switch"]')) return;
                            const id = e.currentTarget.id;
                            if (!id) return;
                            invoke(id);
                        })
                    }
    
                    for (const input of document.querySelectorAll('.form-item__input')) {
                        // 跳过 switch 类型的 input，switch 有专门的事件处理
                        if (input.getAttribute('role') === 'switch') continue;
                        input.addEventListener('change', (e) => {
                            if (!e.target.name) return;
                            invoke(e.target.name, e.target.value);
                        })
                    }
    
                    // 自动检测并绑定头像区域点击事件
                    const authEl = document.querySelector('.form-item-auth');
                    const avatarLink = document.getElementById('avatarLink');
                    if (authEl) {
                        authEl.addEventListener('click', (e) => {
                            if (avatarLink && avatarLink.contains(e.target)) {
                                e.preventDefault();
                                e.stopPropagation();
                                const url = avatarLink.getAttribute('href');
                                if (url) {
                                    invoke('openUrl', url);
                                }
                                return;
                            }
                            invoke('userInfo');
                        })
                    }
    
                    // 提供刷新头像区域的全局函数
                    window.refreshAvatarArea = function(avatarData) {
                        const avatarImg = document.querySelector('.form-label-author-avatar');
                        const avatarLinkEl = document.getElementById('avatarLink');
    
                        // 使用 avatarData 的键来动态获取元素和更新值
                        if (avatarImg && avatarData.avatar) {
                            avatarImg.src = avatarData.avatar;
                        }
    
                        // 遍历 avatarData 中的所有键（除了 avatar）
                        for (const key in avatarData) {
                            if (key === 'avatar') continue;
    
                            const el = document.getElementById(key);
                            if (el && avatarData[key] !== undefined) {
                                // 如果是链接元素，更新 href
                                if (key.includes('Url') || key.includes('url')) {
                                    if (avatarLinkEl) {
                                        avatarLinkEl.setAttribute('href', avatarData[key]);
                                    }
                                } else {
                                    // 否则更新文本内容
                                    el.textContent = avatarData[key];
                                }
                            }
                        }
                    }
    
                    // 子页关闭前，主动回传头像数据，避免父页引用失效
                    (() => {
                        let requested = false;
                        const syncAvatar = async () => {
                            if (requested) return;
                            requested = true;
                            try {
                                const avatarData = await invoke('refresh-avatar-on-resume');
                                if (avatarData && window.refreshAvatarArea) {
                                    window.refreshAvatarArea(avatarData);
                                }
                            } catch (e) {}
                        };
                        document.addEventListener('visibilitychange', () => {
                            if (document.visibilityState === 'hidden') {
                                syncAvatar();
                            }
                        });
                        window.addEventListener('pagehide', syncAvatar);
                    })();
    
                })()
            `;
    };
    /**
     * 生成 Slider 类型的 HTML（紧凑进度环样式，点击弹出滑动条）
     * @param {Object} options 配置选项
     * @returns {string} HTML 字符串
     */
    generateSliderHtml = (options = {}) => {
      const {
        idName,
        iconBase64,
        title,
        desc = "",
        min = 0,
        max = 1,
        step = 0.01,
        unit = "",
        currentVal,
      } = options;
      const circumference = 2 * Math.PI * 12;
      const progressPercent = ((currentVal - min) / (max - min)) * 100;
      const initialOffset = circumference * (1 - progressPercent / 100);
      return `
                <label id="${idName}" class="form-item">
                    <div class="form-label">
                        <img class="form-label-img" src="${iconBase64}"/>
                        <div class="form-label-title">${title}</div>
                    </div>
                    <div class="form-item-right-desc">
                        <span class="slider-value-left">${currentVal}${unit}</span>
                        <div class="slider-picker-wrapper"
                             data-name="${idName}"
                             data-min="${min}"
                             data-max="${max}"
                             data-step="${step}"
                             data-unit="${unit}"
                             data-value="${currentVal}"
                             data-title="${title}"
                             data-desc="${desc}">
                            <svg viewBox="0 0 32 32">
                                <circle class="ring-bg" cx="16" cy="16" r="12"/>
                                <circle class="ring-progress" cx="16" cy="16" r="12"
                                    stroke-dasharray="${circumference}"
                                    stroke-dashoffset="${initialOffset}"/>
                            </svg>
                        </div>
                    </div>
                </label>
            `;
    };
    /**
     * 更新 WebView 元素内容
     */
    insertTextByElementId = async (webView, elementId, text) => {
      const scripts = `
                var el = document.getElementById("${elementId}");
                if (el) {
                    var desc = el.querySelector('.form-item-right-desc');
                    if (desc) {
                        var span = desc.querySelector('span') || desc.querySelector('.value-text') || desc.querySelector('.value-text-multiline');
                        if (span) span.innerText = "${text}";
                    }
                }
            `;
      await webView.evaluateJavaScript(scripts, false);
    };
    drawTableIcon = async (
      icon = "square.grid.2x2",
      color = "#e8e8e8",
      cornerWidth = 42,
      iconSize = 160,
    ) => {
      const sfi = SFSymbol.named(icon);
      sfi.applyFont(Font.mediumSystemFont(iconSize));
      const imgData = Data.fromPNG(sfi.image).toBase64String();
      const html = `
                <img id="sourceImg" src="data:image/png;base64,${imgData}" />
                <img id="silhouetteImg" src="" />
                <canvas id="mainCanvas" />
            `;
      const js = `
                var canvas = document.createElement("canvas");
                var sourceImg = document.getElementById("sourceImg");
                var silhouetteImg = document.getElementById("silhouetteImg");
                var ctx = canvas.getContext('2d');
                var size = sourceImg.width > sourceImg.height ? sourceImg.width : sourceImg.height;
                canvas.width = size;
                canvas.height = size;
                ctx.drawImage(sourceImg, (canvas.width - sourceImg.width) / 2, (canvas.height - sourceImg.height) / 2);
                var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                var pix = imgData.data;
                //convert the image into a silhouette
                for (var i=0, n = pix.length; i < n; i+= 4){
                    //set red to 0
                    pix[i] = 255;
                    //set green to 0
                    pix[i+1] = 255;
                    //set blue to 0
                    pix[i+2] = 255;
                    //retain the alpha value
                    pix[i+3] = pix[i+3];
                }
                ctx.putImageData(imgData,0,0);
                silhouetteImg.src = canvas.toDataURL();
                output=canvas.toDataURL()
            `;
      const wv = new WebView();
      await wv.loadHTML(html);
      const base64Image = await wv.evaluateJavaScript(js);
      const iconImage = await new Request(base64Image).loadImage();
      const size = new Size(iconSize, iconSize);
      const ctx = new DrawContext();
      ctx.opaque = false;
      ctx.respectScreenScale = true;
      ctx.size = size;
      const path = new Path();
      const rect = new Rect(0, 0, size.width, size.width);
      path.addRoundedRect(rect, cornerWidth, cornerWidth);
      path.closeSubpath();
      ctx.setFillColor(new Color(color));
      ctx.addPath(path);
      ctx.fillPath();
      const rate = iconSize * 0.225;
      const iw = size.width - rate;
      const x = (size.width - iw) / 2;
      ctx.drawImageInRect(iconImage, new Rect(x, x, iw, iw));
      return ctx.getImage();
    };
    /**
     * 绘制颜色图标（同心圆效果：内部是实际颜色，外部是彩虹渐变环）
     * @param colorValue 颜色值，支持逗号分隔的多个颜色
     * @returns {Promise<Image>}
     */
    drawColorIcon = async (colorValue) => {
      const size = new Size(60, 60);
      const ctx = new DrawContext();
      ctx.opaque = false;
      ctx.respectScreenScale = true;
      ctx.size = size;
      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const outerRadius = 28;
      const innerRadius = 18;
      const segments = 360;
      for (let i = 0; i < segments; i++) {
        const startAngle = (i * Math.PI * 2) / segments - Math.PI / 2;
        const endAngle = ((i + 1.5) * Math.PI * 2) / segments - Math.PI / 2;
        const hue = i;
        const color = Color.dynamic(
          new Color(this.hslToHex(hue, 100, 50)),
          new Color(this.hslToHex(hue, 100, 50)),
        );
        ctx.setFillColor(color);
        const path = new Path();
        const outerStartX = centerX + outerRadius * Math.cos(startAngle);
        const outerStartY = centerY + outerRadius * Math.sin(startAngle);
        const outerEndX = centerX + outerRadius * Math.cos(endAngle);
        const outerEndY = centerY + outerRadius * Math.sin(endAngle);
        const innerStartX = centerX + innerRadius * Math.cos(startAngle);
        const innerStartY = centerY + innerRadius * Math.sin(startAngle);
        const innerEndX = centerX + innerRadius * Math.cos(endAngle);
        const innerEndY = centerY + innerRadius * Math.sin(endAngle);
        path.move(new Point(outerStartX, outerStartY));
        path.addLine(new Point(outerEndX, outerEndY));
        path.addLine(new Point(innerEndX, innerEndY));
        path.addLine(new Point(innerStartX, innerStartY));
        path.closeSubpath();
        ctx.addPath(path);
        ctx.fillPath();
      }
      const colors = colorValue.split(",").map((c) => c.trim());
      const mainColor = colors[0] || "#ffffff";
      const innerCirclePath = new Path();
      innerCirclePath.addEllipse(
        new Rect(
          centerX - innerRadius + 2,
          centerY - innerRadius + 2,
          (innerRadius - 2) * 2,
          (innerRadius - 2) * 2,
        ),
      );
      try {
        ctx.setFillColor(new Color(mainColor));
      } catch (e) {
        ctx.setFillColor(new Color("#ffffff"));
      }
      ctx.addPath(innerCirclePath);
      ctx.fillPath();
      return ctx.getImage();
    };
    /**
     * WebView 渲染额外设置页面
     *
     * @param {Object|Array<string>} extraSettings 额外设置配置：
     *   - Object: 直接传入设置对象
     *   - Array<string>: 传入分类名称数组，如 ['basicSettings', 'displaySettings']，内部自动从 _settings 提取
     *   - 默认: this._settings（显示所有）
     * @param {boolean} isRenderResetHeader 是否渲染重置设置头部
     * @param {function} customHeadHtmlRender 自定义头部 HTML 渲染函数，返回 HTML 字符串
     * @param {function} customFootHtmlRender 自定义底部 HTML 渲染函数，返回 HTML 字符串
     * @param {function} customActionHandler 可选：自定义点击行为，签名 (code, data, previewWebView) => true | 'refresh' | false
     *
     * code 规则（脚本层可能用到的）：
     * - 普通项：category__key
     * - 自定义动作(custom/customAction/customPreview)：customId 或 category-key-xxx
     * 其余内部细节由 Env 处理。
     */
    async presentSettings(
      extraSettings = this._settings,
      isRenderResetHeader = true,
      customHeadHtmlRender = null,
      customFootHtmlRender = null,
      customActionHandler = null,
    ) {
      if (Array.isArray(extraSettings)) {
        const categories = extraSettings;
        extraSettings = {};
        for (const category of categories) {
          if (this._settings[category]) {
            extraSettings[category] = this._settings[category];
          }
        }
      }
      const baseStyle = this.getSharedWebViewStyles();
      const extraStyle = `
                .form-item--reset {
                    flex-direction: column;
                    align-items: flex-start;
                }
                .form-item--reset .form-item-title {
                    font-size: 16px;
                    margin-bottom: 4px;
                }
                .form-item--reset .form-item-subtitle {
                    font-size: 12px;
                    color: #999999;
                }
                .form-item--link .form-item-right-desc {
                    color: #86868b;
                }
                .form-item + .form-item::before,
                .list__header + .list__body .form-item:first-child::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 18px;
                    right: 0;
                    border-top: 0.5px solid var(--divider-color);
                }
                .form-item-right-desc .value-text--emphasis {
                    color: #007aff;
                    font-size: 15px;
                    font-weight: 500;
                    text-transform: uppercase;
                }
            `;
      const style = baseStyle + extraStyle;
      const js = this.getSharedWebViewJS();
      const chevronIcon = await this.loadSF2B64(
        "chevron.right",
        "#c7c7cc",
        true,
        14,
      );
      const selectIndicatorIcon = await this.loadSF2B64(
        "chevron.up.chevron.down",
        "#8e8e93",
        true,
        12,
      );
      let configList = "";
      const actionsConfig = [];
      if (isRenderResetHeader) {
        configList += `
                    <div class="list">
                        <div class="list__header">重置设置</div>
                        <form class="list__body" action="javascript:void(0);">
                            <label id="__reset__" class="form-item form-item--reset">
                                <div class="form-item-title">重置设置参数</div>
                                <div class="form-item-subtitle">设置参数绑定脚本文件名，请勿随意更改脚本文件名</div>
                            </label>
                        </form>
                    </div>
                `;
        actionsConfig.push({
          id: "__reset__",
          type: "reset",
        });
      }
      for (const categoryKey of Object.keys(extraSettings)) {
        const category = extraSettings[categoryKey];
        if (!category.items || category.items.length === 0) continue;
        configList += `
                    <div class="list">
                        <div class="list__header">${category.title || ""}</div>
                        <form class="list__body" action="javascript:void(0);">
                `;
        for (const item of category.items) {
          if (
            [
              "image",
              "customPreview",
              "customAction",
              "removeBackground",
              "custom",
            ].includes(item.type)
          ) {
            let iconBase64 = "";
            if (item.url) {
              iconBase64 = item.url;
            } else if (typeof item.icon === "string") {
              iconBase64 = item.icon;
            } else {
              const icon = item.icon || { name: "gear", color: "#999999" };
              iconBase64 = await this.loadSF2B64(
                icon.name || "gear",
                icon.color || "#999999",
                icon.pure ? true : void 0,
                icon.fontSize || 20,
              );
            }
            const config3 = item.config || {};
            const customId = item.customId
              ? item.customId
              : item.type === "customPreview"
                ? `${categoryKey}-${item.type}-${config3.size || "unknown"}`
                : item.type === "customAction"
                  ? `${categoryKey}-${item.type}-${config3.actionName || "unknown"}`
                  : item.type === "custom"
                    ? item.id || `${categoryKey}-${item.type}-${Date.now()}`
                    : item.type === "image"
                      ? `${categoryKey}-${item.type}-${Object.keys(item.option)[0] || "default"}`
                      : `${categoryKey}-${item.type}`;
            const actionConfig = {
              id: customId,
              categoryKey,
              key: item.type,
              type: item.type,
              title: item.title,
              desc: item.desc,
              option: item.option,
              config: config3,
            };
            if (item.type === "image") {
              actionConfig.optionKey = Object.keys(item.option)[0] || "unknown";
              actionConfig.isGlobalSetting =
                actionConfig.optionKey === "avatar";
              actionConfig.imageSource = config3.imageSource || "album";
              actionConfig.showThumbnail = config3.showThumbnail !== false;
              actionConfig.clearable = config3.clearable !== false;
              actionConfig.urlPlaceholder =
                config3.placeholder || "🔗请输入图片URL";
              actionConfig.notifyOnSet = config3.notifyOnSet !== false;
              actionConfig.iconColor =
                (item.icon && item.icon.color) || "#56A8D6";
              actionConfig.setIcon =
                config3.setIcon || "photo.fill.on.rectangle.fill";
              actionConfig.emptyIcon =
                config3.emptyIcon || "photo.on.rectangle";
            }
            actionsConfig.push(actionConfig);
            const actionValue =
              item.type === "customAction" && config3.actionValue
                ? config3.actionValue
                : null;
            let rightDescContent = "";
            if (item.type === "image") {
              const optionKey = Object.keys(item.option)[0];
              const optionValue = item.option[optionKey] || "";
              const showThumbnail = config3.showThumbnail !== false;
              let imgFile = null;
              let hasImage = false;
              const isDisabled =
                (optionKey === this.BACKGROUND_TRANSPARENT_KEY &&
                  (this.settings[this.BACKGROUND_DAY_KEY] ||
                    this.settings[this.BACKGROUND_NIGHT_KEY])) ||
                ((optionKey === this.BACKGROUND_DAY_KEY ||
                  optionKey === this.BACKGROUND_NIGHT_KEY) &&
                  this.settings[this.BACKGROUND_TRANSPARENT_KEY]);
              if (optionValue) {
                const isGlobalSetting = optionKey === "avatar";
                const storage = isGlobalSetting
                  ? this.globalStorage
                  : this.storage;
                imgFile = await this.getImageByUrl(
                  optionValue,
                  storage,
                  optionKey,
                );
                hasImage = !!imgFile;
              }
              const iconColor = (item.icon && item.icon.color) || "#56A8D6";
              const setIconName =
                config3.setIcon || "photo.fill.on.rectangle.fill";
              const emptyIconName = config3.emptyIcon || "photo.on.rectangle";
              if (isDisabled) {
                const lockIcon = await this.loadSF2B64(
                  "lock.fill",
                  "#8e8e93",
                  true,
                  20,
                );
                rightDescContent = `<div class="form-item-thumb form-item-thumb--disabled"><img class="form-item-thumb-icon" src="${lockIcon}"/></div>`;
              } else if (showThumbnail && hasImage && imgFile) {
                const imgData = Data.fromPNG(imgFile).toBase64String();
                rightDescContent = `<div class="form-item-thumb form-item-thumb--set"><img class="form-item-thumb-icon" src="data:image/png;base64,${imgData}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;"/></div>`;
              } else if (hasImage) {
                const photoIcon = await this.loadSF2B64(
                  setIconName,
                  iconColor,
                  true,
                  20,
                );
                rightDescContent = `<div class="form-item-thumb form-item-thumb--set"><img class="form-item-thumb-icon" src="${photoIcon}"/></div>`;
              } else {
                const emptyIcon = await this.loadSF2B64(
                  emptyIconName,
                  "#8e8e93",
                  true,
                  20,
                );
                rightDescContent = `<div class="form-item-thumb"><img class="form-item-thumb-icon" src="${emptyIcon}"/></div>`;
              }
            } else {
              rightDescContent = actionValue
                ? `<span class="value-text">${actionValue}</span>`
                : `<img class="more-icon" src="https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/more.png"/>`;
            }
            configList += `
                            <label id="${customId}" class="form-item form-item--link">
                                <div class="form-label">
                                    <img class="form-label-img" src="${iconBase64}"/>
                                    <div class="form-label-title">${item.title}</div>
                                </div>
                                <div class="form-item-right-desc">
                                    ${rightDescContent}
                                </div>
                            </label>
                        `;
            continue;
          }
          const keys = Object.keys(item.option || {});
          const config2 = item.config || {};
          for (const key of keys) {
            const targetCategoryForRead = item.saveCategory || categoryKey;
            const configval = config2.useRawValue
              ? item.option[key]
              : this.settings.hasOwnProperty(targetCategoryForRead) &&
                  this.settings[targetCategoryForRead].hasOwnProperty(key)
                ? this.settings[targetCategoryForRead][key]
                : item.option[key];
            let iconBase64 = "";
            if (typeof item.icon === "string") {
              iconBase64 = item.icon;
            } else {
              const icon = item.icon || { name: "gear", color: "#999999" };
              iconBase64 = await this.loadSF2B64(
                icon.name || "gear",
                icon.color || "#999999",
                icon.pure ? true : void 0,
                icon.fontSize || 20,
              );
            }
            const idName = categoryKey + "__" + key;
            const itemStyle = config2.style || "emphasis";
            actionsConfig.push({
              id: idName,
              categoryKey,
              key,
              type: item.type,
              title: item.title,
              desc: item.desc,
              option: item.option,
              config: config2,
              menuOptions: config2.menuOptions,
              defaultValue: item.option[key],
              style: itemStyle,
              truncateLength: config2.truncateLength,
              min: config2.min,
              max: config2.max,
              step: config2.step,
              unit: config2.unit,
              useRawValue: config2.useRawValue,
              placeholder: config2.placeholder,
              defaultShowContent: config2.defaultShowContent,
              customId: item.customId,
              // 保存 customId，用于判断是否有 onAction
              saveCategory: item.saveCategory,
              // 保存 saveCategory，用于指定保存到的分类
            });
            let rightHtml = "";
            if (item.type === "slider") {
              const min = config2.min !== void 0 ? config2.min : 0;
              const max = config2.max !== void 0 ? config2.max : 100;
              const step = config2.step || 1;
              const unit = config2.unit || "";
              const currentVal =
                configval !== void 0 && configval !== "" ? configval : min;
              configList += this.generateSliderHtml({
                idName,
                iconBase64,
                title: item.title,
                desc: item.desc || "",
                min,
                max,
                step,
                unit,
                currentVal,
              });
            } else if (item.type === "color") {
              rightHtml =
                '<div class="color-picker-wrapper"><input class="form-item__input" type="color" name="' +
                idName +
                '" value="' +
                (configval || "#ffffff") +
                '"></div>';
              configList += `
                                <label id="${idName}" class="form-item">
                                    <div class="form-label">
                                        <img class="form-label-img" src="${iconBase64}"/>
                                        <div class="form-label-title">${item.title}</div>
                                    </div>
                                    <div class="form-item-right-desc">
                                        ${rightHtml}
                                    </div>
                                </label>
                            `;
            } else if (item.type === "select") {
              const selectOptions = config2.selectOptions || [];
              const multiple = config2.multiple || false;
              const editable = config2.editable || false;
              const defaultShowContent = config2.defaultShowContent || "请选择";
              const truncateLength =
                config2.truncateLength === void 0
                  ? DEFAULT_TRUNCATE_LENGTH2
                  : config2.truncateLength <= 0
                    ? 0
                    : config2.truncateLength;
              const customOptionsKey = key + "_customOptions";
              let customOptions = [];
              if (
                editable &&
                this.settings[categoryKey] &&
                this.settings[categoryKey][customOptionsKey]
              ) {
                customOptions = this.settings[categoryKey][customOptionsKey];
              }
              const allOptions = [
                ...selectOptions,
                ...customOptions.map((v) => ({ value: v, label: v })),
              ];
              let selectedValues = [];
              if (Array.isArray(configval)) {
                selectedValues = configval;
              } else if (configval) {
                selectedValues = [configval];
              }
              let displayText = defaultShowContent;
              if (selectedValues.length > 0) {
                const selectedLabels = selectedValues.map((v) => {
                  const opt = allOptions.find(
                    (o) => (typeof o === "object" ? o.value : o) === v,
                  );
                  return opt ? (typeof opt === "object" ? opt.label : opt) : v;
                });
                if (truncateLength > 0 && selectedLabels.length > 0) {
                  let currentLength = 0;
                  let keepCount = 0;
                  for (let i = 0; i < selectedLabels.length; i++) {
                    const labelLen = selectedLabels[i].length;
                    if (i === 0) {
                      currentLength = labelLen;
                      keepCount = 1;
                    } else if (currentLength + 2 + labelLen <= truncateLength) {
                      currentLength += 2 + labelLen;
                      keepCount++;
                    } else {
                      break;
                    }
                  }
                  if (keepCount < selectedLabels.length) {
                    displayText =
                      selectedLabels.slice(0, keepCount).join(", ") +
                      " 等" +
                      selectedLabels.length +
                      "项";
                  } else {
                    displayText = selectedLabels.join(", ");
                  }
                } else if (multiple && selectedLabels.length > 2) {
                  displayText =
                    selectedLabels.slice(0, 2).join(", ") +
                    " 等" +
                    selectedLabels.length +
                    "项";
                } else {
                  displayText = selectedLabels.join(", ");
                }
              }
              const selectStyle = config2.style || "emphasis";
              const valueTextClass =
                selectStyle === "compact"
                  ? "value-text value-text--compact"
                  : "value-text value-text--emphasis";
              const selectChevronHtml =
                selectStyle === "compact"
                  ? '<img class="icon-chevron" src="' + chevronIcon + '"/>'
                  : "";
              const selectIndicatorHtmlStr =
                '<img class="icon-select-indicator" src="' +
                selectIndicatorIcon +
                '"/>';
              const optionsJson = JSON.stringify(selectOptions).replace(
                /"/g,
                "&quot;",
              );
              const selectedJson = JSON.stringify(selectedValues).replace(
                /"/g,
                "&quot;",
              );
              const customOptionsJson = JSON.stringify(customOptions).replace(
                /"/g,
                "&quot;",
              );
              const dataTruncate = truncateLength <= 0 ? 0 : truncateLength;
              rightHtml = `<div class="select-picker-wrapper" data-name="${idName}" data-options="${optionsJson}" data-multiple="${multiple}" data-editable="${editable}" data-custom-options="${customOptionsJson}" data-title="${item.title || ""}" data-desc="${item.desc || ""}" data-selected="${selectedJson}" data-default="${defaultShowContent}" data-truncate="${dataTruncate}"><span class="${valueTextClass}">${displayText}</span>${selectIndicatorHtmlStr}${selectChevronHtml}</div>`;
              actionsConfig[actionsConfig.length - 1].selectOptions =
                selectOptions;
              actionsConfig[actionsConfig.length - 1].multiple = multiple;
              actionsConfig[actionsConfig.length - 1].editable = editable;
              actionsConfig[actionsConfig.length - 1].defaultShowContent =
                defaultShowContent;
              configList += `
                                <label id="${idName}" class="form-item">
                                    <div class="form-label">
                                        <img class="form-label-img" src="${iconBase64}"/>
                                        <div class="form-label-title">${item.title}</div>
                                    </div>
                                    <div class="form-item-right-desc">
                                        ${rightHtml}
                                    </div>
                                </label>
                            `;
            } else if (item.type === "password") {
              const placeholder = config2.placeholder || "请输入...";
              const displayVal = configval ? "••••••••" : "";
              const eyeCloseColor = "#8e8e93";
              const eyeCloseIcon = await this.loadSF2B64(
                "eye.slash",
                eyeCloseColor,
                true,
                16,
              );
              const eyeOpenIcon = await this.loadSF2B64(
                "eye",
                eyeCloseColor,
                true,
                16,
              );
              rightHtml = `<div class="password-wrapper" data-name="${idName}" data-title="${item.title || ""}" data-desc="${item.desc || ""}" data-placeholder="${placeholder}" data-value="${configval || ""}" data-eye-open="${eyeOpenIcon}" data-eye-close="${eyeCloseIcon}"><span class="password-value">${displayVal}</span><img class="password-eye-icon" src="${eyeCloseIcon}"/></div>`;
              configList += `
                                <label id="${idName}" class="form-item">
                                    <div class="form-label">
                                        <img class="form-label-img" src="${iconBase64}"/>
                                        <div class="form-label-title">${item.title}</div>
                                    </div>
                                    <div class="form-item-right-desc">
                                        ${rightHtml}
                                    </div>
                                </label>
                            `;
            } else if (item.type === "text") {
              const placeholder = config2.placeholder || "请输入...";
              const defaultShowContent = config2.defaultShowContent || "";
              const displayVal =
                configval !== void 0 && configval !== null && configval !== ""
                  ? configval
                  : "";
              const truncateLength =
                config2.truncateLength === void 0
                  ? DEFAULT_TRUNCATE_LENGTH2
                  : config2.truncateLength <= 0
                    ? 0
                    : config2.truncateLength;
              let displayText = displayVal || defaultShowContent;
              if (truncateLength > 0 && displayText.length > truncateLength) {
                displayText = displayText.substring(0, truncateLength) + "...";
              }
              let valueTextClass = "value-text value-text--emphasis";
              if (itemStyle === "compact") {
                valueTextClass = "value-text value-text--compact";
              }
              const chevronHtml =
                itemStyle === "compact"
                  ? '<img class="icon-chevron" src="' + chevronIcon + '"/>'
                  : "";
              const dataTruncate = truncateLength <= 0 ? 0 : truncateLength;
              const customIdAttr = item.customId
                ? ` data-custom-id="${item.customId}"`
                : "";
              rightHtml = `<div class="text-input-wrapper" data-name="${idName}" data-title="${item.title || ""}" data-desc="${item.desc || ""}" data-placeholder="${placeholder}" data-default="${defaultShowContent}" data-value="${displayVal}" data-truncate="${dataTruncate}"${customIdAttr}><span class="${valueTextClass}">${displayText}</span>${chevronHtml}</div>`;
              configList += `
                                <label id="${idName}" class="form-item">
                                    <div class="form-label">
                                        <img class="form-label-img" src="${iconBase64}"/>
                                        <div class="form-label-title">${item.title}</div>
                                    </div>
                                    <div class="form-item-right-desc">
                                        ${rightHtml}
                                    </div>
                                </label>
                            `;
            } else if (item.type === "switch") {
              const boolVal =
                configval === true ||
                configval === "true" ||
                configval === 1 ||
                configval === "1";
              const checked = boolVal ? 'checked="checked"' : "";
              rightHtml = `<input name="${idName}" role="switch" type="checkbox" value="true" ${checked} />`;
              configList += `
                                <label id="${idName}" class="form-item-switch form-item--link">
                                    <div class="form-label">
                                        <img class="form-label-img" src="${iconBase64}"/>
                                        <div class="form-label-title">${item.title}</div>
                                    </div>
                                    <div class="form-item-right-desc">
                                        ${rightHtml}
                                    </div>
                                </label>
                            `;
            } else {
              let displayVal =
                configval !== void 0 && configval !== null && configval !== ""
                  ? configval
                  : "";
              const truncateLength =
                config2.truncateLength === void 0
                  ? DEFAULT_TRUNCATE_LENGTH2
                  : config2.truncateLength <= 0
                    ? 0
                    : config2.truncateLength;
              if (truncateLength > 0 && displayVal.length > truncateLength) {
                displayVal = displayVal.substring(0, truncateLength) + "...";
              }
              let valueTextClass = "value-text value-text--emphasis";
              if (itemStyle === "compact") {
                valueTextClass = "value-text value-text--compact";
              }
              const chevronHtml =
                itemStyle === "compact"
                  ? '<img class="icon-chevron" src="' + chevronIcon + '"/>'
                  : "";
              rightHtml =
                '<span class="' +
                valueTextClass +
                '">' +
                displayVal +
                "</span>" +
                chevronHtml;
              configList += `
                                <label id="${idName}" class="form-item">
                                    <div class="form-label">
                                        <img class="form-label-img" src="${iconBase64}"/>
                                        <div class="form-label-title">${item.title}</div>
                                    </div>
                                    <div class="form-item-right-desc">
                                        ${rightHtml}
                                    </div>
                                </label>
                            `;
            }
          }
        }
        configList += `
                        </form>
                    </div>
                `;
      }
      let customHeadHtml = "";
      if (customHeadHtmlRender) {
        customHeadHtml = await customHeadHtmlRender.call(this);
      }
      let customFootHtml = "";
      if (customFootHtmlRender) {
        customFootHtml = await customFootHtmlRender.call(this);
      }
      const html = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, user-scalable=no">
                        <style>${style}</style>
                    </head>
                    <body>
                        ${customHeadHtml}
                        ${configList}
                        ${customFootHtml}
                        <script>${js}</script>
                    </body>
                </html>
            `;
      const previewWebView = new WebView();
      await previewWebView.loadHTML(html);
      const isBackgroundImage = (optionKey) => {
        return (
          optionKey === this.BACKGROUND_DAY_KEY ||
          optionKey === this.BACKGROUND_NIGHT_KEY ||
          optionKey === this.BACKGROUND_TRANSPARENT_KEY
        );
      };
      const isBackgroundDisabled = (optionKey) => {
        if (optionKey === this.BACKGROUND_TRANSPARENT_KEY) {
          return !!(
            this.settings[this.BACKGROUND_DAY_KEY] ||
            this.settings[this.BACKGROUND_NIGHT_KEY]
          );
        }
        if (
          optionKey === this.BACKGROUND_DAY_KEY ||
          optionKey === this.BACKGROUND_NIGHT_KEY
        ) {
          return !!this.settings[this.BACKGROUND_TRANSPARENT_KEY];
        }
        return false;
      };
      const clearMutuallyExclusiveBackgrounds = (optionKey) => {
        if (optionKey === this.BACKGROUND_TRANSPARENT_KEY) {
          this.storage.removeFile(this.BACKGROUND_DAY_KEY, true);
          this.storage.removeFile(this.BACKGROUND_DAY_KEY, false);
          this.storage.removeFile(this.BACKGROUND_NIGHT_KEY, true);
          this.storage.removeFile(this.BACKGROUND_NIGHT_KEY, false);
          saveImageValue(this.BACKGROUND_DAY_KEY, "", false);
          saveImageValue(this.BACKGROUND_NIGHT_KEY, "", false);
        } else if (isBackgroundImage(optionKey)) {
          this.storage.removeFile(this.BACKGROUND_TRANSPARENT_KEY, true);
          this.storage.removeFile(this.BACKGROUND_TRANSPARENT_KEY, false);
          saveImageValue(this.BACKGROUND_TRANSPARENT_KEY, "", false);
        }
      };
      const refreshImageStatusAuto = async (
        optionKey,
        isGlobalSetting = false,
      ) => {
        if (isBackgroundImage(optionKey)) {
          await refreshAllBackgroundsStatus();
        } else {
          const hasImg = !!(isGlobalSetting
            ? this.baseSettings[optionKey]
            : this.settings[optionKey]);
          await refreshImageItemStatus(optionKey, hasImg);
        }
      };
      const prepareImageHtml = async (optionKey, hasImg) => {
        const targetItem = actionsConfig.find(
          (item) => item.optionKey === optionKey,
        );
        if (!targetItem) return null;
        const targetId = targetItem.id;
        const color = targetItem.iconColor || "#56A8D6";
        const setIcon = targetItem.setIcon || "photo.fill.on.rectangle.fill";
        const emptyIconName = targetItem.emptyIcon || "photo.on.rectangle";
        const showThumb = targetItem.showThumbnail !== false;
        const disabled = isBackgroundDisabled(optionKey);
        let newHtml = "";
        if (disabled) {
          const lockIcon = await this.loadSF2B64(
            "lock.fill",
            "#8e8e93",
            true,
            18,
          );
          newHtml = `<div class="form-item-thumb form-item-thumb--disabled"><img class="form-item-thumb-icon" src="${lockIcon}"/></div>`;
        } else if (showThumb && hasImg) {
          const isGlobalSetting = targetItem.isGlobalSetting;
          const optionValue = isGlobalSetting
            ? this.baseSettings[optionKey]
            : this.settings[optionKey];
          const storage = isGlobalSetting ? this.globalStorage : this.storage;
          const imgFile = await this.getImageByUrl(
            optionValue,
            storage,
            optionKey,
          );
          if (imgFile) {
            const imgData = Data.fromPNG(imgFile).toBase64String();
            newHtml = `<div class="form-item-thumb form-item-thumb--set"><img class="form-item-thumb-icon" src="data:image/png;base64,${imgData}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;"/></div>`;
          }
        } else if (hasImg) {
          const photoIcon = await this.loadSF2B64(setIcon, color, true, 18);
          newHtml = `<div class="form-item-thumb form-item-thumb--set"><img class="form-item-thumb-icon" src="${photoIcon}"/></div>`;
        } else {
          const emptyIcon = await this.loadSF2B64(
            emptyIconName,
            "#8e8e93",
            true,
            18,
          );
          newHtml = `<div class="form-item-thumb"><img class="form-item-thumb-icon" src="${emptyIcon}"/></div>`;
        }
        return newHtml ? { targetId, newHtml } : null;
      };
      const batchUpdateDom = async (updates) => {
        const validUpdates = updates.filter((u) => u);
        if (validUpdates.length === 0) return;
        let jsCode = "(function() {";
        validUpdates.forEach((u, i) => {
          jsCode += `var el${i}=document.getElementById('${u.targetId}');if(el${i}){var d${i}=el${i}.querySelector('.form-item-right-desc');if(d${i})d${i}.innerHTML=${JSON.stringify(u.newHtml)};}`;
        });
        jsCode += `
                    var currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                    window.scrollTo(0, currentScroll + 1);
                    setTimeout(function(){ window.scrollTo(0, currentScroll); }, 0);
                `;
        jsCode += "})();";
        try {
          await previewWebView.evaluateJavaScript(jsCode, true);
        } catch (e) {}
      };
      const refreshImageItemStatus = async (optionKey, hasImg) => {
        const update = await prepareImageHtml(optionKey, hasImg);
        if (update) await batchUpdateDom([update]);
      };
      const refreshAllBackgroundsStatus = async () => {
        const dayHasImg = !!this.settings[this.BACKGROUND_DAY_KEY];
        const nightHasImg = !!this.settings[this.BACKGROUND_NIGHT_KEY];
        const transHasImg = !!this.settings[this.BACKGROUND_TRANSPARENT_KEY];
        const updates = await Promise.all([
          prepareImageHtml(this.BACKGROUND_DAY_KEY, dayHasImg),
          prepareImageHtml(this.BACKGROUND_NIGHT_KEY, nightHasImg),
          prepareImageHtml(this.BACKGROUND_TRANSPARENT_KEY, transHasImg),
        ]);
        await batchUpdateDom(updates);
      };
      const saveImageValue = (optionKey, value, isGlobalSetting = false) => {
        if (isGlobalSetting) {
          this.baseSettings[optionKey] = value;
          this.saveBaseSettings({ [optionKey]: value }, false);
        } else {
          this.settings[optionKey] = value;
          this.saveSettings(false);
        }
      };
      const saveImageCommon = async (
        img,
        optionKey,
        isGlobalSetting,
        notifyOnSet,
        actionItem,
        updateAvatar = false,
      ) => {
        if (!img) return false;
        const storage = isGlobalSetting ? this.globalStorage : this.storage;
        storage.setFile(optionKey, img);
        saveImageValue(optionKey, `@album:${optionKey}`, isGlobalSetting);
        clearMutuallyExclusiveBackgrounds(optionKey);
        if (notifyOnSet) {
          const msg = actionItem?.config?.notifyMessages?.success;
          await this.notify(
            msg?.title || "设置成功",
            msg?.body || "图片已保存",
          );
        }
        await refreshImageStatusAuto(optionKey, isGlobalSetting);
        if (updateAvatar && optionKey === "avatar") {
          await this.refreshMainAvatar(previewWebView);
        }
        return true;
      };
      const clearImageCommon = async (
        optionKey,
        isGlobalSetting,
        notifyOnSet,
        actionItem,
        updateAvatar = false,
      ) => {
        const storage = isGlobalSetting ? this.globalStorage : this.storage;
        storage.removeFile(optionKey, true);
        storage.removeFile(optionKey, false);
        saveImageValue(optionKey, "", isGlobalSetting);
        if (notifyOnSet) {
          const msg = actionItem?.config?.notifyMessages?.clear;
          await this.notify(msg?.title || "已清空", msg?.body || "图片已移除");
        }
        await refreshImageStatusAuto(optionKey, isGlobalSetting);
        if (updateAvatar && optionKey === "avatar") {
          await this.refreshMainAvatar(previewWebView);
        }
      };
      const saveImageUrlCommon = async (
        imageUrl,
        optionKey,
        isGlobalSetting,
        notifyOnSet,
        actionItem,
        clearable = true,
      ) => {
        if (imageUrl && imageUrl !== "") {
          saveImageValue(optionKey, imageUrl, isGlobalSetting);
          clearMutuallyExclusiveBackgrounds(optionKey);
          if (notifyOnSet) {
            const msg = actionItem?.config?.notifyMessages?.success;
            await this.notify(
              msg?.title || "设置成功",
              msg?.body || "图片URL已保存",
            );
          }
          await refreshImageStatusAuto(optionKey, isGlobalSetting);
          if (optionKey === "avatar")
            await this.refreshMainAvatar(previewWebView);
        } else if (imageUrl === "" && clearable) {
          await clearImageCommon(
            optionKey,
            isGlobalSetting,
            notifyOnSet,
            actionItem,
            true,
          );
        }
      };
      let isWebViewClosed = false;
      const injectListener = async () => {
        if (isWebViewClosed) return;
        let event;
        try {
          event = await previewWebView.evaluateJavaScript(
            `(() => {
                            try {
                                // 先移除旧的监听器，再添加新的
                                if (window._jbridgeHandler) {
                                    window.removeEventListener('JBridge', window._jbridgeHandler);
                                }
                                window._jbridgeHandler = (e) => {
                                    completion(JSON.stringify(e.detail || {}))
                                };
                                window.addEventListener('JBridge', window._jbridgeHandler);
                            } catch (e) {
                                alert("界面出错：" + e);
                            }
                        })()`,
            true,
          );
        } catch (e) {
          return;
        }
        if (isWebViewClosed) return;
        const { code: code2, data: data2 } = JSON.parse(event);
        try {
          if (customActionHandler) {
            const handled = await customActionHandler.call(
              this,
              code2,
              data2,
              previewWebView,
            );
            if (handled === "refresh") {
              isWebViewClosed = true;
              this.reopenScript();
              return;
            }
            if (handled === true) {
              return;
            }
          }
          if (code2.startsWith("image-menu-")) {
            const itemId = code2.replace("image-menu-", "");
            const actionItem2 = actionsConfig.find(
              (item) => item.id === itemId,
            );
            if (actionItem2 && actionItem2.type === "image") {
              const selection = data2;
              const optionKey = actionItem2.optionKey;
              const isGlobalSetting = actionItem2.isGlobalSetting;
              const clearable = actionItem2.clearable !== false;
              const urlPlaceholder =
                actionItem2.urlPlaceholder || "🔗请输入图片URL";
              const notifyOnSet = actionItem2.notifyOnSet !== false;
              if (selection === "clear") {
                await clearImageCommon(
                  optionKey,
                  isGlobalSetting,
                  notifyOnSet,
                  actionItem2,
                  true,
                );
                return;
              }
              if (isBackgroundDisabled(optionKey)) {
                const msg =
                  optionKey === this.BACKGROUND_TRANSPARENT_KEY
                    ? "透明背景已被禁用\n\n请先清空日间/夜间背景图片"
                    : "日间/夜间背景已被禁用\n\n请先清空透明背景";
                await this.generateAlert(msg, ["确定"]);
                return;
              }
              const refreshAllBackgrounds = async () => {
                await refreshAllBackgroundsStatus();
              };
              if (selection === "cancel") {
              } else if (selection === "album") {
                try {
                  const backImage = await this.chooseImg();
                  if (backImage && (await this.verifyImage(backImage))) {
                    await saveImageCommon(
                      backImage,
                      optionKey,
                      isGlobalSetting,
                      notifyOnSet,
                      actionItem2,
                      true,
                    );
                  }
                } catch (err) {
                  console.log(
                    `[WidgetBase][presentSettings] image album error:`,
                    err,
                  );
                }
              } else if (selection === "url") {
                const urlInputId = `url-input-${itemId}`;
                const currentValue = isGlobalSetting
                  ? this.baseSettings[optionKey]
                  : this.settings[optionKey];
                const currentUrl =
                  currentValue && isHttpUrl2(currentValue) ? currentValue : "";
                await previewWebView.evaluateJavaScript(
                  `(function() {
                                        if(document.getElementById('${urlInputId}')) return;
                                        const overlayHtml = '<div class="text-popup">' +
                                            '<div class="text-popup-handle"></div>' +
                                            '<div class="text-popup-content">' +
                                            '<div class="text-popup-header">' +
                                            '<span class="text-popup-title">${actionItem2.title || "设置图片"}</span>' +
                                            '<span class="text-popup-confirm">完成</span>' +
                                            '</div>' +
                                            '<div class="text-popup-desc">请输入图片URL</div>' +
                                            '<input type="text" class="text-input" placeholder="${urlPlaceholder}" value="${currentUrl}" />' +
                                            '</div></div>';
                                        const overlay = createOverlay(overlayHtml, 'text-popup-overlay');
                                        overlay.id = '${urlInputId}';
                                        const input = overlay.querySelector('.text-input');
                                        setTimeout(() => input.focus(), 350);
                                        const close = (val) => {
                                            closeOverlay(overlay);
                                            if(val !== undefined) window.invoke('${urlInputId}', val);
                                        };
                                        overlay.querySelector('.text-popup-confirm').onclick = () => close(input.value);
                                        overlay.addEventListener('click', (e) => { if(e.target === overlay) closeOverlay(overlay); });
                                    })()`,
                  false,
                );
              }
            }
            return;
          }
          if (code2.startsWith("url-input-")) {
            const itemId = code2.replace(
              /^url-input-(image-menu-|direct-)?/,
              "",
            );
            const actionItem2 = actionsConfig.find(
              (item) => item.id === itemId,
            );
            if (actionItem2 && actionItem2.type === "image") {
              const imageUrl = data2;
              const optionKey = actionItem2.optionKey;
              const isGlobalSetting = actionItem2.isGlobalSetting;
              const notifyOnSet = actionItem2.notifyOnSet !== false;
              const clearable = actionItem2.clearable !== false;
              await saveImageUrlCommon(
                imageUrl,
                optionKey,
                isGlobalSetting,
                notifyOnSet,
                actionItem2,
                clearable,
              );
            }
            return;
          }
          if (code2.endsWith("_customOptions")) {
            const originalCode = code2.replace("_customOptions", "");
            const actionItem2 = actionsConfig.find(
              (item) => item.id === originalCode,
            );
            if (actionItem2 && actionItem2.type === "select") {
              const { categoryKey, key } = actionItem2;
              const targetCategory =
                actionItem2.saveCategory ||
                actionItem2.categoryKey ||
                categoryKey;
              let customOptions = [];
              try {
                customOptions = JSON.parse(data2);
              } catch (e) {
                console.log(
                  `[WidgetBase][presentSettings] customOptions parse error:`,
                  e,
                );
              }
              if (!this.settings[targetCategory]) {
                this.settings[targetCategory] = {};
              }
              this.settings[targetCategory][key + "_customOptions"] =
                customOptions;
              this.syncCurrentSettings(
                targetCategory,
                key + "_customOptions",
                customOptions,
              );
              this.saveSettings(false);
            }
            return;
          }
          const actionItem = actionsConfig.find((item) => item.id === code2);
          if (actionItem) {
            const { categoryKey, key, type, title, desc } = actionItem;
            const targetCategory = actionItem.saveCategory || categoryKey;
            if (type === "reset") {
              const options = ["取消", "重置"];
              const message =
                "本菜单里的所有设置参数将会重置为默认值，脚本将自动重启";
              const index = await this.generateAlert(message, options);
              if (index === 1) {
                this.resetCurrentSettingsToDefaults(extraSettings, true);
                await this.clearAllBackgrounds();
                this.saveSettings();
                isWebViewClosed = true;
                this.reopenScript();
                return;
              }
              return;
            } else if (type === "color") {
              if (data2 !== void 0) {
                if (!this.settings[targetCategory]) {
                  this.settings[targetCategory] = {};
                }
                this.settings[targetCategory][key] = data2;
                this.syncCurrentSettings(targetCategory, key, data2);
                this.saveSettings(false);
              }
            } else if (type === "text") {
              if (targetCategory === "baseSettings") {
                this.saveBaseSettings(
                  { [key]: data2 !== void 0 ? data2 : "" },
                  false,
                );
                this.syncCurrentSettings(
                  targetCategory,
                  key,
                  data2 !== void 0 ? data2 : "",
                );
              } else {
                if (!this.settings[targetCategory]) {
                  this.settings[targetCategory] = {};
                }
                this.settings[targetCategory][key] =
                  data2 !== void 0 ? data2 : "";
                this.syncCurrentSettings(
                  targetCategory,
                  key,
                  this.settings[targetCategory][key],
                );
                this.saveSettings(false);
              }
            } else if (type === "slider") {
              if (data2 !== void 0) {
                let val = parseFloat(data2);
                const min =
                  actionItem.config?.min !== void 0 ? actionItem.config.min : 0;
                const max =
                  actionItem.config?.max !== void 0
                    ? actionItem.config.max
                    : 100;
                if (val < min) val = min;
                if (val > max) val = max;
                if (!this.settings[targetCategory]) {
                  this.settings[targetCategory] = {};
                }
                this.settings[targetCategory][key] = val;
                this.syncCurrentSettings(targetCategory, key, val);
                this.saveSettings(false);
              } else {
                console.warn(
                  `[WidgetBase][presentSettings] ⚠️ [SAVE-SLIDER] data is undefined!`,
                );
              }
            } else if (type === "select") {
              if (data2 !== void 0) {
                const multiple = actionItem.config?.multiple || false;
                let value;
                if (multiple) {
                  try {
                    value = JSON.parse(data2);
                  } catch (e) {
                    console.log(
                      `[WidgetBase][presentSettings] select parse error:`,
                      e,
                    );
                    value = [];
                  }
                } else {
                  value = data2;
                }
                if (!this.settings[targetCategory]) {
                  this.settings[targetCategory] = {};
                }
                this.settings[targetCategory][key] = value;
                this.syncCurrentSettings(targetCategory, key, value);
                this.saveSettings(false);
              } else {
                console.log(
                  `[WidgetBase][presentSettings] 忽略select空事件: ${code2}`,
                );
              }
            } else if (type === "password") {
              if (!this.settings[targetCategory]) {
                this.settings[targetCategory] = {};
              }
              this.settings[targetCategory][key] =
                data2 !== void 0 ? data2 : "";
              this.syncCurrentSettings(
                targetCategory,
                key,
                this.settings[targetCategory][key],
              );
              this.saveSettings(false);
            } else if (type === "switch") {
              if (data2 !== void 0) {
                const boolVal =
                  data2 === true ||
                  data2 === "true" ||
                  data2 === 1 ||
                  data2 === "1";
                if (!this.settings[targetCategory]) {
                  this.settings[targetCategory] = {};
                }
                this.settings[targetCategory][key] = boolVal;
                this.syncCurrentSettings(targetCategory, key, boolVal);
                this.saveSettings(false);
              }
            } else if (type === "image") {
              const imageSource = actionItem.config.imageSource || "album";
              const optionKey = actionItem.optionKey;
              const isGlobalSetting = actionItem.isGlobalSetting;
              const clearable = actionItem.config.clearable !== false;
              const urlPlaceholder =
                actionItem.config.urlPlaceholder || "🔗请输入图片URL";
              const notifyOnSet = actionItem.config.notifyOnSet !== false;
              const itemId = actionItem.id;
              if (isBackgroundDisabled(optionKey)) {
                const msg =
                  optionKey === this.BACKGROUND_TRANSPARENT_KEY
                    ? "透明背景已被禁用\n\n请先清空日间/夜间背景图片"
                    : "日间/夜间背景已被禁用\n\n请先清空透明背景";
                await this.generateAlert(msg, ["确定"]);
                return;
              }
              const showImageMenu = async (menuId, options, title2) => {
                await previewWebView.evaluateJavaScript(
                  `(function() {
                                        if(document.getElementById('${menuId}')) return;
                                        const options = ${JSON.stringify(options)};
                                        const menuHtml = '<div class="image-menu-popup">' +
                                            '<div class="image-menu-popup-handle"></div>' +
                                            '<div class="image-menu-popup-content">' +
                                            '<div class="image-menu-popup-header">' +
                                            '<span class="image-menu-popup-title">${title2 || "设置图片"}</span>' +
                                            '<span class="image-menu-popup-close">×</span>' +
                                            '</div>' +
                                            '<div class="image-menu-options">' +
                                            options.map(opt => '<div class="image-menu-option" data-value="' + opt.value + '">' + opt.label + '</div>').join('') +
                                            '</div></div></div>';
                                        const overlay = createOverlay(menuHtml, 'image-menu-popup-overlay');
                                        overlay.id = '${menuId}';
                                        const close = () => closeOverlay(overlay);
                                        overlay.querySelector('.image-menu-popup-close').onclick = close;
                                        overlay.querySelectorAll('.image-menu-option').forEach(opt => {
                                            opt.onclick = () => {
                                                const val = opt.dataset.value;
                                                close();
                                                window.invoke('${menuId}', val);
                                            };
                                        });
                                        overlay.onclick = (e) => { if(e.target === overlay) close(); };
                                    })()`,
                  false,
                );
              };
              const showUrlInput = async (urlInputId, lastUrl, title2) => {
                await previewWebView.evaluateJavaScript(
                  `(function() {
                                        if(document.getElementById('${urlInputId}')) return;
                                        const overlayHtml = '<div class="text-popup">' +
                                            '<div class="text-popup-handle"></div>' +
                                            '<div class="text-popup-content">' +
                                            '<div class="text-popup-header">' +
                                            '<span class="text-popup-title">${title2 || "设置图片"}</span>' +
                                            '<span class="text-popup-confirm">完成</span>' +
                                            '</div>' +
                                            '<div class="text-popup-desc">请输入图片URL</div>' +
                                            '<input type="text" class="text-input" placeholder="${urlPlaceholder}" value="${lastUrl}" />' +
                                            '</div></div>';
                                        const overlay = createOverlay(overlayHtml, 'text-popup-overlay');
                                        overlay.id = '${urlInputId}';
                                        const input = overlay.querySelector('.text-input');
                                        setTimeout(() => input.focus(), 350);
                                        const close = (val) => {
                                            closeOverlay(overlay);
                                            if(val !== undefined) window.invoke('${urlInputId}', val);
                                        };
                                        overlay.querySelector('.text-popup-confirm').onclick = () => close(input.value);
                                        overlay.addEventListener('click', (e) => { if(e.target === overlay) closeOverlay(overlay); });
                                    })()`,
                  false,
                );
              };
              const checkImageExists = async () => {
                const storage = isGlobalSetting
                  ? this.globalStorage
                  : this.storage;
                const optionValue = isGlobalSetting
                  ? this.baseSettings[optionKey]
                  : this.settings[optionKey];
                if (!optionValue) return false;
                const img = await this.getImageByUrl(
                  optionValue,
                  storage,
                  optionKey,
                );
                return !!img;
              };
              const saveImage = async (img) => {
                return await saveImageCommon(
                  img,
                  optionKey,
                  isGlobalSetting,
                  notifyOnSet,
                  actionItem,
                  false,
                );
              };
              const clearImage = async () => {
                await clearImageCommon(
                  optionKey,
                  isGlobalSetting,
                  notifyOnSet,
                  actionItem,
                  false,
                );
              };
              if (imageSource === "screenshot") {
                const backImage =
                  await this.getWidgetScreenShot("设置组件透明背景");
                if (backImage) {
                  await saveImage(backImage);
                }
              } else if (imageSource === "url") {
                const hasImage = await checkImageExists();
                if (clearable && hasImage) {
                  const menuId = `image-menu-${itemId}`;
                  await showImageMenu(
                    menuId,
                    [
                      { label: "🔗 在线链接", value: "url" },
                      { label: "🗑️ 清空图片", value: "clear" },
                    ],
                    actionItem.title,
                  );
                  return;
                }
                const urlInputId = `url-input-direct-${itemId}`;
                const currentValue = isGlobalSetting
                  ? this.baseSettings[optionKey]
                  : this.settings[optionKey];
                const currentUrl =
                  currentValue && isHttpUrl2(currentValue) ? currentValue : "";
                await showUrlInput(urlInputId, currentUrl, actionItem.title);
                return;
              } else if (imageSource === "both") {
                const menuId = `image-menu-${itemId}`;
                await showImageMenu(
                  menuId,
                  clearable
                    ? [
                        { label: "📷 相册选择", value: "album" },
                        { label: "🔗 在线链接", value: "url" },
                        { label: "🗑️ 清空图片", value: "clear" },
                      ]
                    : [
                        { label: "📷 相册选择", value: "album" },
                        { label: "🔗 在线链接", value: "url" },
                      ],
                  actionItem.title,
                );
                return;
              } else {
                const hasImage = await checkImageExists();
                if (clearable && hasImage) {
                  const menuId = `image-menu-${itemId}`;
                  await showImageMenu(
                    menuId,
                    [
                      { label: "📷 相册选择", value: "album" },
                      { label: "🗑️ 清空图片", value: "clear" },
                    ],
                    actionItem.title,
                  );
                  return;
                }
                try {
                  const backImage = await this.chooseImg();
                  if (backImage && (await this.verifyImage(backImage))) {
                    await saveImage(backImage);
                  }
                } catch (err) {
                  console.log(
                    `[WidgetBase][presentSettings] image album error:`,
                    err,
                  );
                }
              }
            } else if (type === "removeBackground") {
              const opts = ["取消", "清空"];
              const msg = "该操作不可逆，会清空所有背景图片！";
              const idx = await this.generateAlert(msg, opts);
              if (idx === 1) {
                await this.clearAllBackgrounds();
                saveImageValue(this.BACKGROUND_DAY_KEY, "", false);
                saveImageValue(this.BACKGROUND_NIGHT_KEY, "", false);
                saveImageValue(this.BACKGROUND_TRANSPARENT_KEY, "", false);
                this.saveSettings(false);
                await refreshAllBackgroundsStatus();
                this.notify("清空成功", "背景图片已清空");
              }
            }
            return;
          }
        } catch (error) {
          console.log(
            `[WidgetBase][presentSettings] Operation error: ${error}`,
          );
        } finally {
          if (!isWebViewClosed) injectListener();
        }
      };
      injectListener().catch((e) => {
        if (!isWebViewClosed) {
          console.error(
            `[WidgetBase][presentSettings] injectListener error:`,
            e,
          );
        }
      });
      await previewWebView.present();
      isWebViewClosed = true;
    }
    _init(widgetFamily = config.widgetFamily) {
      this.widgetFamily = widgetFamily;
      this.SETTING_KEY = this.md5(Script.name());
      this.globalStorage = globalStorage2;
      this._storage = null;
      this._settingsStorage = null;
      this.settings = this.getSettings();
      this.baseSettings = this.getBaseSettings();
      this.settings.boxjsDomain =
        this.baseSettings.boxjsDomain ||
        this.settings.boxjsDomain ||
        "boxjs.com";
      this.settings.lightColor = this.settings.lightColor || "#111827";
      this.settings.darkColor = this.settings.darkColor || "#ffffff";
      this.settings.lightBgColor = this.settings.lightBgColor || "#ffffff";
      this.settings.darkBgColor = this.settings.darkBgColor || "#000000";
      this.settings.refreshAfterDate = this.settings.refreshAfterDate || "30";
      this.settings.lightOpacity = this.settings.lightOpacity || "0.4";
      this.settings.darkOpacity = this.settings.darkOpacity || "0.7";
      this.prefix = this.settings.boxjsDomain;
      const scaleSetting = this.settings.widgetScale || "1";
      if (scaleSetting && scaleSetting !== "") {
        const scaleValue = parseFloat(scaleSetting);
        this.widgetScale =
          !isNaN(scaleValue) && scaleValue > 0 ? scaleValue : 1;
      }
      const lightBgColor = this.getColors(this.settings.lightBgColor);
      const darkBgColor = this.getColors(this.settings.darkBgColor);
      if (lightBgColor.length > 1 || darkBgColor.length > 1) {
        this.backGroundColor = !Device.isUsingDarkAppearance()
          ? this.getBackgroundColor(lightBgColor)
          : this.getBackgroundColor(darkBgColor);
      } else if (lightBgColor.length > 0 && darkBgColor.length > 0) {
        this.backGroundColor = Color.dynamic(
          new Color(this.settings.lightBgColor),
          new Color(this.settings.darkBgColor),
        );
      }
      this.widgetColor = Color.dynamic(
        new Color(this.settings.lightColor),
        new Color(this.settings.darkColor),
      );
    }
    getWidgetSize(size = this.widgetFamily) {
      const family =
        size === "large" ? "large" : size === "small" ? "small" : "medium";
      const resolution = Device.screenResolution();
      const scale = Device.screenScale();
      const screenHeight = Math.round(
        Math.max(resolution.width, resolution.height),
      );
      const phone = phoneWidgetSizes[screenHeight] || phoneWidgetSizes[2532];
      return new Size(
        Math.round(phone[family] / scale),
        Math.round(phone[family === "medium" ? "small" : family] / scale),
      );
    }
    getColors = (color = "") => {
      const colors = typeof color === "string" ? color.split(",") : color;
      return colors;
    };
    getBackgroundColor = (colors) => {
      const locations = [];
      const linearColor = new LinearGradient();
      const cLen = colors.length;
      linearColor.colors = colors.map((item, index) => {
        locations.push(Math.floor(((index + 1) / cLen) * 100) / 100);
        return new Color(item, 1);
      });
      linearColor.locations = locations;
      return linearColor;
    };
    /**
     * 注册点击操作菜单
     * @param {string} name 操作函数名
     * @param {func} func 点击后执行的函数
     */
    /**
     * 注册设置项（统一入口）
     * @param {SettingItem|SettingItem[]} items - 单个或多个设置项对象
     */
    registerSetting(items) {
      if (!items) {
        return;
      }
      const itemArray = Array.isArray(items) ? items : [items];
      for (const item of itemArray) {
        const category = item.category || "actionSettings";
        const dataKeys = Object.keys(item.option || {});
        if (!item.id) {
          if (dataKeys.length > 0) {
            item.id = `${category}__${dataKeys[0]}`;
          } else if (item.title) {
            item.id = `${category}__${hash2(item.title)}`;
          } else {
            item.id = `${category}__${Date.now()}`;
          }
        }
        this._settings = this._settings || {};
        if (!this._settings[category]) {
          this._settings[category] = {
            title:
              item.categoryTitle ||
              (category === "actionSettings" ? "组件配置" : category),
            items: [],
          };
        }
        if (item.onAction) {
          this._actions = this._actions || {};
          const actionKey = item.id;
          const originalAction = item.onAction;
          this._actions[actionKey] = (previewWebView) => {
            return originalAction.call(this, previewWebView, item);
          };
          this._actionsIcon = this._actionsIcon || {};
          this._actionsIcon[actionKey] = item.icon;
        }
        this._settings[category].items.push({
          id: item.id,
          type: item.type || (item.onAction ? "custom" : "text"),
          title: item.title,
          desc: item.desc || "",
          icon: item.icon,
          option: item.option || {},
          config: item.config || {},
          // 类型特定配置
          customId: item.onAction ? item.id : void 0,
          saveCategory: item.saveCategory,
        });
      }
    }
    /**
     * 注册设置分类（批量注册同一分类下的多个项）
     * @param {string} category - 分类名称
     * @param {string} title - 分类标题
     * @param {Array<SettingItem>} items - 设置项数组（自动补充 category）
     */
    registerSettingCategory(category, title, items) {
      for (const item of items) {
        item.category = category;
        item.categoryTitle = title;
      }
      this.registerSetting(items);
    }
    /**
     * 获取设置项的元素 ID
     * @param {string} category - 分类名称，默认 'actionSettings'
     * @param {string} optionKey - option 对象的 key
     * @returns {string} 元素 ID，格式为 `${category}__${optionKey}`
     */
    getSettingElementId(category = "actionSettings", optionKey) {
      if (!optionKey) {
        console.error(
          `[WidgetBase][getSettingElementId] optionKey is required`,
        );
        return "";
      }
      return `${category}__${optionKey}`;
    }
    /**
     * base64 编码字符串
     * @param {string} str 要编码的字符串
     */
    base64Encode(str) {
      const data2 = Data.fromString(str);
      return data2.toBase64String();
    }
    /**
     * base64解码数据 返回字符串
     * @param {string} b64 base64编码的数据
     */
    base64Decode(b64) {
      const data2 = Data.fromBase64String(b64);
      return data2.toRawString();
    }
    /**
     * md5 加密字符串
     * @param {string} str 要加密成md5的数据
     */
    md5(str) {
      function d(n, t2) {
        const r2 = (65535 & n) + (65535 & t2);
        return (((n >> 16) + (t2 >> 16) + (r2 >> 16)) << 16) | (65535 & r2);
      }
      function f(n, t2, r2, e2, o2, u2) {
        let c, f2;
        return d(
          ((c = d(d(t2, n), d(e2, u2))) << (f2 = o2)) | (c >>> (32 - f2)),
          r2,
        );
      }
      function l(n, t2, r2, e2, o2, u2, c) {
        return f((t2 & r2) | (~t2 & e2), n, t2, o2, u2, c);
      }
      function v(n, t2, r2, e2, o2, u2, c) {
        return f((t2 & e2) | (r2 & ~e2), n, t2, o2, u2, c);
      }
      function g(n, t2, r2, e2, o2, u2, c) {
        return f(t2 ^ r2 ^ e2, n, t2, o2, u2, c);
      }
      function m(n, t2, r2, e2, o2, u2, c) {
        return f(r2 ^ (t2 | ~e2), n, t2, o2, u2, c);
      }
      function i(n, t2) {
        let r2, e2, o2, u2;
        ((n[t2 >> 5] |= 128 << (t2 % 32)),
          (n[14 + (((t2 + 64) >>> 9) << 4)] = t2));
        for (
          var c = 1732584193,
            f2 = -271733879,
            i2 = -1732584194,
            a2 = 271733878,
            h3 = 0;
          h3 < n.length;
          h3 += 16
        )
          ((c = l(
            (r2 = c),
            (e2 = f2),
            (o2 = i2),
            (u2 = a2),
            n[h3],
            7,
            -680876936,
          )),
            (a2 = l(a2, c, f2, i2, n[h3 + 1], 12, -389564586)),
            (i2 = l(i2, a2, c, f2, n[h3 + 2], 17, 606105819)),
            (f2 = l(f2, i2, a2, c, n[h3 + 3], 22, -1044525330)),
            (c = l(c, f2, i2, a2, n[h3 + 4], 7, -176418897)),
            (a2 = l(a2, c, f2, i2, n[h3 + 5], 12, 1200080426)),
            (i2 = l(i2, a2, c, f2, n[h3 + 6], 17, -1473231341)),
            (f2 = l(f2, i2, a2, c, n[h3 + 7], 22, -45705983)),
            (c = l(c, f2, i2, a2, n[h3 + 8], 7, 1770035416)),
            (a2 = l(a2, c, f2, i2, n[h3 + 9], 12, -1958414417)),
            (i2 = l(i2, a2, c, f2, n[h3 + 10], 17, -42063)),
            (f2 = l(f2, i2, a2, c, n[h3 + 11], 22, -1990404162)),
            (c = l(c, f2, i2, a2, n[h3 + 12], 7, 1804603682)),
            (a2 = l(a2, c, f2, i2, n[h3 + 13], 12, -40341101)),
            (i2 = l(i2, a2, c, f2, n[h3 + 14], 17, -1502002290)),
            (c = v(
              c,
              (f2 = l(f2, i2, a2, c, n[h3 + 15], 22, 1236535329)),
              i2,
              a2,
              n[h3 + 1],
              5,
              -165796510,
            )),
            (a2 = v(a2, c, f2, i2, n[h3 + 6], 9, -1069501632)),
            (i2 = v(i2, a2, c, f2, n[h3 + 11], 14, 643717713)),
            (f2 = v(f2, i2, a2, c, n[h3], 20, -373897302)),
            (c = v(c, f2, i2, a2, n[h3 + 5], 5, -701558691)),
            (a2 = v(a2, c, f2, i2, n[h3 + 10], 9, 38016083)),
            (i2 = v(i2, a2, c, f2, n[h3 + 15], 14, -660478335)),
            (f2 = v(f2, i2, a2, c, n[h3 + 4], 20, -405537848)),
            (c = v(c, f2, i2, a2, n[h3 + 9], 5, 568446438)),
            (a2 = v(a2, c, f2, i2, n[h3 + 14], 9, -1019803690)),
            (i2 = v(i2, a2, c, f2, n[h3 + 3], 14, -187363961)),
            (f2 = v(f2, i2, a2, c, n[h3 + 8], 20, 1163531501)),
            (c = v(c, f2, i2, a2, n[h3 + 13], 5, -1444681467)),
            (a2 = v(a2, c, f2, i2, n[h3 + 2], 9, -51403784)),
            (i2 = v(i2, a2, c, f2, n[h3 + 7], 14, 1735328473)),
            (c = g(
              c,
              (f2 = v(f2, i2, a2, c, n[h3 + 12], 20, -1926607734)),
              i2,
              a2,
              n[h3 + 5],
              4,
              -378558,
            )),
            (a2 = g(a2, c, f2, i2, n[h3 + 8], 11, -2022574463)),
            (i2 = g(i2, a2, c, f2, n[h3 + 11], 16, 1839030562)),
            (f2 = g(f2, i2, a2, c, n[h3 + 14], 23, -35309556)),
            (c = g(c, f2, i2, a2, n[h3 + 1], 4, -1530992060)),
            (a2 = g(a2, c, f2, i2, n[h3 + 4], 11, 1272893353)),
            (i2 = g(i2, a2, c, f2, n[h3 + 7], 16, -155497632)),
            (f2 = g(f2, i2, a2, c, n[h3 + 10], 23, -1094730640)),
            (c = g(c, f2, i2, a2, n[h3 + 13], 4, 681279174)),
            (a2 = g(a2, c, f2, i2, n[h3], 11, -358537222)),
            (i2 = g(i2, a2, c, f2, n[h3 + 3], 16, -722521979)),
            (f2 = g(f2, i2, a2, c, n[h3 + 6], 23, 76029189)),
            (c = g(c, f2, i2, a2, n[h3 + 9], 4, -640364487)),
            (a2 = g(a2, c, f2, i2, n[h3 + 12], 11, -421815835)),
            (i2 = g(i2, a2, c, f2, n[h3 + 15], 16, 530742520)),
            (c = m(
              c,
              (f2 = g(f2, i2, a2, c, n[h3 + 2], 23, -995338651)),
              i2,
              a2,
              n[h3],
              6,
              -198630844,
            )),
            (a2 = m(a2, c, f2, i2, n[h3 + 7], 10, 1126891415)),
            (i2 = m(i2, a2, c, f2, n[h3 + 14], 15, -1416354905)),
            (f2 = m(f2, i2, a2, c, n[h3 + 5], 21, -57434055)),
            (c = m(c, f2, i2, a2, n[h3 + 12], 6, 1700485571)),
            (a2 = m(a2, c, f2, i2, n[h3 + 3], 10, -1894986606)),
            (i2 = m(i2, a2, c, f2, n[h3 + 10], 15, -1051523)),
            (f2 = m(f2, i2, a2, c, n[h3 + 1], 21, -2054922799)),
            (c = m(c, f2, i2, a2, n[h3 + 8], 6, 1873313359)),
            (a2 = m(a2, c, f2, i2, n[h3 + 15], 10, -30611744)),
            (i2 = m(i2, a2, c, f2, n[h3 + 6], 15, -1560198380)),
            (f2 = m(f2, i2, a2, c, n[h3 + 13], 21, 1309151649)),
            (c = m(c, f2, i2, a2, n[h3 + 4], 6, -145523070)),
            (a2 = m(a2, c, f2, i2, n[h3 + 11], 10, -1120210379)),
            (i2 = m(i2, a2, c, f2, n[h3 + 2], 15, 718787259)),
            (f2 = m(f2, i2, a2, c, n[h3 + 9], 21, -343485551)),
            (c = d(c, r2)),
            (f2 = d(f2, e2)),
            (i2 = d(i2, o2)),
            (a2 = d(a2, u2)));
        return [c, f2, i2, a2];
      }
      function a(n) {
        for (var t2 = "", r2 = 32 * n.length, e2 = 0; e2 < r2; e2 += 8)
          t2 += String.fromCharCode((n[e2 >> 5] >>> (e2 % 32)) & 255);
        return t2;
      }
      function h2(n) {
        const t2 = [];
        for (t2[(n.length >> 2) - 1] = void 0, e2 = 0; e2 < t2.length; e2 += 1)
          t2[e2] = 0;
        for (var r2 = 8 * n.length, e2 = 0; e2 < r2; e2 += 8)
          t2[e2 >> 5] |= (255 & n.charCodeAt(e2 / 8)) << (e2 % 32);
        return t2;
      }
      function e(n) {
        for (
          var t2, r2 = "0123456789abcdef", e2 = "", o2 = 0;
          o2 < n.length;
          o2 += 1
        )
          ((t2 = n.charCodeAt(o2)),
            (e2 += r2.charAt((t2 >>> 4) & 15) + r2.charAt(15 & t2)));
        return e2;
      }
      function r(n) {
        return unescape(encodeURIComponent(n));
      }
      function o(n) {
        let t2;
        return a(i(h2((t2 = r(n))), 8 * t2.length));
      }
      function u(n, t2) {
        return (function (n2, t3) {
          let r2,
            e2,
            o2 = h2(n2),
            u2 = [],
            c = [];
          for (
            u2[15] = c[15] = void 0,
              16 < o2.length && (o2 = i(o2, 8 * n2.length)),
              r2 = 0;
            r2 < 16;
            r2 += 1
          )
            ((u2[r2] = 909522486 ^ o2[r2]), (c[r2] = 1549556828 ^ o2[r2]));
          return (
            (e2 = i(u2.concat(h2(t3)), 512 + 8 * t3.length)),
            a(i(c.concat(e2), 640))
          );
        })(r(n), r(t2));
      }
      function t(n, t2, r2) {
        return t2 ? (r2 ? u(t2, n) : e(u(t2, n))) : r2 ? o(n) : e(o(n));
      }
      return t(str);
    }
    /**
     * 渲染标题内容
     * @param {object} widget 组件对象
     * @param {string} icon 图标地址
     * @param {string} title 标题内容
     * @param {bool|color} color 字体的颜色（自定义背景时使用，默认系统）
     */
    async renderHeader(widget, icon, title, color = false) {
      const header = widget.addStack();
      header.centerAlignContent();
      try {
        const image = await this.$request.get(icon, "IMG");
        const _icon = header.addImage(image);
        _icon.imageSize = new Size(14, 14);
        _icon.cornerRadius = 4;
      } catch (e) {
        console.log(`[WidgetBase][renderHeader]`, e);
      }
      header.addSpacer(10);
      const _title = header.addText(title);
      if (color) _title.textColor = color;
      _title.textOpacity = 0.7;
      _title.font = Font.boldSystemFont(12);
      _title.lineLimit = 1;
      widget.addSpacer(15);
      return widget;
    }
    /**
     * @param message 描述内容
     * @param options 按钮
     * @returns {Promise<number>}
     */
    async generateAlert(message, options) {
      const alert = new Alert();
      alert.message = message;
      for (const option of options) {
        alert.addAction(option);
      }
      return await alert.presentAlert();
    }
    /**
     * 弹出一个通知
     * @param {string} title 通知标题
     * @param {string} body 通知内容
     * @param {string} url 点击后打开的URL
     */
    async notify(title, body, url2 = null, opts = {}) {
      let n = new Notification();
      n = Object.assign(n, opts);
      n.title = title;
      n.body = body;
      if (url2) n.openURL = url2;
      return await n.schedule();
    }
    /**
     * 给图片加一层半透明遮罩
     * @param {Image} img 要处理的图片
     * @param {string} color 遮罩背景颜色
     * @param {float} opacity 透明度
     */
    async shadowImage(img, color = "#000000", opacity = 0.7) {
      if (!img || !img.size) return img;
      if (opacity === 0) return img;
      const ctx = new DrawContext();
      ctx.size = img.size;
      ctx.drawImageInRect(
        img,
        new Rect(0, 0, img.size["width"], img.size["height"]),
      );
      ctx.setFillColor(new Color(color, opacity));
      ctx.fillRect(new Rect(0, 0, img.size["width"], img.size["height"]));
      return await ctx.getImage();
    }
    /**
     * 使用插件设置反序列化当前设置
     */
    deserializationCurrentSettings() {
      Object.keys(this.currentSettings).forEach((category) => {
        Object.keys(this.currentSettings[category]).forEach((key) => {
          if (
            this.settings.hasOwnProperty(category) &&
            this.settings[category].hasOwnProperty(key)
          ) {
            this.updateCurrentSettings(
              this.currentSettings[category][key],
              this.settings[category][key],
            );
          }
        });
      });
    }
    /**
     * 获取当前插件的设置
     * @param {boolean} json 是否为json格式
     */
    getSettings(json = true) {
      let res = json ? {} : "";
      let cache = "";
      if (Keychain.contains(this.SETTING_KEY)) {
        cache = Keychain.get(this.SETTING_KEY);
      }
      if (json) {
        try {
          res = JSON.parse(cache);
        } catch (e) {}
      } else {
        res = cache;
      }
      return res;
    }
    /**
     * 存储当前设置
     * @param {bool} notify 是否通知提示
     */
    saveSettings(notify = true) {
      const res =
        typeof this.settings === "object"
          ? JSON.stringify(this.settings)
          : String(this.settings);
      Keychain.set(this.SETTING_KEY, res);
      if (notify) this.notify("设置成功", "桌面组件稍后将自动刷新");
    }
    /**
     * 获取基础设置（个性化设置）
     * @param {boolean} json 是否为json格式
     */
    getBaseSettings(json = true) {
      let res = json ? {} : "";
      let cache = "";
      if (Keychain.contains(this.BaseCacheKey)) {
        cache = Keychain.get(this.BaseCacheKey);
      }
      if (json) {
        try {
          res = JSON.parse(cache);
        } catch (e) {}
      } else {
        res = cache;
      }
      return res;
    }
    /**
     * 存储基础设置（个性化设置）
     * @param {object} res 要保存的数据
     * @param {bool} notify 是否通知提示
     */
    saveBaseSettings(res = {}, notify = true) {
      const data2 = { ...(this.baseSettings || {}), ...res };
      this.baseSettings = data2;
      Keychain.set(this.BaseCacheKey, JSON.stringify(data2));
      if (notify) this.notify("设置成功", "通用设置需重新运行脚本生效");
      return data2;
    }
    /**
     * 返回当前的背景图片URL（优先透明背景，然后根据日夜模式）
     * @returns {string|null}
     */
    getBackgroundImage() {
      if (this.settings[this.BACKGROUND_TRANSPARENT_KEY]) {
        return this.settings[this.BACKGROUND_TRANSPARENT_KEY];
      }
      if (Device.isUsingDarkAppearance()) {
        return (
          this.settings[this.BACKGROUND_NIGHT_KEY] ||
          this.settings[this.BACKGROUND_DAY_KEY] ||
          null
        );
      }
      return this.settings[this.BACKGROUND_DAY_KEY] || null;
    }
    updateCurrentSettings(curSettingItem, stringVal) {
      const varType = curSettingItem.type || this.settingValTypeString;
      if (varType === this.settingValTypeString) {
        curSettingItem.val = String(stringVal);
      } else if (varType === this.stttingValTypeStringEmptyCheck) {
        curSettingItem.val = isEmpty2(stringVal) ? null : String(stringVal);
      } else if (varType === this.settingValTypeInt) {
        curSettingItem.val = parseInt(stringVal);
      } else if (varType === this.settingValTypeFloat) {
        curSettingItem.val = parseFloat(stringVal);
      } else if (varType === this.settingValTypeBool) {
        if (typeof stringVal === "boolean") {
          curSettingItem.val = stringVal;
        } else if (typeof stringVal === "string") {
          curSettingItem.val = stringVal === "true" || stringVal === "1";
        } else {
          curSettingItem.val = Boolean(stringVal);
        }
      } else if (varType === this.settingValTypeArray) {
        if (Array.isArray(stringVal)) {
          curSettingItem.val = stringVal;
        } else if (typeof stringVal === "string") {
          try {
            const parsed = JSON.parse(stringVal);
            curSettingItem.val = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            curSettingItem.val = [];
          }
        } else {
          curSettingItem.val = [];
        }
      }
      return curSettingItem.val;
    }
    syncCurrentSettings(category, key, value) {
      if (
        this.currentSettings &&
        this.currentSettings[category] &&
        this.currentSettings[category][key]
      ) {
        this.updateCurrentSettings(this.currentSettings[category][key], value);
      }
    }
    // 刷新主菜单头像区域（不依赖再次打开脚本）
    async getAvatarConfig() {
      this.baseSettings = this.getBaseSettings();
      const avatarConfig = {
        avatar: await this.loadSF2B64("person.crop.circle.fill", "#56A8D6", 60),
        [this.userConfigKeys[1]]: this.getUserConfig(this.userConfigKeys[1]),
        [this.userConfigKeys[2]]: this.getUserConfig(this.userConfigKeys[2]),
        [this.userConfigKeys[3]]: this.getUserConfig(this.userConfigKeys[3]),
      };
      const avatarValue = this.baseSettings.avatar || "";
      if (!avatarValue) return avatarConfig;
      const avatarImg = await this.getImageByUrl(
        avatarValue,
        this.globalStorage,
        "avatar",
      );
      if (avatarImg) {
        avatarConfig.avatar = `data:image/png;base64,${Data.fromPNG(avatarImg).toBase64String()}`;
      }
      return avatarConfig;
    }
    async refreshMainAvatar(previewWebView) {
      try {
        const avatarConfig = await this.getAvatarConfig();
        const js = `
                    (function() {
                        const avatarImg = document.querySelector('.form-label-author-avatar');
                        if (avatarImg) avatarImg.src = ${JSON.stringify(avatarConfig.avatar)};
                        const nameEl = document.getElementById(${JSON.stringify(this.userConfigKeys[1])});
                        if (nameEl) nameEl.textContent = ${JSON.stringify(avatarConfig[this.userConfigKeys[1]])};
                        const descEl = document.getElementById(${JSON.stringify(this.userConfigKeys[2])});
                        if (descEl) descEl.textContent = ${JSON.stringify(avatarConfig[this.userConfigKeys[2]])};
                        const linkEl = document.getElementById('avatarLink');
                        if (linkEl) linkEl.href = ${JSON.stringify(avatarConfig[this.userConfigKeys[3]])};
                    })();
                `;
        await previewWebView.evaluateJavaScript(js, false);
      } catch (e) {
        console.log(`[WidgetBase][refreshMainAvatar] error:`, e);
      }
    }
    resetCurrentSettingsToDefaults(settingsSource, clearSettings = false) {
      if (!this.currentSettings || !settingsSource) return;
      for (const category of Object.keys(settingsSource)) {
        const categorySettings = settingsSource[category];
        if (categorySettings && categorySettings.items) {
          if (clearSettings) {
            delete this.settings[category];
          }
          if (this.currentSettings[category]) {
            for (const item of categorySettings.items) {
              if (item.option) {
                for (const key of Object.keys(item.option)) {
                  if (this.currentSettings[category][key]) {
                    const defaultValue = item.option[key];
                    this.updateCurrentSettings(
                      this.currentSettings[category][key],
                      defaultValue,
                    );
                  }
                }
              }
            }
          }
        }
      }
    }
    getRandomArrayElements(arr, count) {
      let shuffled = arr.slice(0),
        i = arr.length,
        min = i - count,
        temp,
        index;
      min = min > 0 ? min : 0;
      while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
      }
      return shuffled.slice(min);
    }
    textFormat = {
      defaultText: { size: 14, font: "regular", color: this.widgetColor },
      battery: { size: 10, font: "bold", color: this.widgetColor },
      title: { size: 16, font: "semibold", color: this.widgetColor },
      SFMono: { size: 12, font: "SF Mono", color: this.widgetColor },
    };
    provideFont = (fontName, fontSize) => {
      const fontGenerator = {
        ultralight: function () {
          return Font.ultraLightSystemFont(fontSize);
        },
        light: function () {
          return Font.lightSystemFont(fontSize);
        },
        regular: function () {
          return Font.regularSystemFont(fontSize);
        },
        medium: function () {
          return Font.mediumSystemFont(fontSize);
        },
        semibold: function () {
          return Font.semiboldSystemFont(fontSize);
        },
        bold: function () {
          return Font.boldSystemFont(fontSize);
        },
        heavy: function () {
          return Font.heavySystemFont(fontSize);
        },
        black: function () {
          return Font.blackSystemFont(fontSize);
        },
        italic: function () {
          return Font.italicSystemFont(fontSize);
        },
      };
      const systemFont = fontGenerator[fontName];
      if (systemFont) {
        return systemFont();
      }
      return new Font(fontName, fontSize);
    };
    provideText = (string, container, format) => {
      const textItem = container.addText(string);
      const textFont = format.font;
      const textSize = format.size;
      const textColor = format.color;
      textItem.font = this.provideFont(textFont, textSize);
      textItem.textColor = textColor;
      return textItem;
    };
  }
  const Runing2 = async (Widget, default_args = "", isDebug = true, extra) => {
    let M = null;
    if (config.runsInWidget) {
      M = new Widget(args.widgetParameter || "");
      M.deserializationCurrentSettings();
      if (extra) {
        Object.keys(extra).forEach((key) => {
          M[key] = extra[key];
        });
      }
      const W = await M.render();
      try {
        if (M.settings.refreshAfterDate) {
          W.refreshAfterDate = new Date(
            /* @__PURE__ */ new Date().getTime() +
              1e3 * 60 * parseInt(M.settings.refreshAfterDate),
          );
        }
      } catch (e) {
        console.log(`[Runing]`, e);
      }
      if (W) {
        Script.setWidget(W);
        Script.complete();
      }
    } else {
      const { act, __arg, __size } = args.queryParameters;
      M = new Widget(__arg || default_args || "");
      M.deserializationCurrentSettings();
      if (extra) {
        Object.keys(extra).forEach((key) => {
          M[key] = extra[key];
        });
      }
      if (__size) M._init(__size);
      if (!act || !M["_actions"]) {
        let w;
        const onClick = async (item) => {
          M.widgetFamily = item.val;
          try {
            M._init(item.val);
          } catch (error) {
            console.log(`[Runing][onClick] Initialization error: ${error}`);
          }
          w = await M.render();
          if (w) {
            const fnc = item.val.charAt(0).toUpperCase() + item.val.slice(1);
            await w[`present${fnc}`]();
          }
        };
        const preview = [];
        if (M.renderSmall) {
          preview.push({
            type: "customPreview",
            title: "小尺寸",
            desc: "",
            config: { size: "small" },
            url: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/smallSize.png",
          });
        }
        if (M.renderMedium) {
          preview.push({
            type: "customPreview",
            title: "中尺寸",
            desc: "",
            config: { size: "medium" },
            url: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/mediumSize.png",
          });
        }
        if (M.renderLarge) {
          preview.push({
            type: "customPreview",
            title: "大尺寸",
            desc: "",
            config: { size: "large" },
            url: "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/largeSize.png",
          });
        }
        const lockView = [];
        if (M.renderAccessoryInline) {
          lockView.push({
            type: "customPreview",
            title: "锁屏列表",
            desc: "",
            config: { size: "accessoryInline" },
            icon: {
              color: "#4676EE",
              name: "list.triangle",
            },
          });
        }
        if (M.renderAccessoryRectangular) {
          lockView.push({
            type: "customPreview",
            title: "锁屏 2x",
            desc: "",
            config: { size: "accessoryRectangular" },
            icon: {
              color: "#4676EE",
              name: "arrow.rectanglepath",
            },
          });
        }
        if (M.renderAccessoryCircular) {
          lockView.push({
            type: "customPreview",
            title: "锁屏 1x",
            desc: "",
            config: { size: "accessoryCircular" },
            icon: {
              color: "#4676EE",
              name: "circle.circle",
            },
          });
        }
        M._settings = M._settings || {};
        if (preview.length > 0) {
          M._settings.previewSettings = {
            title: "预览组件",
            items: preview,
          };
        }
        if (lockView.length > 0) {
          M._settings.lockViewSettings = {
            title: "锁屏组件",
            items: lockView,
          };
        }
        const actions = M._actions || {};
        M._settings = M._settings || {};
        M._settings.commonSettings = {
          title: "通用设置",
          items: [],
        };
        if (typeof M.setWidgetConfig === "function") {
          M._settings.commonSettings.items.push({
            type: "custom",
            title: "基础设置",
            desc: "配置组件的基础参数",
            option: {},
            icon: { name: "gear", color: "#676767" },
            customId: "__base_config__",
          });
          M._actions = M._actions || {};
          M._actions["__base_config__"] = () => M.setWidgetConfig();
        }
        M._settings.commonSettings.items.push({
          type: "custom",
          title: "重载组件",
          desc: "重新打开当前脚本",
          option: {},
          icon: { name: "arrow.clockwise", color: "#1890ff" },
          customId: "__reload_script__",
        });
        M._actions = M._actions || {};
        M._actions["__reload_script__"] = () => M.reopenScript();
        M._settings.commonSettings.items.push({
          type: "custom",
          title: "清空脚本数据",
          desc: "该操作不可逆，会清空当前脚本的所有配置和背景图片",
          option: {},
          icon: { name: "trash", color: "#f5222d" },
          customId: "__reset_all__",
        });
        M._actions = M._actions || {};
        M._actions["__reset_all__"] = async () => {
          let w2;
          const opts = ["取消", "确定"];
          const msg =
            "确定要清空当前脚本的所有数据吗？该操作不可逆，脚本将自动重启";
          const idx = await M.generateAlert(msg, opts);
          if (idx === 1) {
            M.resetCurrentSettingsToDefaults(M._settings, false);
            M.settings = {};
            await M.clearAllBackgrounds();
            if (M.storage) {
              M.storage.clearAllStorage();
            }
            if (M.settingsStorage) {
              M.settingsStorage.clearAllStorage();
            }
            M.saveSettings(false);
            M.reopenScript();
          }
        };
        const menuSettings = {};
        if (M._settings.previewSettings) {
          menuSettings.previewSettings = M._settings.previewSettings;
        }
        if (M._settings.lockViewSettings) {
          menuSettings.lockViewSettings = M._settings.lockViewSettings;
        }
        if (
          M._settings.actionSettings &&
          M._settings.actionSettings.items &&
          M._settings.actionSettings.items.length > 0
        ) {
          menuSettings.actionSettings = M._settings.actionSettings;
        }
        if (M._settings.commonSettings) {
          menuSettings.commonSettings = M._settings.commonSettings;
        }
        const avatarConfig = await M.getAvatarConfig();
        const customHeadHtmlRender = async () => {
          return `
                        <div class="list">
                            <form class="list__body" action="javascript:void(0);">
                                <label id="userInfo" class="form-item-auth form-item--link">
                                    <div class="form-label">
                                        <a id="avatarLink" class="avatar-link" href="${avatarConfig[M.userConfigKeys[3]]}" target="_blank">
                                            <img class="form-label-author-avatar" src="${avatarConfig.avatar}"/>
                                        </a>
                                        <div>
                                            <div class="form-item-auth-name" id="${M.userConfigKeys[1]}">${avatarConfig[M.userConfigKeys[1]]}</div>
                                            <div class="form-item-auth-desc" id="${M.userConfigKeys[2]}">${avatarConfig[M.userConfigKeys[2]]}</div>
                                        </div>
                                    </div>
                                    <div id="userInfo_val" class="form-item-right-desc">
                                        <span class="desc-line">个性化设置</span>
                                    </div>
                                </label>
                            </form>
                        </div>
                    `;
        };
        const customActionHandler = async (code2, data2, previewWebView) => {
          if (code2.includes("customPreview")) {
            const sizeMatch = code2.match(/-(\w+)$/);
            const size = sizeMatch ? sizeMatch[1] : "small";
            M.widgetFamily = size;
            try {
              M._init(size);
            } catch (error) {
              console.log(
                `[Runing][customActionHandler] Initialization error: ${error}`,
              );
            }
            const w2 = await M.render();
            if (w2) {
              const fnc = size.charAt(0).toUpperCase() + size.slice(1);
              await w2[`present${fnc}`]();
            }
            return true;
          }
          if (code2.includes("customAction")) {
            const actionNameMatch = code2.match(/-([^-]+)$/);
            const actionName = actionNameMatch ? actionNameMatch[1] : null;
            if (actionName && actions[actionName]) {
              await actions[actionName]();
            }
            return true;
          }
          if (code2 && actions[code2]) {
            const result = await actions[code2](previewWebView);
            if (result === false) {
              return false;
            }
            return true;
          }
          if (code2 === "openUrl" && data2) {
            Safari.openInApp(data2, false);
            return true;
          }
          if (code2 === "refresh-avatar-on-resume") {
            return await M.getAvatarConfig();
          }
          if (code2 === "userInfo") {
            await M.setUserInfo();
            await M.refreshMainAvatar(previewWebView);
            return true;
          }
          return false;
        };
        await M.presentSettings(
          menuSettings,
          false,
          customHeadHtmlRender,
          null,
          customActionHandler,
        );
      }
    }
  };
  return {
    WidgetBase: WidgetBase2,
    Runing: Runing2,
  };
}
function createStorageRuntime(deps2) {
  const { fm: fm2, hash: hash2, isHttpUrl: isHttpUrl2 } = deps2;
  function setStorageDirectory(dirPath) {
    return {
      setStorage(key, value) {
        const hashKey = hash2(key);
        const filePath = FileManager.local().joinPath(dirPath, hashKey);
        if (value instanceof Image) {
          FileManager.local().writeImage(filePath, value);
          return;
        }
        if (value instanceof Data) {
          FileManager.local().write(filePath, value);
        }
        Keychain.set(hashKey, JSON.stringify(value));
      },
      getStorage(key) {
        const hashKey = hash2(key);
        const filePath = FileManager.local().joinPath(
          FileManager.local().libraryDirectory(),
          hashKey,
        );
        if (FileManager.local().fileExists(filePath)) {
          const image = Image.fromFile(filePath);
          const file = Data.fromFile(filePath);
          return image ? image : file ? file : null;
        }
        if (Keychain.contains(hashKey)) {
          return JSON.parse(Keychain.get(hashKey));
        } else {
          return null;
        }
      },
      removeStorage(key) {
        const hashKey = hash2(key);
        const filePath = FileManager.local().joinPath(
          FileManager.local().libraryDirectory(),
          hashKey,
        );
        if (FileManager.local().fileExists(filePath)) {
          FileManager.local().remove(hashKey);
        }
        if (Keychain.contains(hashKey)) {
          Keychain.remove(hashKey);
        }
      },
      getStorageAt(key) {
        const hashKey = hash2(key);
        const filePath = FileManager.local().joinPath(
          FileManager.local().libraryDirectory(),
          hashKey,
        );
        return FileManager.local().creationDate(filePath);
      },
    };
  }
  const setStorage2 = setStorageDirectory(fm2().libraryDirectory()).setStorage;
  const getStorage2 = setStorageDirectory(
    FileManager.local().libraryDirectory(),
  ).getStorage;
  const getStorageAt2 = setStorageDirectory(
    FileManager.local().libraryDirectory(),
  ).getStorageAt;
  const removeStorage2 = setStorageDirectory(
    FileManager.local().libraryDirectory(),
  ).removeStorage;
  const setCache2 = setStorageDirectory(
    FileManager.local().temporaryDirectory(),
  ).setStorage;
  const getCache2 = setStorageDirectory(
    FileManager.local().temporaryDirectory(),
  ).getStorage;
  const getCacheAt2 = setStorageDirectory(
    FileManager.local().temporaryDirectory(),
  ).getStorageAt;
  const removeCache2 = setStorageDirectory(
    FileManager.local().temporaryDirectory(),
  ).removeStorage;
  class Storage2 {
    constructor(namespace, expirationMinutes = 30, useICloud = true) {
      this._nameSpace = namespace || `${MODULE.filename}`;
      this._expirationMinutes = expirationMinutes;
      this._cacheTimeMap = /* @__PURE__ */ new Map();
      this._fm = useICloud ? FileManager.iCloud() : FileManager.local();
      const baseStoragePath = this._fm.joinPath(
        this._fm.documentsDirectory(),
        "storage",
      );
      const namespacePath = namespace
        ? this._fm.joinPath(baseStoragePath, namespace)
        : baseStoragePath;
      this._imagesPath = this._fm.joinPath(namespacePath, "images");
      this._dataPath = this._fm.joinPath(namespacePath, "datas");
      this._urlMapPath = this._fm.joinPath(namespacePath, "url-map.json");
      if (!this._fm.fileExists(this._imagesPath)) {
        this._fm.createDirectory(this._imagesPath, true);
      }
      if (!this._fm.fileExists(this._dataPath)) {
        this._fm.createDirectory(this._dataPath, true);
      }
      this._urlMap = this._loadUrlMap();
    }
    _loadUrlMap() {
      if (this._fm.fileExists(this._urlMapPath)) {
        try {
          const data2 = this._fm.readString(this._urlMapPath);
          return JSON.parse(data2);
        } catch (e) {
          console.error(
            `[Storage][_loadUrlMap] Failed to load URL mapping: ${e}`,
          );
          return {};
        }
      }
      return {};
    }
    _saveUrlMap() {
      try {
        this._fm.writeString(
          this._urlMapPath,
          JSON.stringify(this._urlMap, null, 2),
        );
      } catch (e) {
        console.error(
          `[Storage][_saveUrlMap] Failed to save URL mapping: ${e}`,
        );
      }
    }
    setCache(key, value) {
      const fullKey = `${this._nameSpace}${key}`;
      this._cacheTimeMap[hash2(fullKey)] = /* @__PURE__ */ new Date();
      setCache2(fullKey, value);
    }
    getCache(key, expirationMinutes) {
      const fullKey = `${this._nameSpace}${key}`;
      if (
        expirationMinutes !== void 0 &&
        expirationMinutes !== null &&
        expirationMinutes !== -1
      ) {
        if (expirationMinutes === 0) {
          return null;
        }
        const createdAt =
          getCacheAt2(fullKey) || this._cacheTimeMap[hash2(fullKey)];
        if (
          !createdAt ||
          /* @__PURE__ */ new Date().getTime() - new Date(createdAt).getTime() >
            expirationMinutes * 6e4
        ) {
          removeCache2(fullKey);
          return null;
        }
      }
      return getCache2(fullKey);
    }
    getCacheTime(key) {
      const fullKey = `${this._nameSpace}${key}`;
      return getCacheAt2(fullKey) || this._cacheTimeMap[hash2(fullKey)] || null;
    }
    removeCache(key) {
      removeCache2(`${this._nameSpace}${key}`);
    }
    setStorage(key, value) {
      const fullKey = `${this._nameSpace}${key}`;
      setStorage2(fullKey, value);
      if (this._expirationMinutes) {
        this._cacheTimeMap[hash2(fullKey)] = /* @__PURE__ */ new Date();
      }
    }
    getStorage(key, expirationMinutes, isDelStorageWhenTimeExceed) {
      const fullKey = `${this._nameSpace}${key}`;
      if (
        expirationMinutes !== void 0 &&
        expirationMinutes !== null &&
        expirationMinutes !== -1
      ) {
        if (expirationMinutes === 0) {
          return null;
        }
        const createdAt =
          getStorageAt2(fullKey) || this._cacheTimeMap[hash2(fullKey)];
        if (
          !createdAt ||
          /* @__PURE__ */ new Date().getTime() - new Date(createdAt).getTime() >
            expirationMinutes * 6e4
        ) {
          if (isDelStorageWhenTimeExceed) {
            removeStorage2(fullKey);
          }
          return null;
        }
      }
      return getStorage2(fullKey);
    }
    getStorageTime(key) {
      const fullKey = `${this._nameSpace}${key}`;
      return (
        getStorageAt2(fullKey) || this._cacheTimeMap[hash2(fullKey)] || null
      );
    }
    removeStorage(key) {
      removeStorage2(`${this._nameSpace}${key}`);
    }
    clearAllStorage() {
      try {
        const baseStoragePath = this._fm.joinPath(
          this._fm.documentsDirectory(),
          "storage",
        );
        const namespacePath = this._nameSpace
          ? this._fm.joinPath(baseStoragePath, this._nameSpace)
          : baseStoragePath;
        if (this._fm.fileExists(namespacePath)) {
          this._fm.remove(namespacePath);
          console.log(`[Storage] 已清空目录: ${namespacePath}`);
        }
        this._cacheTimeMap.clear();
        this._urlMap = {};
      } catch (e) {
        console.error(`[Storage][clearAllStorage] 清空失败: ${e}`);
      }
    }
    _getBase64Signature(base64Data) {
      const len = base64Data.length;
      const head = base64Data.substring(0, Math.min(16, len));
      const tail = len > 16 ? base64Data.substring(len - 16) : "";
      const signatureStr = `${len}_${head}_${tail}`;
      let h2 = 0;
      for (let i = 0; i < signatureStr.length; i++) {
        h2 = ((h2 << 5) - h2 + signatureStr.charCodeAt(i)) | 0;
      }
      return `${len}_${Math.abs(h2).toString(36)}`;
    }
    _getFileName(key, isWrite = false) {
      if (isHttpUrl2(key)) {
        const urlPath = key.split("?")[0];
        if (this._urlMap[urlPath]) {
          return this._urlMap[urlPath];
        }
        const originalName = urlPath.split("/").pop() || "file";
        if (!isWrite) {
          return originalName;
        }
        let fileName = originalName;
        const nameParts = originalName.split(".");
        const ext = nameParts.length > 1 ? nameParts.pop() : "";
        const baseName = nameParts.join(".");
        const existingUrls = Object.keys(this._urlMap);
        const existingFileNames = Object.values(this._urlMap);
        let counter = 1;
        while (existingFileNames.includes(fileName)) {
          fileName = ext
            ? `${baseName}_${counter}.${ext}`
            : `${baseName}_${counter}`;
          counter++;
        }
        this._urlMap[urlPath] = fileName;
        this._saveUrlMap();
        return fileName;
      }
      if (key.startsWith("base64:")) {
        const parts = key.substring(7).split(":");
        const dataSignature = parts[0];
        const cacheKey = parts[1] || "base64_image";
        const mapKey = `base64:${dataSignature}`;
        if (this._urlMap[mapKey]) {
          const existingFileName = this._urlMap[mapKey];
          const expectedPrefix =
            (cacheKey.includes(".") ? cacheKey.split(".")[0] : cacheKey) + "_";
          if (!existingFileName.startsWith(expectedPrefix)) {
            throw new Error(
              `Base64 签名冲突！签名 [${dataSignature}] 已被文件 [${existingFileName}] 占用。请为当前图片使用不同的 cacheKey（当前: ${cacheKey}）`,
            );
          }
          return existingFileName;
        }
        if (!isWrite) {
          return cacheKey;
        }
        const signatureSuffix = dataSignature.split("_")[1] || dataSignature;
        const originalName = cacheKey.includes(".")
          ? cacheKey
          : `${cacheKey}.png`;
        const nameParts = originalName.split(".");
        const ext = nameParts.pop();
        const baseName = nameParts.join(".");
        let fileName = `${baseName}_${signatureSuffix}.${ext}`;
        const existingFileNames = Object.values(this._urlMap);
        let counter = 1;
        while (existingFileNames.includes(fileName)) {
          fileName = `${baseName}_${signatureSuffix}_${counter}.${ext}`;
          counter++;
        }
        this._urlMap[mapKey] = fileName;
        this._saveUrlMap();
        return fileName;
      }
      return key || "file";
    }
    _getFilePath(key, useImagesPath = false) {
      const fileName = this._getFileName(key);
      const basePath = useImagesPath ? this._imagesPath : this._dataPath;
      return this._fm.joinPath(basePath, fileName);
    }
    _getImageExtRegex() {
      return /\.(png|jpg|jpeg|gif|webp|bmp|ico|tiff|tif|heic|heif)$/i;
    }
    _hasImageExtension(fileName) {
      return this._getImageExtRegex().test(fileName);
    }
    _isImageFile(fileName) {
      return (
        this._hasImageExtension(fileName) || fileName.endsWith(".base64img")
      );
    }
    setFile(key, value) {
      const isImageValue =
        value instanceof Image ||
        (typeof value === "string" && value.startsWith("data:image"));
      const fileName = this._getFileName(key, true);
      const isImageFile = this._isImageFile(fileName);
      const isImage = isImageValue || isImageFile;
      const basePath = isImage ? this._imagesPath : this._dataPath;
      let filePath = this._fm.joinPath(basePath, fileName);
      try {
        if (value instanceof Image) {
          if (!this._hasImageExtension(filePath)) {
            filePath = filePath + ".png";
          }
          this._fm.writeImage(filePath, value);
        } else if (value instanceof Data) {
          this._fm.write(filePath, value);
        } else {
          const str = typeof value === "string" ? value : JSON.stringify(value);
          if (str.startsWith("data:image")) {
            filePath =
              filePath.replace(this._getImageExtRegex(), "") + ".base64img";
          }
          const data2 = Data.fromString(str);
          this._fm.write(filePath, data2);
        }
      } catch (e) {
        console.error(`[Storage][setFile] Storage setFile error: ${e}`);
      }
    }
    async getFile(key, useCache = true, logable = true) {
      const isUrl = isHttpUrl2(key);
      const urlPath = isUrl ? key.split("?")[0] : key;
      const fileName = this._getFileName(urlPath);
      const isImage = this._isImageFile(fileName);
      const basePath = isImage ? this._imagesPath : this._dataPath;
      const filePath = this._fm.joinPath(basePath, fileName);
      if (useCache) {
        if (this._fm.fileExists(filePath)) {
          try {
            if (logable)
              console.log(
                `[Storage][getFile] Using cached ${isImage ? "image" : "file"}: ${fileName}`,
              );
            return isImage ? Image.fromFile(filePath) : this._fm.read(filePath);
          } catch (e) {
            console.error(`[Storage][getFile] Storage getFile error: ${e}`);
          }
        }
        if (isImage && !this._hasImageExtension(fileName)) {
          const filePathWithExt = filePath + ".png";
          if (this._fm.fileExists(filePathWithExt)) {
            try {
              if (logable)
                console.log(
                  `[Storage][getFile] Using cached image: ${fileName}.png`,
                );
              return Image.fromFile(filePathWithExt);
            } catch (e) {
              console.error(`[Storage][getFile] Storage getFile error: ${e}`);
            }
          }
        }
        if (!isImage) {
          const base64Path =
            filePath.replace(this._getImageExtRegex(), "") + ".base64img";
          if (this._fm.fileExists(base64Path)) {
            try {
              if (logable)
                console.log(
                  `[Storage][getFile] Using cached base64 image: ${fileName}`,
                );
              return this._fm.read(base64Path);
            } catch (e) {
              console.error(`[Storage][getFile] Storage getFile error: ${e}`);
            }
          }
        }
        if (!isImage && !isUrl) {
          const imageFilePath = this._fm.joinPath(this._imagesPath, fileName);
          if (this._fm.fileExists(imageFilePath)) {
            try {
              if (logable)
                console.log(
                  `[Storage][getFile] Using cached image: ${fileName}`,
                );
              return Image.fromFile(imageFilePath);
            } catch (e) {
              console.error(`[Storage][getFile] Storage getFile error: ${e}`);
            }
          }
          const imageFilePathWithExt = imageFilePath + ".png";
          if (this._fm.fileExists(imageFilePathWithExt)) {
            try {
              if (logable)
                console.log(
                  `[Storage][getFile] Using cached image: ${fileName}.png`,
                );
              return Image.fromFile(imageFilePathWithExt);
            } catch (e) {
              console.error(`[Storage][getFile] Storage getFile error: ${e}`);
            }
          }
        }
      }
      if (!isUrl) {
        return null;
      }
      try {
        if (logable)
          console.log(
            `[Storage][getFile] Downloading ${isImage ? "image" : "file"} online: ${fileName}`,
          );
        const req = new Request(key);
        if (isImage) {
          const imgData = await req.load();
          if (fileName.toLowerCase().endsWith(".svg")) {
            if (logable)
              console.error(
                `[Storage][getFile] SVG format not supported: ${fileName}`,
              );
            return null;
          }
          try {
            const img = Image.fromData(imgData);
            if (img) {
              this.setFile(urlPath, img);
              return img;
            }
          } catch (e) {
            console.error(`[Storage][getFile] Image.fromData failed: ${e}`);
          }
          return null;
        } else {
          const data2 = await req.load();
          this.setFile(urlPath, data2);
          return data2;
        }
      } catch (e) {
        console.error(`[Storage][getFile] File download failed: ${e}`);
        if (useCache) {
          if (this._fm.fileExists(filePath)) {
            try {
              if (logable)
                console.log(
                  `[Storage][getFile] Using cached ${isImage ? "image" : "file"}: ${fileName}`,
                );
              return isImage
                ? Image.fromFile(filePath)
                : this._fm.read(filePath);
            } catch (e2) {
              console.error(`[Storage][getFile] Storage getFile error: ${e2}`);
            }
          }
        }
        throw e;
      }
    }
    removeFile(key, useImagesPath = false) {
      const isUrl = isHttpUrl2(key);
      const urlPath = isUrl ? key.split("?")[0] : key;
      const fileName = this._getFileName(urlPath);
      const basePath = useImagesPath ? this._imagesPath : this._dataPath;
      const filePath = this._fm.joinPath(basePath, fileName);
      let removed = false;
      if (this._fm.fileExists(filePath)) {
        try {
          this._fm.remove(filePath);
          removed = true;
        } catch (e) {
          console.error(`[Storage][removeFile] Storage removeFile error: ${e}`);
        }
      }
      if (!this._hasImageExtension(fileName)) {
        const filePathWithExt = filePath + ".png";
        if (this._fm.fileExists(filePathWithExt)) {
          try {
            this._fm.remove(filePathWithExt);
            removed = true;
          } catch (e) {
            console.error(
              `[Storage][removeFile] Storage removeFile error: ${e}`,
            );
          }
        }
      }
      const base64Path =
        filePath.replace(this._getImageExtRegex(), "") + ".base64img";
      if (this._fm.fileExists(base64Path)) {
        try {
          this._fm.remove(base64Path);
          removed = true;
        } catch (e) {
          console.error(`[Storage][removeFile] Storage removeFile error: ${e}`);
        }
      }
      if (removed && isUrl && this._urlMap[urlPath]) {
        delete this._urlMap[urlPath];
        this._saveUrlMap();
      }
      return removed;
    }
    async getImage(
      key,
      returnImage = false,
      useCache = true,
      logable = true,
      cacheKey = null,
    ) {
      const isUrl = isHttpUrl2(key);
      const isBase64 = key.startsWith("data:image");
      const urlPath = isUrl ? key.split("?")[0] : key;
      const fileName = this._getFileName(urlPath);
      if (isBase64) {
        const imageFormat = key.split(";")[0].split("/")[1] || "png";
        if (!cacheKey) {
          try {
            const base64Data = key.split(",")[1];
            const imgData = Data.fromBase64String(base64Data);
            const img = Image.fromData(imgData);
            if (logable)
              console.log(
                `[Storage][getImage] Converting base64 image (no cache)`,
              );
            return returnImage
              ? img
              : this.imageToBase64(img, `temp.${imageFormat}`);
          } catch (e) {
            console.error(
              `[Storage][getImage] Base64 image conversion failed: ${e}`,
            );
            return null;
          }
        }
        try {
          const base64Data = key.split(",")[1];
          const dataSignature = this._getBase64Signature(base64Data);
          const finalCacheKey = cacheKey.includes(".")
            ? cacheKey
            : `${cacheKey}.${imageFormat}`;
          const base64Key = `base64:${dataSignature}:${finalCacheKey}`;
          if (useCache) {
            const cachedData = await this.getFile(base64Key, true, false);
            if (cachedData) {
              if (logable)
                console.log(
                  `[Storage][getImage] Using cached base64 image: ${finalCacheKey}`,
                );
              try {
                const img2 =
                  cachedData instanceof Image
                    ? cachedData
                    : Image.fromData(cachedData);
                return returnImage
                  ? img2
                  : this.imageToBase64(img2, finalCacheKey);
              } catch (e) {
                console.error(
                  `[Storage][getImage] Base64 cache conversion failed: ${e}`,
                );
              }
            }
          }
          const imgData = Data.fromBase64String(base64Data);
          const img = Image.fromData(imgData);
          this.setFile(base64Key, img);
          if (logable)
            console.log(
              `[Storage][getImage] Converted and cached base64 image: ${finalCacheKey} [${dataSignature}]`,
            );
          return returnImage ? img : this.imageToBase64(img, finalCacheKey);
        } catch (e) {
          console.error(
            `[Storage][getImage] Base64 image conversion failed: ${e}`,
          );
          return null;
        }
      }
      if (useCache) {
        const cachedData = await this.getFile(key, true, false);
        if (cachedData) {
          if (logable)
            console.log(`[Storage][getImage] Using cache: ${fileName}`);
          try {
            const img =
              cachedData instanceof Image
                ? cachedData
                : Image.fromData(cachedData);
            return returnImage
              ? img
              : this.imageToBase64(img, fileName + ".png");
          } catch (e) {
            console.error(
              `[Storage][getImage] Cached image conversion failed: ${e}`,
            );
          }
        }
      }
      if (!isUrl) {
        return null;
      }
      try {
        if (logable)
          console.log(`[Storage][getImage] Online request: ${fileName}`);
        const img = await this.getFile(key, false, false);
        if (!img) {
          if (logable)
            console.log(
              `[Storage][getImage] Image download failed, returning null: ${fileName}`,
            );
          return null;
        }
        return returnImage ? img : this.imageToBase64(img, fileName);
      } catch (e) {
        console.error(`[Storage][getImage] Image loading failed: ${e}`);
        const cachedData = await this.getFile(key, true, false);
        if (cachedData) {
          if (logable)
            console.log(`[Storage][getImage] Using cached image: ${fileName}`);
          try {
            const img =
              cachedData instanceof Image
                ? cachedData
                : Image.fromData(cachedData);
            return returnImage ? img : this.imageToBase64(img, fileName);
          } catch (e2) {
            console.error(
              `[Storage][getImage] Cached image conversion failed: ${e2}`,
            );
          }
        }
        if (logable)
          console.log(
            `[Storage][getImage] Image loading completely failed, no cache available: ${fileName}`,
          );
        return null;
      }
    }
    deleteImage(imageUrl) {
      const result = this.removeFile(imageUrl, true);
      if (result) {
        const urlPath = imageUrl.split("?")[0];
        const fileName = urlPath.split("/").pop() || "icon.png";
        console.log(`[Storage][deleteImage] Deleted icon cache: ${fileName}`);
      }
      return result;
    }
    imageToBase64(img, fileName) {
      const ext = fileName.split(".").pop().toLowerCase();
      if (ext === "png") {
        return `data:image/png;base64,${Data.fromPNG(img).toBase64String()}`;
      } else if (ext === "jpg" || ext === "jpeg") {
        return `data:image/jpeg;base64,${Data.fromJPEG(img).toBase64String()}`;
      } else {
        return `data:image/png;base64,${Data.fromPNG(img).toBase64String()}`;
      }
    }
  }
  return {
    Storage: Storage2,
    setStorage: setStorage2,
    getStorage: getStorage2,
    getStorageAt: getStorageAt2,
    removeStorage: removeStorage2,
    setCache: setCache2,
    getCache: getCache2,
    getCacheAt: getCacheAt2,
    removeCache: removeCache2,
  };
}
const {
  Storage,
  setStorage,
  getStorage,
  getStorageAt,
  removeStorage,
  setCache,
  getCache,
  getCacheAt,
  removeCache,
} = createStorageRuntime({
  fm,
  hash,
  isHttpUrl,
});
globalStorage = new Storage("", -1, isInICloud());
const { WidgetBase, Runing } = createWidgetBaseRuntime({
  DEFAULT_TRUNCATE_LENGTH,
  Storage,
  globalStorage,
  isInICloud,
  isHttpUrl,
  isEmpty,
  hash,
});
function createStackUI(deps2) {
  const {
    URLSchemeFrom: URLSchemeFrom2,
    drawTextWithCustomFont: drawTextWithCustomFont2,
    hash: hash2,
    getStorage: getStorage2,
    setStorage: setStorage2,
    getCache: getCache2,
    setCache: setCache2,
    removeCache: removeCache2,
  } = deps2;
  class GenrateView2 {
    static listWidget;
    static setListWidget(listWidget2) {
      this.listWidget = listWidget2;
    }
    static async wbox(props, ...children) {
      const { background, spacing, href, updateDate, padding, onClick } = props;
      try {
        isDefined(background) &&
          (await setBackground(this.listWidget, background));
        isDefined(spacing) && (this.listWidget.spacing = spacing);
        isDefined(href) && (this.listWidget.url = href);
        isDefined(updateDate) &&
          (this.listWidget.refreshAfterDate = updateDate);
        isDefined(padding) && this.listWidget.setPadding(...padding);
        isDefined(onClick) && runOnClick(this.listWidget, onClick);
        await addChildren(this.listWidget, children);
      } catch (err) {
        console.error(`[GenrateView][wbox]`, err);
      }
      return this.listWidget;
    }
    static wstack(props, ...children) {
      return async (parentInstance) => {
        const widgetStack = parentInstance.addStack();
        const {
          background,
          spacing,
          padding,
          width = 0,
          height = 0,
          borderRadius,
          borderWidth,
          borderColor,
          href,
          verticalAlign,
          flexDirection,
          onClick,
        } = props;
        try {
          isDefined(background) &&
            (await setBackground(widgetStack, background));
          isDefined(spacing) && (widgetStack.spacing = spacing);
          isDefined(padding) && widgetStack.setPadding(...padding);
          isDefined(borderRadius) && (widgetStack.cornerRadius = borderRadius);
          isDefined(borderWidth) && (widgetStack.borderWidth = borderWidth);
          isDefined(borderColor) &&
            (widgetStack.borderColor = getColor(borderColor));
          isDefined(href) && (widgetStack.url = href);
          widgetStack.size = new Size(width, height);
          const verticalAlignMap = {
            bottom: () => widgetStack.bottomAlignContent(),
            center: () => widgetStack.centerAlignContent(),
            top: () => widgetStack.topAlignContent(),
          };
          isDefined(verticalAlign) && verticalAlignMap[verticalAlign]();
          const flexDirectionMap = {
            row: () => widgetStack.layoutHorizontally(),
            column: () => widgetStack.layoutVertically(),
          };
          isDefined(flexDirection) && flexDirectionMap[flexDirection]();
          isDefined(onClick) && runOnClick(widgetStack, onClick);
        } catch (err) {
          console.error(`[GenrateView][wstack]`, err);
        }
        await addChildren(widgetStack, children);
      };
    }
    static wimage(props) {
      return async (parentInstance) => {
        const {
          src,
          href,
          resizable,
          width = 0,
          height = 0,
          opacity,
          borderRadius,
          borderWidth,
          borderColor,
          containerRelativeShape,
          filter,
          imageAlign,
          mode,
          onClick,
        } = props;
        let _image = src;
        if (typeof src === "string") {
          if (isUrlImgBase64(src)) {
            _image = await new Request(src).loadImage();
          } else if (isUrl(src)) {
            _image = await getImage({ url: src });
          } else if (!isUrl(src)) {
            _image = SFSymbol.named(src).image;
          }
        } else if (
          src &&
          typeof src === "object" &&
          src.size &&
          typeof src.size.width === "number"
        ) {
          _image = src;
        } else if (src && typeof src === "object" && src.url && src.text) {
          _image = await drawTextWithCustomFont2(
            src.url,
            src.text,
            src.size,
            src.textColor,
          );
        }
        const widgetImage = parentInstance.addImage(_image);
        widgetImage.image = _image;
        try {
          isDefined(href) && (widgetImage.url = href);
          isDefined(resizable) && (widgetImage.resizable = resizable);
          widgetImage.imageSize = new Size(width, height);
          isDefined(opacity) && (widgetImage.imageOpacity = opacity);
          isDefined(borderRadius) && (widgetImage.cornerRadius = borderRadius);
          isDefined(borderWidth) && (widgetImage.borderWidth = borderWidth);
          isDefined(borderColor) &&
            (widgetImage.borderColor = getColor(borderColor));
          isDefined(containerRelativeShape) &&
            (widgetImage.containerRelativeShape = containerRelativeShape);
          isDefined(filter) && (widgetImage.tintColor = getColor(filter));
          const imageAlignMap = {
            left: () => widgetImage.leftAlignImage(),
            center: () => widgetImage.centerAlignImage(),
            right: () => widgetImage.rightAlignImage(),
          };
          isDefined(imageAlign) && imageAlignMap[imageAlign]();
          const modeMap = {
            fit: () => widgetImage.applyFittingContentMode(),
            fill: () => widgetImage.applyFillingContentMode(),
          };
          isDefined(mode) && modeMap[mode]();
          isDefined(onClick) && runOnClick(widgetImage, onClick);
        } catch (err) {
          console.error(`[GenrateView][wimage]`, err);
        }
      };
    }
    static wspacer(props) {
      return async (parentInstance) => {
        const widgetSpacer = parentInstance.addSpacer();
        const { length } = props;
        try {
          isDefined(length) && (widgetSpacer.length = length);
        } catch (err) {
          console.error(`[GenrateView][wspacer]`, err);
        }
      };
    }
    static wtext(props, ...children) {
      return async (parentInstance) => {
        const widgetText = parentInstance.addText("");
        const {
          textColor,
          font,
          opacity,
          maxLine,
          scale,
          shadowColor,
          shadowRadius,
          shadowOffset,
          href,
          textAlign,
          onClick,
        } = props;
        if (children && Array.isArray(children)) {
          widgetText.text = children.join("");
        }
        try {
          isDefined(textColor) && (widgetText.textColor = getColor(textColor));
          isDefined(font) &&
            (widgetText.font =
              typeof font === "number" ? Font.systemFont(font) : font);
          isDefined(opacity) && (widgetText.textOpacity = opacity);
          isDefined(maxLine) && (widgetText.lineLimit = maxLine);
          isDefined(scale) && (widgetText.minimumScaleFactor = scale);
          isDefined(shadowColor) &&
            (widgetText.shadowColor = getColor(shadowColor));
          isDefined(shadowRadius) && (widgetText.shadowRadius = shadowRadius);
          isDefined(shadowOffset) && (widgetText.shadowOffset = shadowOffset);
          isDefined(href) && (widgetText.url = href);
          const textAlignMap = {
            left: () => widgetText.leftAlignText(),
            center: () => widgetText.centerAlignText(),
            right: () => widgetText.rightAlignText(),
          };
          if (isDefined(textAlign)) {
            textAlignMap[textAlign]?.();
            widgetText.textAlign = textAlign;
          }
          isDefined(onClick) && runOnClick(widgetText, onClick);
        } catch (err) {
          console.error(`[GenrateView][wtext]`, err);
        }
      };
    }
    static wdate(props) {
      return async (parentInstance) => {
        const widgetDate = parentInstance.addDate(/* @__PURE__ */ new Date());
        const {
          date,
          mode,
          textColor,
          font,
          opacity,
          maxLine,
          scale,
          shadowColor,
          shadowRadius,
          shadowOffset,
          href,
          textAlign,
          onClick,
        } = props;
        try {
          isDefined(date) && (widgetDate.date = date);
          isDefined(textColor) && (widgetDate.textColor = getColor(textColor));
          isDefined(font) &&
            (widgetDate.font =
              typeof font === "number" ? Font.systemFont(font) : font);
          isDefined(opacity) && (widgetDate.textOpacity = opacity);
          isDefined(maxLine) && (widgetDate.lineLimit = maxLine);
          isDefined(scale) && (widgetDate.minimumScaleFactor = scale);
          isDefined(shadowColor) &&
            (widgetDate.shadowColor = getColor(shadowColor));
          isDefined(shadowRadius) && (widgetDate.shadowRadius = shadowRadius);
          isDefined(shadowOffset) && (widgetDate.shadowOffset = shadowOffset);
          isDefined(href) && (widgetDate.url = href);
          const modeMap = {
            time: () => widgetDate.applyTimeStyle(),
            date: () => widgetDate.applyDateStyle(),
            relative: () => widgetDate.applyRelativeStyle(),
            offset: () => widgetDate.applyOffsetStyle(),
            timer: () => widgetDate.applyTimerStyle(),
          };
          isDefined(mode) && modeMap[mode]();
          const textAlignMap = {
            left: () => widgetDate.leftAlignText(),
            center: () => widgetDate.centerAlignText(),
            right: () => widgetDate.rightAlignText(),
          };
          if (isDefined(textAlign)) {
            textAlignMap[textAlign]?.();
            widgetDate.textAlign = textAlign;
          }
          isDefined(onClick) && runOnClick(widgetDate, onClick);
        } catch (err) {
          console.error(`[GenrateView][wdate]`, err);
        }
      };
    }
  }
  function h2(type, props, ...children) {
    props = props || {};
    const _children = flatteningArr(children);
    switch (type) {
      case "wbox":
        return GenrateView2.wbox(props, ..._children);
      case "wdate":
        return GenrateView2.wdate(props);
      case "wimage":
        return GenrateView2.wimage(props);
      case "wspacer":
        return GenrateView2.wspacer(props);
      case "wstack":
        return GenrateView2.wstack(props, ..._children);
      case "wtext":
        return GenrateView2.wtext(props, ..._children);
      default:
        return type instanceof Function
          ? type({ children: _children, ...props })
          : null;
    }
  }
  function flatteningArr(arr) {
    return [].concat(
      ...arr.map((item) => {
        return Array.isArray(item) ? flatteningArr(item) : item;
      }),
    );
  }
  function getColor(color) {
    return typeof color === "string" ? new Color(color, 1) : color;
  }
  async function getBackground(bg) {
    bg =
      (typeof bg === "string" && !isUrl(bg)) || bg instanceof Color
        ? getColor(bg)
        : bg;
    if (typeof bg === "string") {
      bg = await getImage({ url: bg });
    }
    return bg;
  }
  async function setBackground(widget, bg) {
    const _bg = await getBackground(bg);
    if (_bg instanceof Color) {
      widget.backgroundColor = _bg;
    }
    if (_bg instanceof Image) {
      widget.backgroundImage = _bg;
    }
    if (_bg instanceof LinearGradient) {
      widget.backgroundGradient = _bg;
    }
  }
  async function addChildren(instance, children) {
    if (children && Array.isArray(children)) {
      for (const child of children) {
        child instanceof Function ? await child(instance) : "";
      }
    }
  }
  function isDefined(value) {
    if (typeof value === "number" && !isNaN(value)) {
      return true;
    }
    return value !== void 0 && value !== null;
  }
  function isUrl(value) {
    const reg = /^(http|https)\:\/\/[\w\W]+/;
    return reg.test(value);
  }
  function isUrlImgBase64(value) {
    const reg =
      /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i;
    return reg.test(value);
  }
  function runOnClick(instance, onClick) {
    const _eventId = hash2(onClick.toString());
    instance.url = `${URLScheme.forRunningScript()}?eventId=${encodeURIComponent(_eventId)}&from=${URLSchemeFrom2.WIDGET}`;
    const { eventId, from } = args.queryParameters;
    if (eventId && eventId === _eventId && from === URLSchemeFrom2.WIDGET) {
      onClick();
    }
  }
  async function request(args2) {
    const {
      url: url2,
      data: data2,
      header,
      dataType = "json",
      method = "GET",
      timeout = 60 * 1e3,
      useCache = false,
      failReturnCache = true,
    } = args2;
    const cacheKey = `url:${url2}`;
    const cache = getStorage2(cacheKey);
    if (useCache && cache !== null) return cache;
    const req = new Request(url2);
    req.method = method;
    header && (req.headers = header);
    data2 && (req.body = data2);
    req.timeoutInterval = timeout / 1e3;
    req.allowInsecureRequest = true;
    let res;
    try {
      switch (dataType) {
        case "json":
          res = await req.loadJSON();
          break;
        case "text":
          res = await req.loadString();
          break;
        case "image":
          res = await req.loadImage();
          break;
        case "data":
          res = await req.load();
          break;
        default:
          res = await req.loadJSON();
      }
      const result = { ...req.response, data: res };
      setStorage2(cacheKey, result);
      return result;
    } catch (err) {
      if (cache !== null && failReturnCache) return cache;
      return err;
    }
  }
  async function getImage(args2) {
    const { filepath, url: url2, useCache = true } = args2;
    const generateDefaultImage = async () => {
      const ctx = new DrawContext();
      ctx.size = new Size(100, 100);
      ctx.setFillColor(Color.red());
      ctx.fillRect(new Rect(0, 0, 100, 100));
      return await ctx.getImage();
    };
    try {
      if (filepath) {
        return Image.fromFile(filepath) || (await generateDefaultImage());
      }
      if (!url2) return await generateDefaultImage();
      const cacheKey = `image:${url2}`;
      if (useCache) {
        const cache = getCache2(url2);
        if (cache instanceof Image) {
          return cache;
        } else {
          removeCache2(cacheKey);
        }
      }
      const res = await request({ url: url2, dataType: "image" });
      const image = res && res.data;
      image && setCache2(cacheKey, image);
      return image || (await generateDefaultImage());
    } catch (err) {
      return await generateDefaultImage();
    }
  }
  return {
    GenrateView: GenrateView2,
    h: h2,
  };
}
function createPinyinRuntime(deps) {
  const { globalStorage } = deps;
  const pinyinGlobal = globalThis;
  const CACHE_KEY = "pinyin_dict_cache";
  let loadingPromise = null;
  async function loadPinyinDict(url = null) {
    const PINYIN_DICT_URL =
      url ||
      "https://raw.githubusercontent.com/zhangyxXyz/ios-scriptable-tsx/main/data/pinyinDict.js";
    if (pinyinGlobal.pinyinDict) return pinyinGlobal.pinyinDict;
    const cachedDict = globalStorage.getStorage(CACHE_KEY, -1);
    if (cachedDict) {
      pinyinGlobal.pinyinDict = cachedDict;
      return pinyinGlobal.pinyinDict;
    }
    if (loadingPromise && !url) return loadingPromise;
    try {
      loadingPromise = (async () => {
        console.log(
          `[loadPinyinDict] Loading pinyin dictionary from network...`,
        );
        const data = await globalStorage.getFile(PINYIN_DICT_URL);
        const code = data.toRawString();
        eval(code);
        if (pinyinGlobal.pinyinDict) {
          globalStorage.setStorage(CACHE_KEY, pinyinGlobal.pinyinDict);
        }
        return pinyinGlobal.pinyinDict;
      })();
      return await loadingPromise;
    } catch (e) {
      console.error(`[loadPinyinDict] Failed to load pinyin dictionary: ${e}`);
      throw new Error(
        "Failed to load pinyin dictionary, please check network connection",
      );
    } finally {
      loadingPromise = null;
    }
  }
  function initPinyinUtils() {
    let dictNotone = null;
    let loading = false;
    function buildDict() {
      if (!pinyinGlobal.pinyinDict) {
        if (!loading) {
          loading = true;
          loadPinyinDict()
            .catch(() => {})
            .finally(() => {
              loading = false;
            });
        }
        return;
      }
      if (dictNotone) return;
      dictNotone = {};
      for (const pinyin in pinyinGlobal.pinyinDict) {
        const characters = pinyinGlobal.pinyinDict[pinyin];
        for (let charIndex = 0; charIndex < characters.length; charIndex++) {
          if (!dictNotone[characters[charIndex]]) {
            dictNotone[characters[charIndex]] = [pinyin];
          } else {
            dictNotone[characters[charIndex]].push(pinyin);
          }
        }
      }
    }
    async function ensurePinyinDict(url2 = null) {
      await loadPinyinDict(url2);
      buildDict();
      return Boolean(dictNotone);
    }
    function generateCombinations(arrays) {
      if (arrays.length === 0) return [];
      if (arrays.length === 1) return arrays[0];
      const combinations = [];
      function combine(arrayIndex, currentString) {
        if (arrayIndex === arrays.length) {
          combinations.push(currentString);
          return;
        }
        for (const item of arrays[arrayIndex]) {
          combine(arrayIndex + 1, currentString + item);
        }
      }
      combine(0, "");
      return combinations;
    }
    return {
      getPinyin(chinese) {
        buildDict();
        if (!dictNotone) return [];
        if (!chinese || /^ +$/.test(chinese)) return [];
        const pinyinArrays = [];
        for (let charIndex = 0; charIndex < chinese.length; charIndex++) {
          const currentChar = chinese.charAt(charIndex);
          const possiblePinyins = dictNotone[currentChar];
          pinyinArrays.push(possiblePinyins || [currentChar]);
        }
        return generateCombinations(pinyinArrays);
      },
      getFirstLetter(str) {
        buildDict();
        if (!dictNotone) return [];
        if (!str || /^ +$/.test(str)) return [];
        const pinyinArrays = [];
        for (let charIndex = 0; charIndex < str.length; charIndex++) {
          const charCode = str.charCodeAt(charIndex);
          const currentChar = str.charAt(charIndex);
          if (
            charCode >= 19968 &&
            charCode <= 40869 &&
            dictNotone[currentChar]
          ) {
            pinyinArrays.push(
              Array.from(
                new Set(dictNotone[currentChar].map((p) => p.charAt(0))),
              ),
            );
          } else {
            pinyinArrays.push([currentChar]);
          }
        }
        return generateCombinations(pinyinArrays);
      },
      async firstChar(str) {
        await ensurePinyinDict();
        const results = this.getFirstLetter(str);
        return results.length > 0 ? results[0] : "";
      },
      async fullChar(str) {
        await ensurePinyinDict();
        const results = this.getPinyin(str);
        return results.length > 0 ? results[0] : "";
      },
    };
  }
  const pinyin_default = initPinyinUtils();
  return {
    pinyin_default,
  };
}
function createCustomFontRuntime(deps2) {
  const { globalStorage: globalStorage2, isHttpUrl: isHttpUrl2 } = deps2;
  async function drawTextWithCustomFont2(
    fontUrl,
    text,
    fontSize,
    textColor,
    align = "center",
    lineLimit = 1,
    rowSpacing = 5,
  ) {
    const font = new CustomFont(new WebView(), {
      fontFamily: "customFont",
      // 字体名称
      fontUrl,
      // 字体地址
      timeout: 6e4,
      // 加载字体的超时时间
    });
    await font.load();
    const image = await font.drawText(text, {
      fontSize,
      // 字体大小
      textWidth: 0,
      // 文本宽度
      align,
      // left、right、center
      lineLimit,
      // 文本行数限制
      rowSpacing,
      // 文本行间距
      textColor,
      // 文本颜色
      scale: 2,
      // 缩放因子
    });
    return image;
  }
  class CustomFont {
    constructor(webview, config2) {
      this.webview = webview || new WebView();
      this.fontFamily = config2.fontFamily || "customFont";
      this.fontUrl = config2.fontUrl;
      this.timeout = config2.timeout || 6e4;
    }
    async load() {
      let fontSrc = this.fontUrl;
      if (typeof fontSrc === "string" && isHttpUrl2(fontSrc)) {
        const data2 = await globalStorage2.getFile(fontSrc, true, false);
        const base64 = data2.toBase64String();
        fontSrc = `data:font/ttf;base64,${base64}`;
      }
      const fontFaceSrc = `url(${fontSrc})`;
      return await this.webview.evaluateJavaScript(`
                const customFont = new FontFace("${this.fontFamily}", "${fontFaceSrc}");
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                let baseHeight, extendHeight;
                console.log('[FontLoader][load] loading font.');
                customFont.load().then((font) => {
                    document.fonts.add(font);
                    console.log('[FontLoader][load] load font successfully.');
                    completion(true);
                });
                setTimeout(() => {
                    console.log('[FontLoader][load] load font failed: timeout.');
                    completion(false);
                }, ${this.timeout});
                null
            `);
    }
    async drawText(text, config2) {
      const fontSize = config2.fontSize || 20;
      const textWidth = config2.textWidth || 300;
      const align = config2.align || "left";
      const lineLimit = config2.lineLimit || 99;
      const rowSpacing = config2.rowSpacing || 0;
      const textColor = config2.textColor || "white";
      const textArray = await this.cutText(text, fontSize, textWidth);
      const scale = config2.scale || 1;
      let script = "";
      for (const i in textArray) {
        const index = Number(i);
        let content = textArray[i].str;
        const length = textArray[i].len;
        if (index >= lineLimit) break;
        if (index == lineLimit - 1 && index < textArray.length - 1)
          content = content.replace(/(.{1})$/, "…");
        let x = 0,
          y = index * fontSize;
        if (rowSpacing > 0 && index > 0) y = y + rowSpacing;
        if (index > 0) {
          if (align === "right") {
            x = textWidth - length;
          } else if (align === "center") {
            x = (textWidth - length) / 2;
          }
        }
        script = script + `ctx.fillText("${content}", ${x}, ${y});`;
      }
      const realWidth = textArray.length > 1 ? textWidth : textArray[0].len;
      const lineCount =
        lineLimit < textArray.length ? lineLimit : textArray.length;
      const returnValue = await this.webview.evaluateJavaScript(`
                canvas.width = ${realWidth} * ${scale};
                ctx.font = "${fontSize}px ${this.fontFamily}";
                ctx.textBaseline = "hanging";
                baseHeight = ${(fontSize + rowSpacing) * (lineCount - 1)};
                extendHeight = ctx.measureText('qypgj').actualBoundingBoxDescent;
                canvas.height = (baseHeight + extendHeight) * ${scale};
                ctx.scale(${scale}, ${scale});
                ctx.font = "${fontSize}px ${this.fontFamily}";
                ctx.fillStyle = "${textColor}";
                ctx.textBaseline = "hanging";
                ${script}
                canvas.toDataURL()
            `);
      const imageDataString = returnValue.slice(22);
      const imageData = Data.fromBase64String(imageDataString);
      return Image.fromData(imageData);
    }
    async cutText(text, fontSize, textWidth) {
      return await this.webview.evaluateJavaScript(`
                function cutText(textWidth, text) {
                    ctx.font = "${fontSize}px ${this.fontFamily}";
                    ctx.textBaseline = "hanging";
    
                    let textArray = [];
                    let len = 0, str = '';
                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        const width = ctx.measureText(char).width;
                        if (len < textWidth) {
                            str = str + char;
                            len = len + width;
                        }
                        if (len == textWidth) {
                            textArray.push({ str: str, len: len });
                            str = '';
                            len = 0;
                        }
                        if (len > textWidth) {
                            textArray.push({
                                str: str.substring(0, str.length - 1),
                                len: len - width,
                            });
                            str = char;
                            len = width;
                        }
                        if (i == text.length - 1 && str) {
                            textArray.push({ str: str, len: len });
                        }
                    }
                    return textArray;
                }
                cutText(${textWidth}, ${JSON.stringify(text)})
            `);
    }
  }
  return {
    drawTextWithCustomFont: drawTextWithCustomFont2,
  };
}
function createUtilsRuntime(deps2) {
  const {
    isEmpty: isEmpty2,
    pinyin_default: pinyin_default2,
    drawTextWithCustomFont: drawTextWithCustomFont2,
  } = deps2;
  function time(fmt, ts = null) {
    const date = ts ? new Date(ts) : /* @__PURE__ */ new Date();
    const o = {
      "M+": date.getMonth() + 1,
      "d+": date.getDate(),
      "H+": date.getHours(),
      "m+": date.getMinutes(),
      "s+": date.getSeconds(),
      "q+": Math.floor((date.getMonth() + 3) / 3),
      S: date.getMilliseconds(),
    };
    if (/(y+)/.test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        (date.getFullYear() + "").substr(4 - RegExp.$1.length),
      );
    for (const k in o)
      if (new RegExp("(" + k + ")").test(fmt))
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length == 1
            ? o[k]
            : ("00" + o[k]).substr(("" + o[k]).length),
        );
    return fmt;
  }
  function randomColor16() {
    let r = Math.floor(Math.random() * 256);
    if (r + 50 < 255) {
      r = r + 50;
    }
    if (r > 230 && r < 255) {
      r = r - 50;
    }
    let g = Math.floor(Math.random() * 256);
    if (g + 50 < 255) {
      g = g + 50;
    }
    if (g > 230 && g < 255) {
      g = g - 50;
    }
    let b = Math.floor(Math.random() * 256);
    if (b + 50 < 255) {
      b = b + 50;
    }
    if (b > 230 && b < 255) {
      b = b - 50;
    }
    const color = "#" + r.toString(16) + g.toString(16) + b.toString(16);
    return color;
  }
  async function renderUnsupport(w = null) {
    const widget = w || new ListWidget();
    const text = widget.addText("暂不支持");
    text.font = Font.systemFont(20);
    text.textColor = Color.red();
    text.centerAlignText();
  }
  const Utils2 = {
    time,
    randomColor16,
    isEmpty: isEmpty2,
    renderUnsupport,
    char2PinFirstChar: (value) => pinyin_default2.firstChar(value),
    char2PinFullChar: (value) => pinyin_default2.fullChar(value),
    drawTextWithCustomFont: drawTextWithCustomFont2,
  };
  return {
    Utils: Utils2,
    time,
    randomColor16,
    renderUnsupport,
  };
}
const { pinyin_default } = createPinyinRuntime({
  globalStorage,
});
const { drawTextWithCustomFont } = createCustomFontRuntime({
  globalStorage,
  isHttpUrl,
});
const { GenrateView, h } = createStackUI({
  URLSchemeFrom,
  drawTextWithCustomFont,
  hash,
  getStorage,
  setStorage,
  getCache,
  setCache,
  removeCache,
});
const { Utils } = createUtilsRuntime({
  isEmpty,
  pinyin_default,
  drawTextWithCustomFont,
});
module.exports = {
  WidgetBase,
  Runing,
  Storage,
  GenrateView,
  h,
  Utils,
};
(async () => {
  const scriptName =
    typeof Script !== "undefined" && Script.name ? Script.name() : "";
  const currentFileName = MODULE.filename
    ? MODULE.filename.split("/").pop()
    : "";
  const isDirectRun =
    scriptName === currentFileName || scriptName === "Seiun.Env";
  if (
    config &&
    config.runsInApp &&
    typeof args !== "undefined" &&
    isDirectRun
  ) {
    const a = new Alert();
    a.title = "提示";
    a.message = "该脚本为基础环境库，不支持直接运行";
    a.addAction("确定");
    await a.presentAlert();
  }
})();
