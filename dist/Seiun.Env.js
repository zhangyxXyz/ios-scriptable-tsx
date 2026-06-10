// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: cogs;

/*
 * author   :  seiun
 * date     :  2021/11/13
 * build    :  2026-06-11 02:35:05
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
const { createWidgetBaseRuntime } = require("./widget-base");
const { createStorageRuntime } = require("./storage");
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
const { createStackUI } = require("./stack-ui");
const { createPinyinRuntime } = require("./pinyin");
const { createCustomFontRuntime } = require("./custom-font");
const { createUtilsRuntime } = require("./utils");
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
