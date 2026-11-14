// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: gauge;

/*
 * author   :  seiunzhang
 * date     :  2026/11/15
 * build    :  2026-11-15 04:06:12
 * desc     :  CLIProxy-Api 额度卡片，支持 Keychain、查询发现、中号四项与大号六项自由排列
 * version  :  1.1.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/widgets/cpa-monitor.ts
var statusLabels = {
  ok: "正常",
  stale: "旧快照",
  forbidden: "未授权",
  error: "刷新失败",
  refresh_pending: "等待刷新",
  unavailable: "暂不可用",
  unsupported: "暂不支持",
};
var mediumDefaults = [
  "codex-weekly",
  "deepseek-balance",
  "copilot-premium",
  "opencode-five",
];
var largeDefaults = [
  "codex-weekly",
  "deepseek-balance",
  "copilot-premium",
  "copilot-completions",
  "opencode-five",
  "opencode-weekly",
];
var presets = [
  {
    id: "codex-weekly",
    provider: "codex",
    label: "Codex · 周额度",
    match: /weekly|week|7.day|周|七天/i,
  },
  {
    id: "deepseek-balance",
    provider: "deepseek",
    label: "DeepSeek · 余额",
    match: /balance|余额/i,
  },
  {
    id: "copilot-premium",
    provider: "copilot",
    label: "Copilot · credits",
    match: /premium|高级|credit/i,
  },
  {
    id: "copilot-completions",
    provider: "copilot",
    label: "Copilot · 补全",
    match: /complet|补全/i,
  },
  {
    id: "copilot-chat",
    provider: "copilot",
    label: "Copilot · 聊天",
    match: /chat|聊天|会话/i,
  },
  {
    id: "opencode-five",
    provider: "opencode",
    label: "OpenCode · 5 小时",
    match: /rolling|5\s*(hours?|h|小时)|five.hour/i,
  },
  {
    id: "opencode-weekly",
    provider: "opencode",
    label: "OpenCode · 周额度",
    match: /weekly|week|7.day|周|七天/i,
  },
  {
    id: "opencode-monthly",
    provider: "opencode",
    label: "OpenCode · 月额度",
    match: /month|月/i,
  },
  {
    id: "claude-five",
    provider: "claude",
    label: "Claude · 5 小时",
    match: /5\s*(hours?|h|小时)|five.hour/i,
  },
  {
    id: "claude-weekly",
    provider: "claude",
    label: "Claude · 周额度",
    match: /weekly|week|7.day|周|七天/i,
  },
  {
    id: "subscription",
    provider: "subscription",
    label: "订阅额度",
    match: /./,
  },
];
function normalizeProvider(raw = "") {
  const value = raw.toLowerCase().replace(/^openai-compatible-/, "");
  if (/copilot/.test(value)) return "copilot";
  if (/opencode/.test(value)) return "opencode";
  if (/deepseek/.test(value)) return "deepseek";
  return value;
}
var finite = (value) => typeof value === "number" && Number.isFinite(value);
var number = (value) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 2 });
var clamp = (value) => Math.max(0, Math.min(100, value));
function timeLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const two = (v) => String(v).padStart(2, "0");
  return `${two(date.getMonth() + 1)}/${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}`;
}
function flattenQuota(response, now = Date.now()) {
  const rows = [];
  const append = (part, provider, identity) => {
    for (const window of part.windows || []) {
      const reset = Date.parse(window.reset_at || "");
      const stale =
        !!part.stale ||
        part.status === "stale" ||
        (Number.isFinite(reset) && reset <= now);
      const warning = stale || part.status !== "ok";
      const unit = window.unit || "";
      const rawPercent = finite(window.remaining_percent)
        ? window.remaining_percent
        : finite(window.remaining) && finite(window.limit) && window.limit > 0
          ? (window.remaining / window.limit) * 100
          : void 0;
      let amount = "未知",
        suffix = "",
        percent = rawPercent === void 0 ? void 0 : clamp(rawPercent);
      if (window.unlimited || part.unlimited) {
        amount = "∞";
        suffix = "不限量";
        percent = void 0;
      } else if (finite(window.remaining) && unit) {
        amount =
          (unit === "CNY" ? "¥" : unit === "USD" ? "$" : "") +
          number(window.remaining);
        suffix = ["CNY", "USD"].includes(unit)
          ? unit
          : unit === "credits"
            ? "credits"
            : unit;
      } else if (percent !== void 0) {
        amount = number(percent) + "%";
        suffix = "剩余";
      } else if (finite(window.remaining)) {
        amount = number(window.remaining);
        suffix = "剩余";
      }
      const stamp = timeLabel(window.observed_at || part.fetched_at);
      const status = stale
        ? "旧快照"
        : part.status !== "ok"
          ? statusLabels[part.status] || "未知状态"
          : part.cached
            ? "缓存"
            : "";
      rows.push({
        cached: !!part.cached,
        id: JSON.stringify([identity, window.label, unit]),
        provider,
        title: window.label,
        account: part.name || part.plan_name || identity,
        amount,
        suffix,
        percent,
        stale,
        warning,
        detail: [
          status,
          part.refresh_status === "error" ? "刷新失败" : "",
          stamp ? "更新 " + stamp : "无更新时间",
          window.reset_at ? "重置 " + timeLabel(window.reset_at) : "",
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
    if (part.unlimited && !part.windows?.length)
      rows.push({
        cached: !!part.cached,
        id: JSON.stringify([identity, "unlimited", ""]),
        provider,
        title: "不限额",
        account: part.name || part.plan_name || "",
        amount: "∞",
        suffix: "不限量",
        detail: statusLabels[part.status] || "",
        warning: part.status !== "ok",
        stale: !!part.stale,
      });
  };
  if (response.data.subscription)
    append(response.data.subscription, "subscription", "subscription");
  for (const item of response.data.upstream?.items || []) {
    if (item.credential_id)
      append(item, normalizeProvider(item.provider), item.credential_id);
  }
  return rows;
}
function tileChoices(response) {
  return flattenQuota(response).map((row) => ({
    value: "window:" + row.id,
    label: `${row.provider} · ${row.title} · ${row.account}${row.suffix === "CNY" || row.suffix === "USD" ? " · " + row.suffix : ""}`,
  }));
}
function selectTiles(response, selections, now = Date.now()) {
  const rows = flattenQuota(response, now);
  return selections.map((selection) => {
    const preset = presets.find((p) => p.id === selection);
    const matches = preset
      ? rows.filter(
          (row) =>
            row.provider === preset.provider && preset.match.test(row.title),
        )
      : rows.filter((row) => "window:" + row.id === selection);
    if (matches.length === 1)
      return {
        ...matches[0],
        title: preset?.label || `${matches[0].provider} · ${matches[0].title}`,
      };
    const part =
      preset?.provider === "subscription"
        ? response.data.subscription
        : response.data.upstream;
    const items =
      part?.items?.filter(
        (item) => normalizeProvider(item.provider) === preset?.provider,
      ) || [];
    const state =
      part?.status === "forbidden"
        ? "未授权"
        : items.length
          ? statusLabels[
              items.find((item) => item.status !== "ok")?.status || ""
            ] || "未返回此项"
          : part?.status !== "ok"
            ? statusLabels[part?.status || ""] || "未授权或未接入"
            : "未返回此项";
    return {
      id: selection,
      provider: preset?.provider || "",
      title: preset?.label || "已选额度",
      account: "",
      amount: matches.length > 1 ? "请选择" : state,
      suffix: "",
      detail:
        matches.length > 1
          ? `${matches.length} 个窗口 · 在设置中指定`
          : "设置 → 查询并选择额度项",
      warning: true,
      stale: false,
    };
  });
}

// src/scripts/CPAMonitor.tsx
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, GenrateView, Utils } = runtimeRequire("Seiun.Env.js");
var keychainSlot = "CPAMonitor:downstream-key";
var refreshInterval = 5 * 60 * 1e3;
var CPAMonitor = class extends WidgetBase {
  constructor(scriptName) {
    super(scriptName);
    this.name = "CLIProxy-Api额度监控";
    this.en = "CPAMonitor";
    this.widgetParam = args.widgetParameter;
    this.currentSettings = {
      requestSettings: {
        origin: { val: "", type: this.settingValTypeString },
        include: { val: "", type: this.settingValTypeString },
        provider: { val: "", type: this.settingValTypeString },
      },
      displaySettings: {
        catalog: { val: "[]", type: this.settingValTypeString },
      },
      mediumSettings: Object.fromEntries(
        mediumDefaults.map((id, i) => [
          "slot" + i,
          { val: id, type: this.settingValTypeString },
        ]),
      ),
      largeSettings: Object.fromEntries(
        largeDefaults.map((id, i) => [
          "slot" + i,
          { val: id, type: this.settingValTypeString },
        ]),
      ),
    };
    this.choiceConfigs = [];
    if (!config.runsInApp) return;
    this.registerSettingCategory("requestSettings", "CLIProxy-Api 设置", [
      {
        title: "服务地址",
        desc: "HTTPS 地址，不含管理页面路径",
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
        title: "Provider 筛选",
        desc: "默认留空；多服务卡片需要查询全部",
        type: "text",
        option: { provider: "" },
      },
    ]);
    const settings = this.getSettings();
    let discovered = [];
    try {
      discovered = JSON.parse(settings.displaySettings?.catalog || "[]");
    } catch {}
    if (!Array.isArray(discovered)) discovered = [];
    for (const [family, defaults] of [
      ["medium", mediumDefaults],
      ["large", largeDefaults],
    ]) {
      this.registerSettingCategory(
        family + "Settings",
        family === "medium" ? "中卡片 · 2 × 2" : "大卡片 · 2 × 3",
        defaults.map((id, index) => {
          const cfg = {
            selectOptions: this.choices(discovered),
            style: "compact",
          };
          this.choiceConfigs.push(cfg);
          return {
            title: `第 ${index + 1} 项 · ${["左上", "右上", "左中", "右中", "左下", "右下"][family === "medium" && index > 1 ? index + 2 : index]}`,
            desc: "按位置选择显示项，即可调整排列；多账号请选查询发现的具体窗口",
            type: "select",
            option: { ["slot" + index]: id },
            config: cfg,
          };
        }),
      );
    }
    this.registerSetting([
      {
        title: "CLIProxy-Api 设置",
        icon: { name: "server.rack", color: "#2563EB" },
        onAction: async () => {
          await this.presentSettings(["requestSettings"]);
          return true;
        },
      },
      {
        title: "设置 API Key",
        desc: "仅保存到 Keychain",
        icon: { name: "key", color: "#F59E0B" },
        onAction: async () => {
          await this.setAPIKey();
          return true;
        },
      },
      {
        title: "查询并发现额度项",
        desc: "验证权限，列出可选账号和窗口",
        icon: { name: "arrow.clockwise", color: "#27C46A" },
        onAction: async () => {
          await this.discover();
          return true;
        },
      },
      {
        title: "中卡片排列 · 4 项",
        icon: { name: "square.grid.2x2", color: "#2563EB" },
        onAction: async () => {
          await this.presentSettings(["mediumSettings"]);
          return true;
        },
      },
      {
        title: "大卡片排列 · 6 项",
        icon: { name: "rectangle.grid.2x2", color: "#8B5CF6" },
        onAction: async () => {
          await this.presentSettings(["largeSettings"]);
          return true;
        },
      },
    ]);
  }
  choices(discovered) {
    return [
      ...presets.map((p) => ({ label: p.label, value: p.id })),
      ...discovered.filter(
        (p) => typeof p?.label === "string" && typeof p?.value === "string",
      ),
    ];
  }
  saveCatalog(choices) {
    const value = JSON.stringify(choices);
    this.settings.displaySettings = {
      ...(this.settings.displaySettings || {}),
      catalog: value,
    };
    this.syncCurrentSettings("displaySettings", "catalog", value);
    this.saveSettings(false);
    for (const config2 of this.choiceConfigs)
      config2.selectOptions = this.choices(choices);
  }
  async setAPIKey() {
    const alert = new Alert();
    alert.title = "下游 API Key";
    alert.message = "在 Key Billing 中开启上游额度查询权限。留空保存可清除。";
    alert.addSecureTextField("sk-...");
    alert.addAction("保存");
    alert.addCancelAction("取消");
    if ((await alert.presentAlert()) < 0) return;
    const value = alert.textFieldValue(0).trim();
    if (/\s/.test(value)) {
      await this.notify("未保存", "API Key 不能包含空白字符");
      return;
    }
    if (value) Keychain.set(keychainSlot, value);
    else if (Keychain.contains(keychainSlot)) Keychain.remove(keychainSlot);
    this.saveCatalog([]);
    await this.notify(
      "已保存",
      value ? "请点击“查询并发现额度项”，再调整卡片排列" : "API Key 已清除",
    );
  }
  async loadQuota() {
    const settings = this.currentSettings.requestSettings;
    const origin = String(settings.origin.val || "")
      .trim()
      .replace(/\/+$/, "");
    if (!/^https:\/\/[^/?#@\s]+$/.test(origin))
      throw new Error("请先设置 CLIProxy-Api 的 HTTPS 地址");
    if (!Keychain.contains(keychainSlot))
      throw new Error("请先在设置中保存 API Key");
    const params = ["include", "provider"]
      .map((name) =>
        settings[name].val
          ? name + "=" + encodeURIComponent(settings[name].val.trim())
          : "",
      )
      .filter(Boolean);
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
    } catch {
      if (request.response?.statusCode === 401)
        throw new Error("Key 无效或已换钥，请重新设置");
      if (request.response?.statusCode === 403)
        throw new Error("此 Key 未开启所需的额度查询权限");
      throw new Error("无法读取额度响应，请检查地址与网络");
    }
    if (request.response.statusCode === 401)
      throw new Error("Key 无效或已换钥，请重新设置");
    if (request.response.statusCode === 403)
      throw new Error("此 Key 未开启所需的额度查询权限");
    if (
      request.response.statusCode >= 400 &&
      request.response.statusCode < 500 &&
      request.response.statusCode !== 429
    )
      throw new Error("查询配置无效，请检查地址与筛选条件");
    if (
      request.response.statusCode !== 200 ||
      body.schema_version !== 1 ||
      !body.success ||
      !body.data
    )
      throw new Error("额度查询失败，请检查权限或筛选条件");
    return body;
  }
  async discover() {
    const alert = new Alert();
    alert.title = "额度查询";
    try {
      const response = await this.loadQuota();
      const choices = tileChoices(response);
      this.saveCatalog(choices);
      const items = response.data.upstream?.items || [];
      alert.message =
        `发现 ${choices.length} 个额度窗口。进入中/大卡片排列，可选择预设或具体账号窗口。

` +
        (response.data.upstream?.status === "forbidden" ||
        !response.data.upstream
          ? "上游额度未授权；请在 Key Billing 开启权限。\n"
          : "") +
        items
          .map(
            (item) =>
              `${item.provider} · ${item.name}: ${statusLabels[item.status] || item.status} (${item.windows?.length || 0} 项)`,
          )
          .join("\n");
    } catch (error) {
      alert.message = error instanceof Error ? error.message : "额度查询失败";
    }
    alert.addAction("完成");
    await alert.presentAlert();
  }
  updatedLabel(response) {
    const timestamps = (response.data.upstream?.items || [])
      .flatMap((item) =>
        (item.windows || []).map((window) =>
          Date.parse(window.observed_at || item.fetched_at || ""),
        ),
      )
      .filter(Number.isFinite);
    if (!timestamps.length) {
      const subscriptionTime =
        response.data.subscription?.windows?.[0]?.observed_at;
      if (subscriptionTime) timestamps.push(Date.parse(subscriptionTime));
    }
    return timestamps.length
      ? "数据 " + Utils.time("HH:mm", new Date(Math.min(...timestamps)))
      : "无有效更新时间";
  }
  renderCard(parent, tile, width, height, compact) {
    const card = parent.addStack();
    card.layoutVertically();
    card.setPadding(compact ? 5 : 9, 9, compact ? 5 : 9, 9);
    card.backgroundColor = Color.dynamic(
      new Color("#F1F3F6", 0.85),
      new Color("#20232A", 0.92),
    );
    card.cornerRadius = 8;
    card.size = new Size(width, height);
    const title = card.addText(tile.title);
    title.font = Font.mediumSystemFont(compact ? 9 : 11);
    title.textColor = this.widgetColor;
    title.textOpacity = 0.7;
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.65;
    card.addSpacer(compact ? 1 : 5);
    const valueRow = card.addStack();
    valueRow.centerAlignContent();
    const value = valueRow.addText(tile.amount);
    value.font = Font.boldSystemFont(compact ? 17 : 22);
    value.lineLimit = 1;
    value.minimumScaleFactor = 0.6;
    value.textColor = tile.warning
      ? new Color("#D97706")
      : tile.percent !== void 0 && tile.percent < 20
        ? new Color("#EB5757")
        : this.widgetColor;
    valueRow.addSpacer(3);
    const suffix = valueRow.addText(tile.suffix);
    suffix.font = Font.systemFont(compact ? 8 : 10);
    suffix.textColor = this.widgetColor;
    suffix.textOpacity = 0.6;
    suffix.lineLimit = 1;
    card.addSpacer(compact ? 3 : 6);
    if (tile.percent !== void 0) {
      const bar = card.addStack();
      bar.size = new Size(width - 18, compact ? 4 : 5);
      bar.backgroundColor = new Color("#DADDE3", 0.35);
      bar.cornerRadius = 2;
      if (tile.percent > 0) {
        const fill = bar.addStack();
        fill.size = new Size(
          ((width - 18) * tile.percent) / 100,
          compact ? 4 : 5,
        );
        fill.backgroundColor = new Color(
          tile.warning
            ? "#D97706"
            : tile.percent < 20
              ? "#EB5757"
              : tile.percent < 50
                ? "#F2C94C"
                : "#27C46A",
        );
        fill.cornerRadius = 2;
      }
      bar.addSpacer();
    } else {
      const note = card.addText(
        tile.warning
          ? tile.amount
          : tile.amount === "∞"
            ? "服务商报告不限量"
            : "可用余额",
      );
      note.font = Font.systemFont(compact ? 7 : 9);
      note.textColor = this.widgetColor;
      note.textOpacity = 0.5;
      note.lineLimit = 1;
    }
    if (!compact) {
      card.addSpacer(5);
      const detail = card.addText(tile.detail);
      detail.font = Font.systemFont(8);
      detail.textColor = this.widgetColor;
      detail.textOpacity = 0.55;
      detail.lineLimit = 1;
      detail.minimumScaleFactor = 0.65;
    }
  }
  async render() {
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    GenrateView.setListWidget(widget);
    widget.url = `scriptable:///run/${encodeURIComponent(Script.name())}`;
    widget.refreshAfterDate = new Date(Date.now() + refreshInterval);
    if (this.widgetFamily !== "medium" && this.widgetFamily !== "large") {
      await Utils.renderUnsupport(widget);
      return widget;
    }
    widget.setPadding(10, 10, 10, 10);
    const compact = this.widgetFamily === "medium";
    const size = this.getWidgetSize(this.widgetFamily);
    const width = Math.floor((size.width - 36 - 8) / 2);
    const height = compact ? 50 : 84;
    const header = widget.addStack();
    header.centerAlignContent();
    const icon = header.addImage(SFSymbol.named("gauge.high").image);
    icon.imageSize = new Size(13, 13);
    icon.tintColor = new Color("#2563EB");
    header.addSpacer(5);
    const heading = header.addText("CLIProxy-Api");
    heading.font = Font.boldSystemFont(13);
    heading.textColor = this.widgetColor;
    header.addSpacer();
    widget.addSpacer(compact ? 5 : 9);
    try {
      const response = await this.loadQuota();
      const defaults = compact ? mediumDefaults : largeDefaults;
      const settings =
        this.currentSettings[compact ? "mediumSettings" : "largeSettings"];
      const tiles = selectTiles(
        response,
        defaults.map((id, index) => settings["slot" + index].val || id),
      );
      for (let i = 0; i < tiles.length; i += 2) {
        const outer = widget.addStack();
        outer.layoutHorizontally();
        outer.addSpacer();
        this.renderCard(outer, tiles[i], width, height, compact);
        outer.addSpacer(8);
        this.renderCard(outer, tiles[i + 1], width, height, compact);
        outer.addSpacer();
        if (i + 2 < tiles.length) widget.addSpacer(compact ? 5 : 8);
      }
      widget.addSpacer();
      const footer = widget.addText(
        [
          tiles.some((tile) => tile.stale)
            ? "旧快照"
            : tiles.some((tile) => tile.warning)
              ? "部分额度待确认"
              : tiles.some((tile) => tile.cached)
                ? "缓存"
                : "剩余额度",
          this.updatedLabel(response),
        ]
          .filter(Boolean)
          .join(" · "),
      );
      footer.font = Font.systemFont(8);
      footer.textColor = this.widgetColor;
      footer.textOpacity = 0.55;
      footer.lineLimit = 1;
      footer.rightAlignText();
    } catch (error) {
      widget.addSpacer();
      const message = widget.addText(
        error instanceof Error ? error.message : "额度暂不可用",
      );
      message.font = Font.systemFont(12);
      message.textColor = this.widgetColor;
      message.lineLimit = 3;
      widget.addSpacer();
    }
    return widget;
  }
};
EndAwait(() => Runing(CPAMonitor, args.widgetParameter, false));

await __topLevelAwait__();
