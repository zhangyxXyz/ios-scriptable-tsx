// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: cloud-download-alt;

/*
 * author   :  seiun
 * date     :  2026/06/04
 * build    :  2026-06-04 00:56:36
 * desc     :  Scriptable 脚本订阅更新器
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/ScriptUpdater.tsx
var RAW_BASE_URL =
  "https://raw.githubusercontent.com/zhangyxXyz/ios-scriptable-tsx/codex/script-subscription-updater/dist";
var DEFAULT_SUBSCRIPTION_URL = `${RAW_BASE_URL}/subscription.json`;
var dependencyFileName = "Seiun.Env.js";
function getBootstrapFileManager() {
  const isICloud = MODULE.filename.includes("Documents/iCloud~");
  return FileManager[isICloud ? "iCloud" : "local"]();
}
function getScriptDocumentPath(fileName) {
  const fm = getBootstrapFileManager();
  return fm.joinPath(fm.documentsDirectory(), fileName);
}
function reopenCurrentScript() {
  Safari.open(`scriptable:///run/${encodeURIComponent(Script.name())}`);
}
async function ensureSeiunEnv() {
  const fm = getBootstrapFileManager();
  const envPath = getScriptDocumentPath(dependencyFileName);
  if (fm.fileExists(envPath)) return true;
  const req = new Request(`${RAW_BASE_URL}/${dependencyFileName}`);
  const source = await req.loadString();
  fm.writeString(envPath, source);
  const alert = new Alert();
  alert.title = "依赖已安装";
  alert.message = "Seiun.Env.js 已下载，脚本将重新打开。";
  alert.addAction("确定");
  await alert.presentAlert();
  reopenCurrentScript();
  Script.complete();
  return false;
}
EndAwait(async () => {
  if (!(await ensureSeiunEnv())) return;
  const runtimeRequire =
    typeof require === "undefined" ? importModule : require;
  const { WidgetBase, Runing, Utils } = runtimeRequire(dependencyFileName);
  class ScriptUpdater extends WidgetBase {
    constructor(scriptName) {
      super(scriptName);
      this.name = "脚本更新器";
      this.en = "ScriptUpdater";
      this.currentSettings = {
        subscriptionSettings: {
          urls: { val: [], type: this.settingValTypeArray },
        },
      };
      this.Run();
    }
    Run() {
      if (!config.runsInApp) return;
      this.registerSettingCategory("subscriptionSettings", "订阅设置", [
        {
          title: "订阅链接",
          desc: "管理订阅 JSON 地址",
          icon: { name: "link.badge.plus", color: "#0a84ff" },
          type: "select",
          option: { urls: [] },
          config: {
            selectOptions: [],
            defaultShowContent: "未配置",
            multiple: true,
            editable: true,
            truncateLength: 0,
          },
        },
      ]);
      this.registerSetting({
        title: "订阅管理",
        desc: "查看、更新、下载订阅脚本",
        icon: { name: "arrow.down.doc", color: "#34c759" },
        onAction: async () => {
          await this.presentSubscriptionManager();
        },
      });
    }
    getFileManager() {
      const isICloud = MODULE.filename.includes("Documents/iCloud~");
      return FileManager[isICloud ? "iCloud" : "local"]();
    }
    getScriptPath(fileName) {
      return getScriptDocumentPath(fileName);
    }
    getSubscriptions() {
      const fromSettings = this.settings.subscriptionSettings?.urls;
      const fromCurrent = this.currentSettings.subscriptionSettings.urls.val;
      const urls =
        Array.isArray(fromSettings) && fromSettings.length
          ? fromSettings
          : fromCurrent;
      if (!urls || urls.length === 0) return [DEFAULT_SUBSCRIPTION_URL];
      return [
        ...new Set(
          (urls || []).map((url) => String(url).trim()).filter(Boolean),
        ),
      ];
    }
    saveSubscriptions(urls) {
      const uniqueUrls = [
        ...new Set(urls.map((url) => String(url).trim()).filter(Boolean)),
      ];
      this.settings.subscriptionSettings = {
        ...(this.settings.subscriptionSettings || {}),
        urls: uniqueUrls,
      };
      this.currentSettings.subscriptionSettings.urls.val = uniqueUrls;
      this.saveSettings(false);
      return uniqueUrls;
    }
    readLocalMeta(fileName) {
      const fm = this.getFileManager();
      const filePath = this.getScriptPath(fileName);
      if (!fm.fileExists(filePath)) return {};
      const source = fm.readString(filePath);
      return {
        installedVersion: this.readHeaderField(source, "version"),
        installedBuild: this.readHeaderField(source, "build"),
      };
    }
    readHeaderField(source, field) {
      const match = source.match(
        new RegExp(`^\\s*\\*\\s*${field}\\s*:\\s*(.*)$`, "m"),
      );
      return match ? match[1].trim() : "";
    }
    resolveRawUrl(manifestUrl, manifest, script) {
      if (/^https?:\/\//.test(script.rawUrl)) return script.rawUrl;
      const baseUrl =
        manifest.rawBaseUrl || manifestUrl.replace(/\/[^/]*$/, "");
      return `${baseUrl.replace(/\/+$/, "")}/${script.rawUrl || script.fileName}`;
    }
    async fetchManifest(url) {
      const req = new Request(url);
      const manifest = await req.loadJSON();
      const scripts = (manifest.scripts || []).map((script) => {
        const rawUrl = this.resolveRawUrl(url, manifest, script);
        return {
          ...script,
          rawUrl,
          ...this.readLocalMeta(script.fileName),
        };
      });
      return {
        url,
        title: url.replace(/^https?:\/\//, "").replace(/\/[^/]*$/, ""),
        generatedAt: manifest.generatedAt || "",
        scripts,
      };
    }
    async buildState(message = "") {
      const subscriptions = this.getSubscriptions();
      const manifests = [];
      for (const url of subscriptions) {
        try {
          manifests.push(await this.fetchManifest(url));
        } catch (error) {
          manifests.push({
            url,
            title: url,
            generatedAt: "",
            scripts: [],
            error: String(error),
          });
        }
      }
      return { subscriptions, manifests, message };
    }
    async downloadScript(script) {
      const req = new Request(script.rawUrl);
      const source = await req.loadString();
      const fm = this.getFileManager();
      fm.writeString(this.getScriptPath(script.fileName), source);
      if (script.fileName === dependencyFileName) this.reopenScript();
      return `${script.name?.zh || script.fileName} 已更新`;
    }
    findScript(state, fileName) {
      return state.manifests
        .flatMap((item) => item.scripts)
        .find((script) => script.fileName === fileName);
    }
    htmlEscape(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    renderManagerHtml(state) {
      const initialState = JSON.stringify(state).replace(/</g, "\\u003c");
      return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
:root {
  color-scheme: light dark;
  --bg: #f2f2f7;
  --card: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --line: rgba(60,60,67,0.16);
  --blue: #007aff;
  --green: #34c759;
  --red: #ff3b30;
  --shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #000000;
    --card: #1c1c1e;
    --text: #f5f5f7;
    --muted: #8e8e93;
    --line: rgba(84,84,88,0.65);
    --shadow: 0 8px 28px rgba(0, 0, 0, 0.32);
  }
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body {
  margin: 0;
  padding: calc(env(safe-area-inset-top) + 12px) 14px calc(env(safe-area-inset-bottom) + 20px);
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
}
.top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 2px 2px 16px; }
.title { font-size: 28px; line-height: 1.1; font-weight: 720; }
.subtitle { margin-top: 4px; color: var(--muted); font-size: 13px; }
.toolbar { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
button {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  color: white;
  background: var(--blue);
  font-size: 14px;
  font-weight: 650;
}
button.secondary { color: var(--blue); background: rgba(0,122,255,0.12); }
button.green { background: var(--green); }
button.red { background: rgba(255,59,48,0.12); color: var(--red); }
.message { margin: 0 2px 12px; color: var(--green); font-size: 13px; min-height: 18px; }
.section { margin: 14px 0 20px; }
.section-title { margin: 0 4px 8px; color: var(--muted); font-size: 12px; font-weight: 650; text-transform: uppercase; }
.card { background: var(--card); border-radius: 8px; box-shadow: var(--shadow); overflow: hidden; }
.row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-top: 0.5px solid var(--line); }
.row:first-child { border-top: 0; }
.row-main { flex: 1; min-width: 0; }
.row-title { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }
.row-desc { margin-top: 3px; color: var(--muted); font-size: 12px; line-height: 1.35; overflow-wrap: anywhere; }
.script-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.version { color: var(--blue); font-size: 12px; font-weight: 700; white-space: nowrap; }
.error { color: var(--red); }
.empty { color: var(--muted); padding: 18px 14px; font-size: 14px; }
</style>
</head>
<body>
<div class="top">
  <div>
    <div class="title">订阅更新</div>
    <div class="subtitle">管理 Scriptable 脚本源与本地下载</div>
  </div>
  <div class="toolbar">
    <button class="secondary" onclick="addSubscription()">添加</button>
    <button class="green" onclick="invoke('updateAll')">全部更新</button>
  </div>
</div>
<div id="message" class="message"></div>
<main id="app"></main>
<script>
let state = ${initialState};
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function invoke(code, data) {
  window.dispatchEvent(new CustomEvent('JBridge', {detail: {code, data}}));
}
function addSubscription() {
  const url = prompt('订阅 JSON 地址');
  if (url) invoke('addSubscription', url.trim());
}
function render() {
  document.getElementById('message').textContent = state.message || '';
  const app = document.getElementById('app');
  const subscriptionRows = state.subscriptions.length
    ? state.subscriptions.map(url => '<div class="row"><div class="row-main"><div class="row-title">' + escapeHtml(url) + '</div></div><button class="red" onclick="invoke(\\'removeSubscription\\', ' + JSON.stringify(url).replace(/"/g, '&quot;') + ')">删除</button></div>').join('')
    : '<div class="empty">还没有订阅链接</div>';
  const manifests = state.manifests.length
    ? state.manifests.map(manifest => {
        const scripts = manifest.error
          ? '<div class="row"><div class="row-main"><div class="row-title error">拉取失败</div><div class="row-desc">' + escapeHtml(manifest.error) + '</div></div></div>'
          : manifest.scripts.map(script => {
              const name = (script.name && (script.name.zh || script.name.en)) || script.fileName;
              const sub = [script.name && script.name.en, script.desc, script.build ? 'Build ' + script.build : ''].filter(Boolean).join(' · ');
              const installed = script.installedVersion ? '本地 ' + script.installedVersion : '未安装';
              return '<div class="row"><div class="row-main"><div class="row-title">' + escapeHtml(name) + '</div><div class="row-desc">' + escapeHtml(sub) + '</div><div class="row-desc">' + escapeHtml(installed) + '</div></div><div class="script-actions"><span class="version">' + escapeHtml(script.version || '') + '</span><button onclick="invoke(\\'updateScript\\', ' + JSON.stringify(script.fileName).replace(/"/g, '&quot;') + ')">更新</button></div></div>';
            }).join('');
        return '<section class="section"><div class="section-title">' + escapeHtml(manifest.title) + '</div><div class="card">' + scripts + '</div></section>';
      }).join('')
    : '<section class="section"><div class="card"><div class="empty">添加订阅后会在这里展示脚本</div></div></section>';
  app.innerHTML = '<section class="section"><div class="section-title">订阅链接</div><div class="card">' + subscriptionRows + '</div></section>' + manifests;
}
window.applyState = next => { state = next; render(); };
render();
</script>
</body>
</html>`;
    }
    async waitForBridgeEvent(webView) {
      const result = await webView.evaluateJavaScript(
        `(() => {
                const handler = event => {
                    window.removeEventListener('JBridge', handler)
                    completion(JSON.stringify(event.detail || {}))
                }
                window.addEventListener('JBridge', handler)
            })()`,
        true,
      );
      return JSON.parse(result || "{}");
    }
    async applyState(webView, state) {
      await webView.evaluateJavaScript(
        `window.applyState(${JSON.stringify(state).replace(/</g, "\\u003c")})`,
      );
    }
    async presentSubscriptionManager() {
      const webView = new WebView();
      let state = {
        subscriptions: this.getSubscriptions(),
        manifests: [],
        message: "正在加载订阅...",
      };
      await webView.loadHTML(this.renderManagerHtml(state));
      webView.present();
      state = await this.buildState();
      await this.applyState(webView, state);
      while (true) {
        const event = await this.waitForBridgeEvent(webView);
        if (!event.code || event.code === "__playground_close__") break;
        try {
          if (event.code === "addSubscription") {
            this.saveSubscriptions([
              ...state.subscriptions,
              String(event.data || ""),
            ]);
            state = await this.buildState("订阅已添加");
          } else if (event.code === "removeSubscription") {
            this.saveSubscriptions(
              state.subscriptions.filter((url) => url !== event.data),
            );
            state = await this.buildState("订阅已删除");
          } else if (event.code === "updateScript") {
            const script = this.findScript(state, String(event.data || ""));
            if (script) {
              const message = await this.downloadScript(script);
              state = await this.buildState(message);
            }
          } else if (event.code === "updateAll") {
            const scripts = state.manifests.flatMap((item) => item.scripts);
            for (const script of scripts) await this.downloadScript(script);
            state = await this.buildState(`已更新 ${scripts.length} 个脚本`);
          }
        } catch (error) {
          state = { ...state, message: String(error) };
        }
        await this.applyState(webView, state);
      }
    }
    async render() {
      const widget = new ListWidget();
      await Utils.renderUnsupport(widget);
      return widget;
    }
  }
  await Runing(ScriptUpdater, args.widgetParameter, false);
});

await __topLevelAwait__();
