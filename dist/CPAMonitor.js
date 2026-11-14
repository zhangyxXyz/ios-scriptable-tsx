// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: key;

/*
 * author   :  seiunzhang
 * date     :  2026/11/14
 * build    :  2026-11-14 19:53:46
 * desc     :  CPA 订阅与上游凭证额度监控，支持 provider 筛选和服务端缓存状态
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/CPAMonitor.tsx
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, GenrateView } = runtimeRequire("Seiun.Env.js");
var statusLabels = {
  ok: "正常",
  stale: "旧快照",
  forbidden: "未授权",
  error: "刷新失败",
  refresh_pending: "等待刷新",
  unavailable: "暂不可用",
  unsupported: "不支持查询",
};
var keychainSlot = "CPAMonitor:downstream-key";
var CPAMonitor = class extends WidgetBase {
  constructor(scriptName) {
    super(scriptName);
    this.name = "CPA额度监控";
    this.en = "CPAMonitor";
    this.widgetParam = args.widgetParameter;
    this.currentSettings = {
      requestSettings: {
        origin: { val: "", type: this.settingValTypeString },
        include: { val: "", type: this.settingValTypeString },
        provider: { val: "", type: this.settingValTypeString },
      },
    };
    if (!config.runsInApp) return;
    this.registerSettingCategory("requestSettings", "CPA 设置", [
      {
        title: "CPA 地址",
        desc: "HTTPS 地址，不含路径",
        type: "text",
        option: { origin: "" },
        config: { placeholder: "https://cpa.example.com" },
      },
      {
        title: "查询内容",
        type: "select",
        option: { include: "" },
        config: {
          selectOptions: [
            { label: "已授权的全部内容", value: "" },
            { label: "订阅额度", value: "subscription" },
            { label: "上游额度", value: "upstream" },
            { label: "订阅和上游", value: "subscription,upstream" },
          ],
        },
      },
      {
        title: "Provider",
        desc: "留空查询全部；例如 codex、claude、copilot",
        type: "text",
        option: { provider: "" },
      },
    ]);
    this.registerSetting([
      {
        title: "CPA 设置",
        icon: { name: "server.rack", color: "#2563EB" },
        onAction: async () => {
          await this.presentSettings(["requestSettings"]);
          return true;
        },
      },
      {
        title: "设置 API Key",
        desc: "仅保存到 Keychain，不保存额度响应缓存",
        icon: { name: "key", color: "#F59E0B" },
        onAction: async () => {
          const alert = new Alert();
          alert.title = "下游 API Key";
          alert.message =
            "请在 CPA 插件中为该 Key 开启需要的额度查询权限。留空可清除已保存的 Key。";
          alert.addSecureTextField("sk-...");
          alert.addAction("保存");
          alert.addCancelAction("取消");
          if ((await alert.presentAlert()) >= 0) {
            const value = alert.textFieldValue(0).trim();
            if (/\s/.test(value)) {
              await this.notify("未保存", "API Key 不能包含空白字符");
              return true;
            }
            if (value) Keychain.set(keychainSlot, value);
            else if (Keychain.contains(keychainSlot))
              Keychain.remove(keychainSlot);
            await this.notify(
              "已保存",
              value ? "API Key 已写入 Keychain" : "API Key 已清除",
            );
          }
          return true;
        },
      },
    ]);
  }
  async loadQuota() {
    const settings = this.currentSettings.requestSettings;
    const origin = String(settings.origin.val || "")
      .trim()
      .replace(/\/+$/, "");
    if (!/^https:\/\/[^/?#@\s]+$/.test(origin))
      throw new Error("请先设置 CPA 的 HTTPS 地址");
    if (!Keychain.contains(keychainSlot))
      throw new Error("请先在设置中保存 API Key");
    const include = String(settings.include.val || "").trim();
    const provider = String(settings.provider.val || "").trim();
    const params = [
      include ? "include=" + encodeURIComponent(include) : "",
      provider ? "provider=" + encodeURIComponent(provider) : "",
    ].filter(Boolean);
    const request = new Request(
      origin +
        "/v0/resource/plugins/cpa-key-billing/monitor/usage" +
        (params.length ? "?" + params.join("&") : ""),
    );
    request.headers = { Authorization: "Bearer " + Keychain.get(keychainSlot) };
    request.timeoutInterval = 30;
    let body;
    try {
      body = await request.loadJSON();
    } catch (_) {
      throw new Error("无法读取 CPA 响应，请检查地址与网络");
    }
    const status = request.response.statusCode;
    if (status === 401) throw new Error("Key 无效或已换钥，请重新设置");
    if (status === 403) throw new Error("该 Key 未开启所请求的额度权限");
    if (
      status !== 200 ||
      body.schema_version !== 1 ||
      !body.success ||
      !body.data
    )
      throw new Error("额度查询失败，请检查权限或筛选条件");
    return body;
  }
  rows(response) {
    const rows = [];
    const append = (name, part) => {
      const state = statusLabels[part.status] || "未知状态";
      const warning = part.stale === true || part.status !== "ok";
      const cache = part.stale ? "旧快照" : part.cached ? "缓存" : state;
      if (part.unlimited || !part.windows?.length) {
        rows.push({
          name,
          amount: part.unlimited ? "不限额" : state,
          detail: cache,
          warning,
        });
      }
      for (const window of part.windows || []) {
        const remaining = window.remaining_percent;
        const amount = window.unlimited
          ? "不限额"
          : typeof remaining === "number" && Number.isFinite(remaining)
            ? remaining.toFixed(1) + "%"
            : typeof window.remaining === "number" &&
                Number.isFinite(window.remaining)
              ? window.remaining.toLocaleString() +
                (window.unit ? " " + window.unit : "")
              : "未知";
        const timestamp =
          window.reset_at || window.observed_at || part.fetched_at;
        const date = timestamp ? new Date(timestamp) : null;
        const time =
          date && Number.isFinite(date.getTime())
            ? date.toLocaleString("zh-CN", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
        rows.push({
          name: name + " · " + window.label,
          amount,
          detail:
            cache +
            (time ? " · " + (window.reset_at ? "重置 " : "观察 ") + time : ""),
          warning,
        });
      }
    };
    if (response.data.subscription)
      append(
        response.data.subscription.plan_name || "订阅额度",
        response.data.subscription,
      );
    const upstream = response.data.upstream;
    if (upstream) {
      if (upstream.status !== "ok")
        rows.push({
          name: "上游额度",
          amount: statusLabels[upstream.status] || "未知状态",
          detail: "部分数据可能不可用",
          warning: true,
        });
      for (const item of upstream.items || [])
        append(item.name || "上游凭证", item);
    }
    return rows;
  }
  async render() {
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    GenrateView.setListWidget(widget);
    widget.setPadding(14, 14, 14, 14);
    widget.url = `scriptable:///run/${encodeURIComponent(Script.name())}`;
    widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1e3);
    const heading = widget.addText("CPA 额度");
    heading.font = Font.boldSystemFont(16);
    heading.textColor = this.widgetColor;
    widget.addSpacer(9);
    try {
      const response = await this.loadQuota();
      const rows = this.rows(response);
      const limit =
        this.widgetFamily === "large"
          ? 6
          : this.widgetFamily === "medium"
            ? 2
            : 1;
      for (const row of rows.slice(0, limit)) {
        const stack = widget.addStack();
        stack.centerAlignContent();
        const title = stack.addText(row.name);
        title.font = Font.mediumSystemFont(11);
        title.textColor = this.widgetColor;
        title.lineLimit = 1;
        stack.addSpacer(6);
        const value = stack.addText(row.amount);
        value.font = Font.boldSystemFont(13);
        value.textColor = row.warning
          ? new Color("#D97706")
          : new Color("#2563EB");
        value.lineLimit = 1;
        const detail = widget.addText(row.detail);
        detail.font = Font.systemFont(9);
        detail.textColor = this.widgetColor;
        detail.textOpacity = 0.6;
        detail.lineLimit = 1;
        widget.addSpacer(7);
      }
      if (!rows.length)
        widget.addText("没有可见的额度数据").font = Font.systemFont(12);
      widget.addSpacer();
      const footer = widget.addText(
        rows.length > limit
          ? `另有 ${rows.length - limit} 项 · 大号组件显示更多`
          : response.data.upstream
            ? "上游额度可能共享，请勿累加"
            : "以服务端额度为准",
      );
      footer.font = Font.systemFont(9);
      footer.textColor = this.widgetColor;
      footer.textOpacity = 0.6;
      footer.lineLimit = 1;
    } catch (error) {
      const message = widget.addText(
        error instanceof Error ? error.message : "额度暂不可用",
      );
      message.font = Font.systemFont(12);
      message.textColor = this.widgetColor;
    }
    return widget;
  }
};
EndAwait(() => Runing(CPAMonitor, args.widgetParameter, false));

await __topLevelAwait__();
