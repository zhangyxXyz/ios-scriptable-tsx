// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: server;

/*
 * author   :  seiun
 * date     :  2026/06/11
 * build    :  2026-07-14 00:00:57
 * desc     :  Done Hub 聚合额度监控，汇总 Codex、Claude、GitHub Copilot 与 OpenCode 渠道用量
 * version  :  1.2.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/DoneHubMonitor.tsx
var dependencyFileName = "Seiun.Env.js";
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, Utils, GenrateView } =
  runtimeRequire(dependencyFileName);
var DONE_HUB_USAGE_PATH = "/api/usage/channels";
var CACHE_KEY = "donehub_usage_channels";
var CODEX_ICON_URL =
  "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/codex.png";
var CLAUDE_ICON_URL =
  "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/claude.png";
var GITHUB_ICON_URL =
  "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/github.png";
var OPENCODE_ICON_URL =
  "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/opencode.png";
var DoneHubMonitor = class extends WidgetBase {
  constructor(scriptName) {
    super(scriptName);
    this.name = "DoneHub聚合监控";
    this.en = "DoneHubMonitor";
    this.widgetParam = args.widgetParameter;
    this.items = [];
    this.dataFetchTime = null;
    this.isRequestSuccess = false;
    this.isDataExpired = false;
    this.statusMessage = "等待刷新";
    this.currentSettings = {
      requestSettings: {
        doneHubBaseUrl: { val: "", type: this.settingValTypeString },
        doneHubApiKey: { val: "", type: this.settingValTypeString },
        queryMode: { val: "Provider", type: this.settingValTypeString },
        providers: { val: "github-copilot", type: this.settingValTypeString },
        channelIds: { val: "", type: this.settingValTypeString },
        limit: { val: 12, type: this.settingValTypeInt },
      },
      displaySettings: {
        pollIntervalMinutes: { val: 5, type: this.settingValTypeInt },
        showUpdateTime: { val: "显示", type: this.settingValTypeString },
      },
    };
    this.storageExpirationMinutes = 5;
    this.Run();
  }
  Run() {
    if (!config.runsInApp) return;
    this.registerSettingCategory("requestSettings", "Done Hub 设置", [
      {
        title: "Done Hub 地址",
        desc: "例如 https://hub.example.com，不要以 / 结尾",
        icon: { name: "link", color: "#2563EB" },
        type: "text",
        option: { doneHubBaseUrl: "" },
        config: { placeholder: "https://hub.example.com", style: "compact" },
      },
      {
        title: "Done Hub Key",
        desc: "填写 done-hub 用户令牌 sk-...",
        icon: { name: "lock.shield", color: "#F2C94C" },
        type: "text",
        option: { doneHubApiKey: "" },
        config: { placeholder: "sk-...", style: "compact" },
      },
      {
        title: "查询方式",
        desc: "按 Provider 或 Channel ID 筛选渠道",
        icon: { name: "line.3.horizontal.decrease.circle", color: "#8B5CF6" },
        type: "select",
        option: { queryMode: "Provider" },
        config: {
          selectOptions: [
            { label: "Provider", value: "Provider" },
            { label: "Channel ID", value: "Channel ID" },
          ],
          defaultShowContent: "Provider",
          multiple: false,
        },
      },
      {
        title: "Provider",
        desc: "例如 github-copilot；多个值用逗号分隔",
        icon: { name: "shippingbox", color: "#24292F" },
        type: "text",
        option: { providers: "github-copilot" },
        config: {
          placeholder: "github-copilot,codex,claude,opencode",
          style: "compact",
        },
      },
      {
        title: "Channel ID",
        desc: "例如 2；多个 ID 用逗号分隔",
        icon: { name: "number.circle", color: "#0EA5E9" },
        type: "text",
        option: { channelIds: "" },
        config: { placeholder: "2 或 1,2", style: "compact" },
      },
      {
        title: "聚合数量",
        desc: "接口 limit 参数，默认 12，最大 50",
        icon: { name: "number", color: "#27C46A" },
        type: "text",
        option: { limit: "12" },
        config: { placeholder: "12", style: "compact" },
      },
    ]);
    this.registerSettingCategory("displaySettings", "显示设置", [
      {
        title: "检查间隔",
        desc: "缓存仍在间隔内时不会发起网络请求",
        icon: { name: "timer", color: "#2F80ED" },
        type: "text",
        option: { pollIntervalMinutes: "5" },
        config: { placeholder: "5", style: "compact" },
      },
      {
        title: "更新时间",
        desc: "显示上次成功拉取或缓存时间",
        icon: { name: "arrow.clockwise", color: "#D11D0C" },
        type: "select",
        option: { showUpdateTime: "显示" },
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
    this.registerSetting([
      {
        title: "Done Hub 设置",
        desc: "配置聚合额度接口地址和 Key",
        icon: { name: "server.rack", color: "#2563EB" },
        onAction: async () => {
          await this.presentSettings(["requestSettings"]);
          return true;
        },
      },
      {
        title: "显示设置",
        icon: { name: "slider.horizontal.3", color: "#56CCF2" },
        onAction: async () => {
          await this.presentSettings(["displaySettings"]);
          return true;
        },
      },
      {
        title: "清除缓存",
        desc: "只清除聚合额度缓存",
        icon: { name: "trash", color: "#EB5757" },
        onAction: async () => {
          this.storage.removeStorage(this.getCacheKey());
          await this.notify(
            "已清除缓存",
            "下次刷新会重新请求 Done Hub 聚合接口",
          );
          return true;
        },
      },
    ]);
  }
  getDoneHubBaseUrl() {
    return String(this.currentSettings.requestSettings.doneHubBaseUrl.val || "")
      .trim()
      .replace(/\/+$/, "");
  }
  getDoneHubApiKey() {
    return String(
      this.currentSettings.requestSettings.doneHubApiKey.val || "",
    ).trim();
  }
  getLimit() {
    const value = Number(this.currentSettings.requestSettings.limit.val);
    if (!Number.isFinite(value) || value <= 0) return 12;
    return Math.max(1, Math.min(Math.floor(value), 50));
  }
  getQueryMode() {
    return String(
      this.currentSettings.requestSettings.queryMode.val || "Provider",
    ) === "Channel ID"
      ? "channel-id"
      : "provider";
  }
  getQueryValue() {
    const settings = this.currentSettings.requestSettings;
    const raw =
      this.getQueryMode() === "channel-id"
        ? settings.channelIds.val
        : settings.providers.val;
    return String(raw || "").trim();
  }
  getPollIntervalMinutes() {
    const value = Number(
      this.currentSettings.displaySettings.pollIntervalMinutes.val,
    );
    if (!Number.isFinite(value) || value < 1) return 5;
    return Math.max(1, Math.min(value, 60));
  }
  getCacheKey() {
    const baseUrl = this.getDoneHubBaseUrl() || "donehub";
    return `${CACHE_KEY}_${baseUrl}_${this.getQueryMode()}_${this.getQueryValue()}_${this.getLimit()}`.replace(
      /[^A-Za-z0-9_-]/g,
      "_",
    );
  }
  maskSecret(value) {
    if (!value) return "未配置";
    if (value.length <= 10) return `${value.slice(0, 2)}***`;
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }
  safeJsonPreview(value, maxLength = 1200) {
    let text = "";
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }
  logRequestStart(label, url) {
    console.log(`[${this.en}] 请求开始: ${label} ${url}`);
  }
  logRequestResponse(label, request, data) {
    console.log(
      `[${this.en}] 请求响应: ${label} HTTP ${this.getHttpStatusLabel(request)} ${this.safeJsonPreview(data)}`,
    );
  }
  logCacheState(label, cache, cacheKey = this.getCacheKey()) {
    console.log(
      `[${this.en}] 缓存状态: ${label} key=${cacheKey} hit=${Boolean(cache?.items)} items=${cache?.items?.length ?? 0} fetchedAt=${cache?.fetchedAt ? Utils.time("yyyy-MM-dd HH:mm:ss", new Date(cache.fetchedAt)) : "none"}`,
    );
  }
  logConfigState() {
    console.log(
      `[${this.en}] 配置状态: baseUrl=${this.getDoneHubBaseUrl() || "未配置"} key=${this.maskSecret(this.getDoneHubApiKey())} ${this.getQueryMode()}=${this.getQueryValue() || "未配置"} limit=${this.getLimit()}`,
    );
  }
  getCachedUsage(ignoreFreshness = false) {
    const interval = ignoreFreshness ? void 0 : this.getPollIntervalMinutes();
    return this.storage.getStorage(this.getCacheKey(), interval);
  }
  useCache(cache, expired, message) {
    this.items = cache.items;
    this.dataFetchTime = cache.fetchedAt;
    this.isRequestSuccess = false;
    this.isDataExpired = expired;
    this.statusMessage = message;
  }
  async requestAggregateUsage() {
    const baseUrl = this.getDoneHubBaseUrl();
    const apiKey = this.getDoneHubApiKey();
    if (!baseUrl) throw new Error("请配置 Done Hub 地址");
    if (!apiKey) throw new Error("请配置 Done Hub Key");
    const queryMode = this.getQueryMode();
    const queryValue = this.getQueryValue();
    if (!queryValue)
      throw new Error(
        queryMode === "channel-id" ? "请配置 Channel ID" : "请配置 Provider",
      );
    const url = `${baseUrl}${DONE_HUB_USAGE_PATH}?${queryMode}=${encodeURIComponent(queryValue)}&limit=${encodeURIComponent(String(this.getLimit()))}`;
    this.logRequestStart("Done Hub 聚合", url);
    const request = new Request(url);
    request.method = "GET";
    request.headers = {
      Authorization: apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`,
      Accept: "application/json",
    };
    request.timeoutInterval = 25;
    let payload;
    try {
      payload = await request.loadJSON();
    } catch (error) {
      const statusCode = Number(request.response?.statusCode ?? 0);
      if (statusCode > 0)
        throw new Error(`Done Hub 请求失败: HTTP ${statusCode}`);
      throw error;
    }
    const response = payload;
    this.logRequestResponse("Done Hub 聚合", request, payload);
    if (response?.success === false)
      throw new Error(response.message || "Done Hub 请求失败");
    const items = response?.data?.items;
    if (!Array.isArray(items)) throw new Error("Done Hub 响应缺少 items");
    console.log(
      `Done Hub 聚合额度请求成功: HTTP ${this.getHttpStatusLabel(request)}，items=${items.length}`,
    );
    return items;
  }
  getHttpStatusLabel(request) {
    const statusCode = Number(request.response?.statusCode ?? 0);
    return statusCode > 0 ? String(statusCode) : "OK";
  }
  async loadUsage() {
    this.logConfigState();
    const freshCache = this.getCachedUsage();
    this.logCacheState("fresh", freshCache);
    if (freshCache?.items) {
      this.useCache(freshCache, false, "使用缓存");
      return;
    }
    try {
      const items = await this.requestAggregateUsage();
      const fetchedAt = Date.now();
      this.storage.setStorage(this.getCacheKey(), { items, fetchedAt });
      this.items = items;
      this.dataFetchTime = fetchedAt;
      this.isRequestSuccess = true;
      this.isDataExpired = false;
      this.statusMessage = "在线";
    } catch (error) {
      console.log(`请求Done Hub聚合额度失败: ${error}`);
      const cache = this.getCachedUsage(true);
      this.logCacheState("请求失败 fallback", cache);
      if (cache?.items) {
        this.useCache(cache, true, "请求失败/使用缓存");
        return;
      }
      this.statusMessage = String(error);
    }
  }
  getProvider(item) {
    const usage = item.data?.usage;
    if (usage && "windows" in usage) return "opencode";
    if (usage && "quota_snapshots" in usage) return "copilot";
    if (usage && "rate_limit" in usage) return "codex";
    if (usage && ("five_hour" in usage || "seven_day" in usage))
      return "claude";
    const text =
      `${item.channel?.name || ""} ${item.channel?.tag || ""}`.toLowerCase();
    if (
      text.includes("opencode") ||
      text.includes("open code") ||
      item.channel?.type === 65
    )
      return "opencode";
    if (text.includes("codex") || text.includes("openai")) return "codex";
    if (text.includes("claude") || text.includes("anthropic")) return "claude";
    if (text.includes("copilot") || item.channel?.type === 64) return "copilot";
    return null;
  }
  getChannelName(item) {
    const name = String(item.channel?.name || "").trim();
    if (name) return this.formatChannelName(name);
    const id = item.channel?.id;
    return id ? `Channel ${id}` : "Done Hub";
  }
  formatChannelName(name) {
    return name
      .replace(/^cpt(?=[-_\s.]?\d)/i, "GPT")
      .replace(/[-_\s]+code[-_\s]+spark/i, " Codex Spark")
      .replace(/[-_\s]+codex[-_\s]+spark/i, " Codex Spark")
      .replace(/\s+/g, " ")
      .trim();
  }
  getWindowLabel(seconds) {
    const minutes = Number(seconds ?? 0) / 60;
    if (Math.abs(minutes - 300) <= 15)
      return { label: "5 小时使用限额", kind: "five-hour" };
    if (Math.abs(minutes - 10080) <= 504)
      return { label: "每周使用限额", kind: "long" };
    if (Math.abs(minutes - 1440) <= 72)
      return { label: "每日使用限额", kind: "long" };
    if (minutes >= 60)
      return { label: `${Math.round(minutes / 60)} 小时`, kind: "long" };
    return { label: "额度", kind: "long" };
  }
  normalizeCodexWindow(item, windowInfo, titlePrefix, suffix, index) {
    if (!windowInfo || typeof windowInfo.used_percent !== "number") return null;
    const channelName = this.getChannelName(item);
    const usedPercent = this.clampPercent(windowInfo.used_percent);
    const windowLabel = this.getWindowLabel(windowInfo.limit_window_seconds);
    return {
      key: `codex-${item.channel?.id ?? index}-${suffix}`,
      provider: "codex",
      title: `${titlePrefix ? `${titlePrefix} ` : ""}${windowLabel.label}`,
      channelName,
      usedPercent,
      remainingPercent: this.clampPercent(100 - usedPercent),
      resetAt:
        typeof windowInfo.reset_at === "number"
          ? windowInfo.reset_at * 1e3
          : null,
      windowKind: windowLabel.kind,
      stale: Boolean(item.data?.stale),
    };
  }
  normalizeClaudeWindow(item, windowInfo, label, kind, index) {
    if (!windowInfo || typeof windowInfo.utilization !== "number") return null;
    const channelName = this.getChannelName(item);
    const usedPercent = this.clampPercent(windowInfo.utilization);
    return {
      key: `claude-${item.channel?.id ?? index}-${label}`,
      provider: "claude",
      title: label,
      channelName,
      usedPercent,
      remainingPercent: this.clampPercent(100 - usedPercent),
      resetAt: this.parseDateMs(windowInfo.resets_at),
      windowKind: kind,
      stale: Boolean(item.data?.stale),
    };
  }
  getCodexCoreRows() {
    const rows = [];
    this.items.forEach((item, index) => {
      if (this.getProvider(item) !== "codex") return;
      const usage = item.data?.usage;
      const primary = this.normalizeCodexWindow(
        item,
        usage?.rate_limit?.primary_window,
        "",
        "primary",
        index,
      );
      const secondary = this.normalizeCodexWindow(
        item,
        usage?.rate_limit?.secondary_window,
        "",
        "secondary",
        index,
      );
      if (primary) rows.push(primary);
      if (secondary) rows.push(secondary);
    });
    return rows;
  }
  getCodexAdditionalRows() {
    const rows = [];
    this.items.forEach((item, index) => {
      if (this.getProvider(item) !== "codex") return;
      const usage = item.data?.usage;
      const additional = usage?.additional_rate_limits ?? [];
      additional.forEach((limit, limitIndex) => {
        const rawName = String(limit.limit_name || "模型").trim();
        const name = this.formatCodexLimitName(rawName);
        const primary = this.normalizeCodexWindow(
          item,
          limit.rate_limit?.primary_window,
          name,
          `${name}-${limitIndex}-primary`,
          index,
        );
        const secondary = this.normalizeCodexWindow(
          item,
          limit.rate_limit?.secondary_window,
          name,
          `${name}-${limitIndex}-secondary`,
          index,
        );
        if (primary) rows.push(primary);
        if (secondary) rows.push(secondary);
      });
    });
    return rows;
  }
  getCodexRows() {
    return [...this.getCodexCoreRows(), ...this.getCodexAdditionalRows()];
  }
  formatCodexLimitName(name) {
    const normalized = name.replace(/[-_\s]+/g, " ").trim();
    if (/spark/i.test(normalized)) return "Codex Spark";
    if (/codex/i.test(normalized))
      return normalized.replace(/\bcodex\b/i, "Codex");
    return normalized;
  }
  getClaudeCoreRows() {
    const rows = [];
    this.items.forEach((item, index) => {
      if (this.getProvider(item) !== "claude") return;
      const usage = item.data?.usage;
      const fiveHour = this.normalizeClaudeWindow(
        item,
        usage?.five_hour,
        "5 小时使用限额",
        "five-hour",
        index,
      );
      const sevenDay = this.normalizeClaudeWindow(
        item,
        usage?.seven_day,
        "7 天使用限额",
        "long",
        index,
      );
      if (fiveHour) rows.push(fiveHour);
      if (sevenDay) rows.push(sevenDay);
    });
    return rows;
  }
  getClaudeRows() {
    return this.getClaudeCoreRows();
  }
  normalizeCopilotSnapshot(
    item,
    snapshot,
    title,
    suffix,
    index,
    fallbackResetAt,
  ) {
    if (!snapshot) return null;
    const unlimited = snapshot.unlimited === true;
    const remainingPercent = unlimited
      ? 100
      : this.clampPercent(Number(snapshot.percent_remaining ?? 0));
    const resetAt = snapshot.quota_reset_at
      ? snapshot.quota_reset_at * 1e3
      : this.parseDateMs(fallbackResetAt);
    return {
      key: `copilot-${item.channel?.id ?? index}-${suffix}`,
      provider: "copilot",
      title,
      channelName: this.getChannelName(item),
      usedPercent: unlimited ? 0 : this.clampPercent(100 - remainingPercent),
      remainingPercent,
      resetAt,
      windowKind: "long",
      stale: Boolean(item.data?.stale),
      unlimited,
    };
  }
  getCopilotRows() {
    const rows = [];
    this.items.forEach((item, index) => {
      if (this.getProvider(item) !== "copilot") return;
      const usage = item.data?.usage;
      const snapshots = usage?.quota_snapshots;
      const premium = this.normalizeCopilotSnapshot(
        item,
        snapshots?.premium_interactions,
        "每月高级请求额度",
        "premium",
        index,
        usage?.quota_reset_date_utc,
      );
      const completions = this.normalizeCopilotSnapshot(
        item,
        snapshots?.completions,
        "每月代码补全额度",
        "completions",
        index,
        usage?.quota_reset_date_utc,
      );
      if (premium) rows.push(premium);
      if (completions) rows.push(completions);
    });
    return rows;
  }
  normalizeOpenCodeWindow(item, windowInfo, index) {
    const key = String(windowInfo.key || "").toLowerCase();
    if (key !== "rolling" && key !== "weekly") return null;
    const hasUsedPercent = typeof windowInfo.used_percent === "number";
    const hasRemainingPercent =
      typeof windowInfo.remaining_percent === "number";
    if (!hasUsedPercent && !hasRemainingPercent) return null;
    const remainingPercent = this.clampPercent(
      hasRemainingPercent
        ? Number(windowInfo.remaining_percent)
        : 100 - Number(windowInfo.used_percent),
    );
    const usedPercent = this.clampPercent(
      hasUsedPercent ? Number(windowInfo.used_percent) : 100 - remainingPercent,
    );
    return {
      key: `opencode-${item.channel?.id ?? index}-${key}`,
      provider: "opencode",
      title: key === "rolling" ? "5 小时使用限额" : "7 天使用限额",
      channelName: this.getChannelName(item),
      usedPercent,
      remainingPercent,
      resetAt:
        typeof windowInfo.reset_at === "number"
          ? windowInfo.reset_at * 1e3
          : null,
      windowKind: key === "rolling" ? "five-hour" : "long",
      stale: Boolean(item.data?.stale),
    };
  }
  getOpenCodeRows() {
    const rows = [];
    this.items.forEach((item, index) => {
      if (this.getProvider(item) !== "opencode") return;
      const usage = item.data?.usage;
      const windows = usage?.windows ?? [];
      for (const key of ["rolling", "weekly"]) {
        const windowInfo = windows.find(
          (window) => String(window.key || "").toLowerCase() === key,
        );
        if (!windowInfo) continue;
        const row = this.normalizeOpenCodeWindow(item, windowInfo, index);
        if (row) rows.push(row);
      }
    });
    return rows;
  }
  getMediumRows() {
    return [
      ...this.getCodexCoreRows().slice(0, 2),
      ...this.getClaudeCoreRows().slice(0, 2),
      ...this.getCopilotRows().slice(0, 2),
      ...this.getOpenCodeRows().slice(0, 2),
    ].slice(0, 4);
  }
  getMediumRowPairs() {
    const providerRows = [
      this.getCodexCoreRows().slice(0, 2),
      this.getClaudeCoreRows().slice(0, 2),
      this.getCopilotRows().slice(0, 2),
      this.getOpenCodeRows().slice(0, 2),
    ];
    const pairs = [];
    let usedSlots = 0;
    for (const rows of providerRows) {
      if (usedSlots >= 4) break;
      for (let i = 0; i < rows.length && usedSlots < 4; i += 2) {
        const first = rows[i];
        if (!first) continue;
        pairs.push([first, rows[i + 1] || null]);
        usedSlots += 2;
      }
    }
    return pairs;
  }
  getLargeCodexRows() {
    return this.getCodexRows().slice(0, 4);
  }
  getLargeClaudeRows() {
    return this.getClaudeCoreRows().slice(0, 2);
  }
  getLargeCopilotRows() {
    return this.getCopilotRows().slice(0, 2);
  }
  getLargeOpenCodeRows() {
    return this.getOpenCodeRows().slice(0, 2);
  }
  getCodexPlanLabel() {
    for (const item of this.items) {
      if (this.getProvider(item) !== "codex") continue;
      const usage = item.data?.usage;
      const planType = usage?.plan_type;
      if (planType) return String(planType).toUpperCase();
    }
    return this.getLargeCodexRows().length > 0 ? "PRO" : "未连接";
  }
  getClaudePlanLabel() {
    return this.getLargeClaudeRows().length > 0 ? "PRO" : "未连接";
  }
  getCopilotPlanLabel() {
    for (const item of this.items) {
      if (this.getProvider(item) !== "copilot") continue;
      const usage = item.data?.usage;
      if (usage?.copilot_plan) return String(usage.copilot_plan).toUpperCase();
    }
    return this.getLargeCopilotRows().length > 0 ? "已连接" : "未连接";
  }
  clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }
  parseDateMs(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }
  formatResetTime(ms) {
    if (!ms) return "使用后滚动计量";
    return Utils.time("yyyy年MM月dd日 HH:mm", new Date(ms));
  }
  getResetText(row) {
    if (!row.resetAt) return this.formatResetTime(row.resetAt);
    return `${row.stale ? "缓存 " : "重置 "}${this.formatResetTime(row.resetAt)}`;
  }
  formatUpdateTime() {
    if (!this.dataFetchTime) return "暂无缓存";
    return Utils.time("HH:mm:ss", new Date(this.dataFetchTime));
  }
  getStatusColor() {
    if (this.isRequestSuccess) return new Color("#27C46A");
    return Color.red();
  }
  getFooterText() {
    if (this.currentSettings.displaySettings.showUpdateTime.val === "显示") {
      return `${this.statusMessage}  ↻ ${this.formatUpdateTime()}`;
    }
    return this.statusMessage;
  }
  getLayoutMetrics(compact = false) {
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const cardGap = 10;
    const contentInset = 16;
    const widgetSize = this.getWidgetSize(
      this.widgetFamily === "large" ? "large" : "medium",
    );
    const cardWidth = Math.floor(
      (widgetSize.width -
        padding.left -
        padding.right -
        contentInset -
        cardGap) /
        2,
    );
    const contentWidth = cardWidth * 2 + cardGap;
    const cardHeight = compact ? 52 : 84;
    const progressWidth = cardWidth - 20;
    return {
      padding,
      cardGap,
      contentWidth,
      cardWidth,
      cardHeight,
      progressWidth,
    };
  }
  addAlignedRow(widget, contentWidth) {
    const outer = widget.addStack();
    outer.layoutHorizontally();
    outer.addSpacer();
    const inner = outer.addStack();
    inner.layoutHorizontally();
    inner.centerAlignContent();
    inner.size = new Size(contentWidth, 0);
    outer.addSpacer();
    return inner;
  }
  renderProgressBar(stack, percent, width, height = 7) {
    const bar = stack.addStack();
    bar.layoutHorizontally();
    bar.backgroundColor = new Color("#DADDE3", 0.35);
    bar.cornerRadius = Math.floor(height / 2);
    bar.size = new Size(width, height);
    const fillWidth = Math.max(
      height,
      Math.round((width * this.clampPercent(percent)) / 100),
    );
    const fill = bar.addStack();
    fill.backgroundColor =
      percent < 20
        ? new Color("#EB5757")
        : percent < 50
          ? new Color("#F2C94C")
          : new Color("#27C46A");
    fill.cornerRadius = Math.floor(height / 2);
    fill.size = new Size(fillWidth, height);
    bar.addSpacer();
  }
  getProviderDisplayName(provider) {
    if (provider === "codex") return "Codex";
    if (provider === "claude") return "Claude";
    if (provider === "copilot") return "GitHub Copilot";
    return "OpenCode";
  }
  renderProviderMark(parent, provider) {
    const mark = parent.addText(
      provider === "codex"
        ? "C"
        : provider === "claude"
          ? "A"
          : provider === "copilot"
            ? "G"
            : "O",
    );
    mark.textColor =
      provider === "codex"
        ? new Color("#0F9F58")
        : provider === "claude"
          ? new Color("#D97706")
          : provider === "copilot"
            ? new Color("#24292F")
            : new Color("#4F46E5");
    mark.font = Font.boldSystemFont(10);
    mark.lineLimit = 1;
    mark.minimumScaleFactor = 0.8;
  }
  async addProviderIcon(parent, provider, size = 16) {
    const iconUrl =
      provider === "codex"
        ? CODEX_ICON_URL
        : provider === "claude"
          ? CLAUDE_ICON_URL
          : provider === "copilot"
            ? GITHUB_ICON_URL
            : OPENCODE_ICON_URL;
    try {
      const iconImage = await this.getImageByUrl(iconUrl);
      if (iconImage) {
        const icon = parent.addImage(iconImage);
        icon.imageSize = new Size(size, size);
        icon.cornerRadius = Math.max(3, Math.floor(size / 5));
        if (provider === "copilot") {
          icon.tintColor = Color.dynamic(
            new Color("#24292F"),
            new Color("#F0F6FC"),
          );
        }
        return;
      }
    } catch (error) {
      console.log(
        `加载${this.getProviderDisplayName(provider)}图标失败: ${error}`,
      );
    }
    const fallback = parent.addImage(
      SFSymbol.named(
        provider === "codex"
          ? "terminal.fill"
          : provider === "claude"
            ? "bolt.horizontal.circle.fill"
            : "chevron.left.forwardslash.chevron.right",
      ).image,
    );
    fallback.imageSize = new Size(size, size);
    fallback.tintColor =
      provider === "codex"
        ? new Color("#0F9F58")
        : provider === "claude"
          ? new Color("#D97706")
          : provider === "copilot"
            ? new Color("#24292F")
            : new Color("#4F46E5");
  }
  renderRowCard(
    parent,
    row,
    cardWidth,
    cardHeight,
    progressWidth,
    compact = false,
  ) {
    const card = parent.addStack();
    card.layoutVertically();
    card.setPadding(compact ? 7 : 9, 10, compact ? 7 : 9, 10);
    card.backgroundColor = Color.dynamic(
      new Color("#FFFFFF", 0.78),
      new Color("#20232A", 0.92),
    );
    card.cornerRadius = 8;
    card.size = new Size(cardWidth, cardHeight);
    const title = card.addText(
      compact
        ? `${this.getProviderDisplayName(row.provider)} · ${row.title}`
        : row.title,
    );
    title.textColor = this.widgetColor;
    title.font = Font.mediumSystemFont(compact ? 8 : 9);
    title.textOpacity = 0.68;
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.65;
    card.addSpacer(compact ? 2 : 3);
    const valueRow = card.addStack();
    valueRow.layoutHorizontally();
    valueRow.centerAlignContent();
    const value = valueRow.addText(
      row.unlimited ? "∞" : `${Math.round(row.remainingPercent)}%`,
    );
    value.textColor =
      row.remainingPercent < 20 ? Color.red() : this.widgetColor;
    value.font = Font.boldSystemFont(compact ? 16 : 19);
    value.minimumScaleFactor = 0.65;
    value.lineLimit = 1;
    valueRow.addSpacer(4);
    const label = valueRow.addText(row.unlimited ? "不限" : "剩余");
    label.textColor = this.widgetColor;
    label.font = Font.boldSystemFont(compact ? 11 : 13);
    label.minimumScaleFactor = 0.8;
    label.lineLimit = 1;
    card.addSpacer(compact ? 3 : 4);
    this.renderProgressBar(
      card,
      row.unlimited ? 100 : row.remainingPercent,
      progressWidth,
      compact ? 5 : 7,
    );
    if (!compact) {
      card.addSpacer(5);
      const reset = card.addText(this.getResetText(row));
      reset.textColor = this.widgetColor;
      reset.font = Font.systemFont(9);
      reset.textOpacity = 0.55;
      reset.lineLimit = 1;
      reset.minimumScaleFactor = 0.7;
    }
  }
  renderRows(widget, rows, compact = false) {
    return this.renderRowPairs(
      widget,
      this.getSequentialRowPairs(rows),
      compact,
    );
  }
  getSequentialRowPairs(rows) {
    const pairs = [];
    for (let i = 0; i < rows.length; i += 2) {
      pairs.push([rows[i], rows[i + 1] || null]);
    }
    return pairs;
  }
  renderRowPairs(widget, rowPairs, compact = false) {
    const { cardGap, contentWidth, cardWidth, cardHeight, progressWidth } =
      this.getLayoutMetrics(compact);
    if (rowPairs.length === 0) {
      widget.addSpacer();
      const empty = widget.addText(this.statusMessage || "暂无额度数据");
      empty.textColor = Color.red();
      empty.font = Font.mediumSystemFont(13);
      empty.centerAlignText();
      widget.addSpacer();
      return;
    }
    for (let i = 0; i < rowPairs.length; i += 1) {
      const [first, second] = rowPairs[i];
      const rowStack = this.addAlignedRow(widget, contentWidth);
      rowStack.spacing = cardGap;
      if (first)
        this.renderRowCard(
          rowStack,
          first,
          cardWidth,
          cardHeight,
          progressWidth,
          compact,
        );
      else rowStack.addSpacer(cardWidth);
      if (second)
        this.renderRowCard(
          rowStack,
          second,
          cardWidth,
          cardHeight,
          progressWidth,
          compact,
        );
      else rowStack.addSpacer(cardWidth);
      if (i + 1 < rowPairs.length) widget.addSpacer(compact ? 6 : 8);
    }
  }
  renderHeader(widget) {
    const header = this.addAlignedRow(
      widget,
      this.getLayoutMetrics().contentWidth,
    );
    const icon = header.addImage(SFSymbol.named("gauge.high").image);
    icon.imageSize = new Size(16, 16);
    icon.tintColor = new Color("#2563EB");
    header.addSpacer(6);
    const title = header.addText("Done Hub");
    title.textColor = this.widgetColor;
    title.font = Font.boldSystemFont(15);
    title.textOpacity = 0.86;
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.65;
    header.addSpacer();
  }
  async renderProviderHeader(widget, provider) {
    const header = this.addAlignedRow(
      widget,
      this.getLayoutMetrics().contentWidth,
    );
    await this.addProviderIcon(header, provider, 16);
    header.addSpacer(6);
    const copilotChannels = this.items
      .filter((item) => this.getProvider(item) === "copilot")
      .map((item) => item.channel);
    const copilotChannel = copilotChannels[0];
    const titleText =
      provider === "codex"
        ? `Codex | ${this.getCodexPlanLabel()}`
        : provider === "claude"
          ? `Claude | ${this.getClaudePlanLabel()}`
          : provider === "copilot"
            ? `GitHub Copilot | ${this.getCopilotPlanLabel()}${copilotChannels.length > 1 ? ` · #${copilotChannel?.id ?? "-"}` : ""}`
            : "OpenCode | GO";
    const title = header.addText(titleText);
    title.textColor = this.widgetColor;
    title.font = Font.boldSystemFont(15);
    title.textOpacity = 0.86;
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.65;
    header.addSpacer();
  }
  renderFooter(widget) {
    const footer = this.addAlignedRow(
      widget,
      this.getLayoutMetrics().contentWidth,
    );
    footer.addSpacer();
    const status = footer.addText(this.statusMessage);
    status.textColor = this.getStatusColor();
    status.font = new Font("SF Mono", 10);
    status.textOpacity = 0.5;
    status.lineLimit = 1;
    status.minimumScaleFactor = 0.7;
    if (this.currentSettings.displaySettings.showUpdateTime.val === "显示") {
      footer.addSpacer(5);
      const timeIcon = footer.addImage(SFSymbol.named("arrow.clockwise").image);
      timeIcon.imageSize = new Size(10, 10);
      timeIcon.tintColor = this.getStatusColor();
      timeIcon.imageOpacity = 0.5;
      footer.addSpacer(5);
      const time = footer.addText(this.formatUpdateTime());
      time.textColor = this.getStatusColor();
      time.font = new Font("SF Mono", 10);
      time.textOpacity = 0.5;
      time.lineLimit = 1;
      time.minimumScaleFactor = 0.7;
    }
  }
  async renderMedium(widget) {
    GenrateView.setListWidget(widget);
    const { padding } = this.getLayoutMetrics(true);
    widget.setPadding(padding.top, padding.left, padding.bottom, padding.right);
    this.renderHeader(widget);
    widget.addSpacer(8);
    this.renderRowPairs(widget, this.getMediumRowPairs(), true);
    widget.addSpacer(8);
    this.renderFooter(widget);
    return widget;
  }
  async renderLarge(widget) {
    GenrateView.setListWidget(widget);
    const { padding } = this.getLayoutMetrics();
    widget.setPadding(padding.top, padding.left, padding.bottom, padding.right);
    const sections = [
      { provider: "codex", rows: this.getLargeCodexRows() },
      { provider: "claude", rows: this.getLargeClaudeRows() },
      { provider: "copilot", rows: this.getLargeCopilotRows() },
      { provider: "opencode", rows: this.getLargeOpenCodeRows() },
    ].filter((section) => section.rows.length > 0);
    if (sections.length === 0) {
      this.renderRows(widget, []);
    } else {
      for (let index = 0; index < sections.length; index += 1) {
        const section = sections[index];
        await this.renderProviderHeader(widget, section.provider);
        widget.addSpacer(10);
        this.renderRows(widget, section.rows);
        if (index + 1 < sections.length) widget.addSpacer(8);
      }
    }
    widget.addSpacer(8);
    this.renderFooter(widget);
    return widget;
  }
  async render() {
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    await this.loadUsage();
    widget.url = `scriptable:///run/${encodeURIComponent(Script.name())}`;
    switch (this.widgetFamily) {
      case "medium":
        return await this.renderMedium(widget);
      case "large":
        return await this.renderLarge(widget);
      default:
        await Utils.renderUnsupport(widget);
        return widget;
    }
  }
};
EndAwait(() => Runing(DoneHubMonitor, args.widgetParameter, false));

await __topLevelAwait__();
