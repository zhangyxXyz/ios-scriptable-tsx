// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: gauge;

/*
 * author   :  seiunzhang
 * date     :  2026/11/15
 * build    :  2026-11-26 03:31:33
 * desc     :  CLIProxy-Api 额度卡片，支持 Keychain、查询发现、小号一项、中号四项与大号六项自由排列
 * version  :  1.1.12
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
var smallDefaults = ["codex-weekly"];
var mediumDefaults = [
  "codex-weekly",
  "deepseek-balance",
  "opencode-five",
  "copilot-premium",
];
var largeDefaults = [
  "codex-weekly",
  "deepseek-balance",
  "opencode-five",
  "opencode-weekly",
  "copilot-premium",
  "copilot-completions",
];
var geminiGroup = /^gemini\b/i;
var claudeGptGroup = /^claude\s*(and|&|\/)\s*gpt\b/i;
var fiveHourWindow = /5[ -]*(hours?|h|小时)|five.hour/i;
var weeklyWindow = /weekly|week|7.day|周|七天/i;
var codexCreditBalance = /^(credit balance|credits)$/i;
function isAntigravityProvider(provider) {
  return provider === "agy" || provider === "antigravity";
}
function matchesProvider(preset, provider) {
  return preset?.group
    ? isAntigravityProvider(provider)
    : provider === preset?.provider;
}
function matchesPreset(preset, row) {
  return (
    matchesProvider(preset, row.provider) &&
    (!preset.group || preset.group.test(row.title)) &&
    preset.match.test(row.title)
  );
}
var presets = [
  {
    id: "codex-weekly",
    provider: "codex",
    label: "Codex · Weekly limit",
    match: /^(weekly( limit)?|7.day( limit)?|每?周(使用限额)?|七天(限额)?)$/i,
  },
  {
    id: "codex-credits",
    provider: "codex",
    label: "Codex · Credit balance",
    match: codexCreditBalance,
  },
  {
    id: "deepseek-balance",
    provider: "deepseek",
    label: "DeepSeek · Balance",
    match: /balance|余额/i,
  },
  {
    id: "copilot-premium",
    provider: "copilot",
    label: "Copilot · 每月高级请求额度",
    match: /premium|高级|credit/i,
  },
  {
    id: "copilot-completions",
    provider: "copilot",
    label: "Copilot · 每月代码补全额度",
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
    label: "OpenCode · 5-hour limit",
    match: /rolling|5[ -]*(hours?|h|小时)|five.hour/i,
  },
  {
    id: "opencode-weekly",
    provider: "opencode",
    label: "OpenCode · Weekly limit",
    match: /weekly|week|7.day|周|七天/i,
  },
  {
    id: "opencode-monthly",
    provider: "opencode",
    label: "OpenCode · Monthly limit",
    match: /month|月/i,
  },
  {
    id: "claude-five",
    provider: "claude",
    label: "Claude · 5-hour limit",
    match: fiveHourWindow,
  },
  {
    id: "claude-weekly",
    provider: "claude",
    label: "Claude · Weekly limit",
    match: /weekly|week|7.day|周|七天/i,
  },
  {
    id: "gemini-five",
    provider: "gemini",
    label: "Antigravity Gemini · 5-hour limit",
    match: fiveHourWindow,
    group: geminiGroup,
  },
  {
    id: "gemini-weekly",
    provider: "gemini",
    label: "Antigravity Gemini · Weekly limit",
    match: weeklyWindow,
    group: geminiGroup,
  },
  {
    id: "antigravity-claude-five",
    provider: "antigravity",
    label: "Antigravity Claude/GPT · 5-hour limit",
    match: fiveHourWindow,
    group: claudeGptGroup,
  },
  {
    id: "antigravity-claude-weekly",
    provider: "antigravity",
    label: "Antigravity Claude/GPT · Weekly limit",
    match: weeklyWindow,
    group: claudeGptGroup,
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
    const account = provider === "subscription" ? "" : identity.slice(0, 8);
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
            ? "Credits"
            : unit;
      } else if (percent !== void 0) {
        amount = number(percent) + "%";
        suffix = "剩余";
      } else if (finite(window.remaining)) {
        amount = number(window.remaining);
        suffix =
          provider === "codex" && codexCreditBalance.test(window.label)
            ? "积分"
            : "剩余";
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
        plan: part.plan_name,
        resetAt: window.reset_at,
        observedAt: window.observed_at || part.fetched_at,
        cached: !!part.cached,
        id: JSON.stringify([identity, window.label, unit]),
        provider,
        displayProvider: isAntigravityProvider(provider)
          ? antigravityDisplayName(window.label)
          : void 0,
        title: window.label,
        account,
        amount,
        hasQuotaData:
          typeof window.label === "string" &&
          !!window.label.trim() &&
          (!!window.unlimited ||
            !!part.unlimited ||
            percent !== void 0 ||
            finite(window.remaining)),
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
        plan: part.plan_name,
        observedAt: part.fetched_at,
        cached: !!part.cached,
        id: JSON.stringify([identity, "unlimited", ""]),
        provider,
        title: "不限额",
        account,
        amount: "∞",
        suffix: "不限量",
        detail: statusLabels[part.status] || "",
        warning: part.status !== "ok",
        stale: !!part.stale,
        hasQuotaData: true,
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
function attachPlans(response, files) {
  const items = response.data.upstream?.items || [];
  for (const item of items) {
    if (item.plan_name || !item.refresh_supported) continue;
    const provider = normalizeProvider(item.provider);
    const matchingItems = items.filter(
      (other) => normalizeProvider(other.provider) === provider,
    );
    const matchingFiles = files.filter(
      (file) => !file.disabled && normalizeProvider(file.category) === provider,
    );
    if (
      matchingItems.length === 1 &&
      matchingFiles.length === 1 &&
      matchingFiles[0].quota?.plan
    )
      item.plan_name = matchingFiles[0].quota.plan;
  }
}
function displayTitle(row) {
  const provider =
    row.provider === "agy"
      ? "Antigravity CLI"
      : row.provider === "antigravity"
        ? "Antigravity"
        : row.provider;
  return (
    presets.find((preset) => matchesPreset(preset, row))?.label ||
    `${provider} · ${row.title}`
  );
}
function antigravityDisplayName(label) {
  if (geminiGroup.test(label)) return "Gemini";
  if (claudeGptGroup.test(label)) return "Antigravity Claude/GPT";
}
function distinctWindows(response, now = Date.now()) {
  return Array.from(
    new Map(flattenQuota(response, now).map((row) => [row.id, row])).values(),
  );
}
function layoutChoices(discovered, selected) {
  const choices =
    discovered?.map(({ label, value, presetIds }) => ({
      label,
      value: presetIds?.includes(selected) ? selected : value,
    })) ??
    presets
      .filter((preset) => preset.id !== "codex-credits")
      .map((preset) => ({ value: preset.id, label: preset.label }));
  if (!choices.some((choice) => choice.value === selected))
    choices.push({ value: selected, label: "当前项暂无可用额度" });
  return choices;
}
function discoverChoices(response) {
  const all = distinctWindows(response);
  const rows = all.filter((row) => row.hasQuotaData);
  const aliases = /* @__PURE__ */ new Map();
  for (const preset of presets) {
    const matches = all.filter((row) => matchesPreset(preset, row));
    if (matches.length !== 1) continue;
    const id = matches[0].id;
    const ids = aliases.get(id) || [];
    ids.push(preset.id);
    aliases.set(id, ids);
  }
  const covered = /* @__PURE__ */ new Set();
  const choices = presets.flatMap((preset) => {
    const matches = rows.filter(
      (row) => !covered.has(row.id) && matchesPreset(preset, row),
    );
    return matches.map((row) => {
      covered.add(row.id);
      const windowId = "window:" + row.id;
      const label =
        row.provider === "agy"
          ? preset.label.replace("Antigravity ", "Antigravity CLI ")
          : preset.label;
      const sameName = matches.filter(
        (other) =>
          other.provider === row.provider && other.account === row.account,
      );
      const title =
        sameName.length > 1
          ? `${label} (${sameName.indexOf(row) + 1}) · ${row.title}`
          : label;
      const currency =
        matches.length > 1 && (row.suffix === "CNY" || row.suffix === "USD")
          ? row.suffix
          : "";
      return {
        value: windowId,
        label: [title, currency, row.account].filter(Boolean).join(" · "),
        presetIds: aliases.get(row.id),
      };
    });
  });
  for (const row of rows) {
    if (covered.has(row.id)) continue;
    choices.push({
      value: "window:" + row.id,
      presetIds: aliases.get(row.id),
      label: [
        displayTitle(row),
        row.suffix === "CNY" || row.suffix === "USD" ? row.suffix : "",
        row.account,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }
  return choices;
}
function selectTiles(response, selections, now = Date.now()) {
  const rows = distinctWindows(response, now);
  return selections.map((selection) => {
    const preset = presets.find((p) => p.id === selection);
    const matches = preset
      ? rows.filter((row) => matchesPreset(preset, row))
      : rows.filter((row) => "window:" + row.id === selection);
    if (matches.length === 1)
      return {
        ...matches[0],
        title: preset?.label || displayTitle(matches[0]),
      };
    const part =
      preset?.provider === "subscription"
        ? response.data.subscription
        : response.data.upstream;
    const items =
      part?.items?.filter((item) =>
        matchesProvider(preset, normalizeProvider(item.provider)),
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
      displayProvider: preset?.group ? preset.label.split(" · ")[0] : void 0,
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
      hasQuotaData: false,
    };
  });
}

// src/widgets/cpa-cache.ts
var QuotaRequestError = class extends Error {
  constructor(message, discardCache = false) {
    super(message);
    this.discardCache = discardCache;
  }
};
function responseStatus(response, localCache = false) {
  const parts = [
    response.data.subscription,
    response.data.upstream,
    ...(response.data.upstream?.items || []),
  ].filter((part) => !!part);
  const stale = parts.some((part) => part.stale || part.status === "stale");
  const failed = parts.some(
    (part) => part.status === "error" || part.refresh_status === "error",
  );
  const partial =
    !!response.partial || parts.some((part) => part.status !== "ok");
  return {
    status: stale
      ? failed
        ? "请求失败/使用缓存"
        : "使用旧数据"
      : failed || partial
        ? "部分查询失败"
        : localCache || parts.some((part) => part.cached)
          ? ""
          : "在线",
    warning: stale || failed || partial,
  };
}
async function loadCachedQuota(options) {
  const { scope, now } = options;
  const cache =
    options.cache?.scope === scope && options.cache.fetchedAt <= now
      ? options.cache
      : null;
  if (!cache && options.cache) options.clear();
  if (!options.force && cache && now - cache.fetchedAt < 3e5)
    return { ...cache, ...responseStatus(cache.response, true) };
  try {
    const response = await options.request();
    const snapshot = { scope, response, fetchedAt: now };
    options.save(snapshot);
    return { ...snapshot, ...responseStatus(response) };
  } catch (error) {
    if (error instanceof QuotaRequestError && error.discardCache) {
      options.clear();
      throw error;
    }
    if (cache) return { ...cache, status: "请求失败/使用缓存", warning: true };
    throw error;
  }
}

// src/scripts/CPAMonitor.tsx
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, GenrateView, Utils } = runtimeRequire("Seiun.Env.js");
var keychainSlot = "CPAMonitor:downstream-key";
var refreshInterval = 5 * 60 * 1e3;
var quotaCacheKey = "cpa-quota-snapshot-v1";
var quotaChoicesKey = "cpa-quota-choices-v1";
var antigravityIcon =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAABgFBMVEVenJ6fol3TZVgxi/hdjOjfnTExiffwazeacphkZP+0bnH1WVsAAP8wifM8n7ucyVl1e7VaivPHkEc2nND/FRU/f792r3RWivTfUVbv7x2uaaYiY/JRq6aHe8ZbiPCGiIj0Vjl/f391vH2ayVbasiqexE////9/vz/eUVf//3Fxcbh66no5obfTxDU8t7c/v3/wpiVNr5mgbqlbtYqHhNh5yXi/P39nw4y/Pz+qVVV8w2uqqlW6uD66wz6Gw2DfXz8Af3+/vz+ibab5aTTLZolqvnrhryMA/wBcf9T/qlU5n7rEyEGJesMAAAAzifdKiPQ2ltEzkfU+f//tVklQhdJGpaoAf/8whvhwfM2KdLAA//+raI0yiPpVqv9xt3NTqZcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABotMUjAAAAYHRSTlP9/v4e/vyf+fwC/goBbvz4/xn/+AIE9J2bDBQGDPRe/2cCCRZUawEETAIDDpz6CASxXWWn//8E/wQDdwP8zb4IAgS/sP5uMwH/A0P/lgD8/f7+Bfv//gJS/v4B/tAD/f5eha0NAAADOklEQVR42u2X61ObQBTFNy6JwYCaJj6i0ai1Vqu1rY/at32/LxiiJEGI//9/0bvALhAWgtPpTD94vzjj5Pz2nLMXJiHwl0PuAP8S8ANg+2m5PD39aeMcarcH7MFXlDMAzkY2IQvwAbbLZQFAQvN2gNew/TgO6G3Ai9sA9qAV6svlKZxer7ebkSID0Hr7602pdI9NCOjVas3CgIfwYK4UTABghGW5BRmg1bo/xwGl0pSw0KwVBMQMsJnJtSABfIO4AQTMhCZqMgLJMjAaLS5yQIBAC81CgH14NzdieoLT6XSqIYFZaBYAbGIC1I9IOJ1qtXodeJDtQhqwBa9Omfzm5iZEMMI1IywXAuzA4mlCT+aHnCDJQNIJ9oPzr64EYH44RAIiduH5RMAWfDkTekW5xBGEz8sFAPtwfEZQfkVmLy58/eXlgBOqkzvYgS3i61GO0wgJA0ZAxAq8nAB4As/iesMwTAR8HwwGQ4Y4gpWJgGMi9IY/pmkyD4M1JHzEkid00CYkqfcJJiMwEysYMg+wCW2U+/quYcQJpsJMrB3Bo1zAIVaQ0gcAU0HEye8JgDYcKCl9RFBO1vJLdOBwtpHWxwhKHdQcQBt+SvUxwnouYAEOGjF9N/aHE5bGShiL4MT0XaPSp9SitOJ2OcBkGZxMgA00dn6F8v9T3YgI6+gzC7AAekPodQDLsx3HUS2AfhRiCawcB5Uu1/eBCqsaBSr2yayDlgF4jwl4/grQOJpCn/eAJXgZAAt0fr5rW1qi3lU0Z8gykLEEIYCiIjG2ykOMZSCJO4gCWONP6YIIoaxrlhRgxQzYTurd5UG4DphBlQE0h4ar1+0nagpH9W/CR9Q1VQIIPPoNaqrsm4AXOkzWGAFsx+3yBqUA26b8wao7TgrgcQPYoCf/PuXxa8Z1tsYBmmoLA7YtB2ie5YYe6uIzJHoM8hpM9mgo0T0TXgDNXgFJiKgnEttU/wao6mQDNM8e/xwJnxU9/wbETWhW5FQTAEusQD8vQKIGnjVwwPX6JL1/WEjQowjUKHh+QIg+zgGV4B1aSO8TgpVxBYC/Qwvp2WWu+kcaAoAvXVeH7AVK3QW2VnHd/t3vxv8F8Accv1SFSyU+ZgAAAABJRU5ErkJggg==";
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
      smallSettings: {
        slot0: { val: smallDefaults[0], type: this.settingValTypeString },
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
    this.statusMessage = "等待刷新";
    this.statusWarning = false;
    this.dataFetchTime = null;
    this.providerIcons = {};
    this.choiceConfigs = {};
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
    for (const [family, defaults] of [
      ["small", smallDefaults],
      ["medium", mediumDefaults],
      ["large", largeDefaults],
    ]) {
      const category = family + "Settings";
      this.choiceConfigs[category] = {};
      this.registerSettingCategory(
        category,
        family === "small"
          ? "小卡片 · 1 项"
          : family === "medium"
            ? "中卡片 · 2 × 2"
            : "大卡片 · 2 × 3",
        defaults.map((id, index) => {
          const slot = "slot" + index;
          const cfg = { style: "compact" };
          this.choiceConfigs[category][slot] = cfg;
          return {
            title:
              family === "small"
                ? "第 1 项 · 显示额度"
                : `第 ${index + 1} 项 · ${["左上", "右上", "左中", "右中", "左下", "右下"][family === "medium" && index > 1 ? index + 2 : index]}`,
            desc: "按位置选择显示项，即可调整排列；多账号请选查询发现的具体窗口",
            type: "select",
            option: { [slot]: id },
            config: cfg,
          };
        }),
      );
    }
    this.registerSetting([
      {
        title: "清除缓存",
        desc: "只清除本地额度缓存",
        icon: { name: "trash", color: "#EB5757" },
        onAction: async () => {
          this.storage.removeStorage(quotaCacheKey);
          await this.notify("已清除缓存", "下次刷新会重新请求额度");
          return true;
        },
      },
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
        title: "小卡片排列 · 1 项",
        icon: { name: "square", color: "#2563EB" },
        onAction: async () => {
          await this.presentLayout("smallSettings");
          return true;
        },
      },
      {
        title: "中卡片排列 · 4 项",
        icon: { name: "square.grid.2x2", color: "#2563EB" },
        onAction: async () => {
          await this.presentLayout("mediumSettings");
          return true;
        },
      },
      {
        title: "大卡片排列 · 6 项",
        icon: { name: "rectangle.grid.2x2", color: "#8B5CF6" },
        onAction: async () => {
          await this.presentLayout("largeSettings");
          return true;
        },
      },
    ]);
  }
  async presentLayout(category) {
    const discovered = this.discoveredChoices();
    for (const [slot, config2] of Object.entries(this.choiceConfigs[category]))
      config2.selectOptions = layoutChoices(
        discovered,
        this.currentSettings[category][slot].val,
      );
    await this.presentSettings([category]);
  }
  discoveredChoices() {
    const snapshot = this.storage.getStorage(quotaChoicesKey);
    return snapshot?.scope === this.quotaScope() ? snapshot.choices : null;
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
    this.storage.removeStorage(quotaCacheKey);
    this.storage.removeStorage(quotaChoicesKey);
    if (value) Keychain.set(keychainSlot, value);
    else if (Keychain.contains(keychainSlot)) Keychain.remove(keychainSlot);
    await this.notify(
      "已保存",
      value ? "请点击“查询并发现额度项”，再调整卡片排列" : "API Key 已清除",
    );
  }
  quotaScope() {
    const settings = this.currentSettings.requestSettings;
    return this.md5(
      JSON.stringify([
        settings.origin.val.trim().replace(/\/+$/, ""),
        settings.include.val.trim(),
        settings.provider.val.trim(),
        Keychain.contains(keychainSlot) ? Keychain.get(keychainSlot) : "",
      ]),
    );
  }
  async loadQuota(discover = false) {
    const loaded = await loadCachedQuota({
      scope: this.quotaScope(),
      now: Date.now(),
      force: discover,
      cache: this.storage.getStorage(quotaCacheKey),
      request: () => this.fetchQuota(),
      save: (value) => {
        this.storage.setStorage(quotaCacheKey, value);
        if (discover)
          this.storage.setStorage(quotaChoicesKey, {
            scope: value.scope,
            choices: discoverChoices(value.response),
          });
      },
      clear: () => this.storage.removeStorage(quotaCacheKey),
    });
    this.statusMessage = loaded.status;
    this.statusWarning = loaded.warning;
    const times = (loaded.response.data.upstream?.items || [])
      .flatMap((item) =>
        (item.windows || []).map((window) =>
          Date.parse(window.observed_at || item.fetched_at || ""),
        ),
      )
      .filter(Number.isFinite);
    this.dataFetchTime = times.length ? Math.min(...times) : loaded.fetchedAt;
    return loaded.response;
  }
  async fetchQuota() {
    const settings = this.currentSettings.requestSettings;
    const origin = String(settings.origin.val || "")
      .trim()
      .replace(/\/+$/, "");
    if (!/^https:\/\/[^/?#@\s]+$/.test(origin))
      throw new QuotaRequestError("请先设置 CLIProxy-Api 的 HTTPS 地址", true);
    if (!Keychain.contains(keychainSlot))
      throw new QuotaRequestError("请先在设置中保存 API Key", true);
    const params = ["include", "provider"]
      .map((name) =>
        settings[name].val
          ? name + "=" + encodeURIComponent(settings[name].val.trim())
          : "",
      )
      .filter(Boolean);
    const request = new Request(
      origin +
        "/v0/resource/plugins/key-billing/monitor/usage" +
        (params.length ? "?" + params.join("&") : ""),
    );
    request.headers = { Authorization: "Bearer " + Keychain.get(keychainSlot) };
    request.timeoutInterval = 30;
    let body;
    try {
      body = await request.loadJSON();
    } catch {
      if (request.response?.statusCode === 401)
        throw new QuotaRequestError("Key 无效或已换钥，请重新设置", true);
      if (request.response?.statusCode === 403)
        throw new QuotaRequestError("此 Key 未开启所需的额度查询权限", true);
      throw new Error("无法读取额度响应，请检查地址与网络");
    }
    if (request.response.statusCode === 401)
      throw new QuotaRequestError("Key 无效或已换钥，请重新设置", true);
    if (request.response.statusCode === 403)
      throw new QuotaRequestError("此 Key 未开启所需的额度查询权限", true);
    if (
      request.response.statusCode >= 400 &&
      request.response.statusCode < 500 &&
      request.response.statusCode !== 429
    )
      throw new QuotaRequestError("查询配置无效，请检查地址与筛选条件", true);
    if (
      request.response.statusCode !== 200 ||
      body.schema_version !== 1 ||
      !body.success ||
      !body.data
    )
      throw new Error("额度查询失败，请检查权限或筛选条件");
    if (
      body.data.upstream?.items?.some(
        (item) => item.refresh_supported && !item.plan_name,
      )
    ) {
      const plans = new Request(
        origin + "/v0/resource/plugins/key-billing/auth-files",
      );
      plans.headers = request.headers;
      plans.timeoutInterval = 10;
      try {
        const details = await plans.loadJSON();
        if (plans.response?.statusCode === 200 && Array.isArray(details.files))
          attachPlans(body, details.files);
      } catch {}
      if (
        plans.response?.statusCode === 401 ||
        plans.response?.statusCode === 403
      )
        throw new QuotaRequestError("额度查询权限已失效，请重新检查 Key", true);
    }
    return body;
  }
  async discover() {
    const alert = new Alert();
    alert.title = "额度查询";
    const scope = this.quotaScope();
    try {
      const response = await this.loadQuota(true);
      const windowCount = this.discoveredChoices()?.length ?? 0;
      const items = response.data.upstream?.items || [];
      alert.message =
        `当前可选额度窗口：${windowCount}。${this.statusMessage ? " " + this.statusMessage : ""}

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
      if (error instanceof QuotaRequestError && error.discardCache)
        this.storage.setStorage(quotaChoicesKey, { scope, choices: [] });
      alert.message = error instanceof Error ? error.message : "额度查询失败";
    }
    alert.addAction("完成");
    await alert.presentAlert();
  }
  providerName(tile) {
    if (tile.displayProvider) return tile.displayProvider;
    const { provider } = tile;
    return (
      {
        codex: "Codex",
        claude: "Claude",
        copilot: "GitHub Copilot",
        opencode: "OpenCode",
        deepseek: "DeepSeek",
        agy: "Antigravity CLI",
        antigravity: "Antigravity",
        gemini: "Gemini",
        subscription: "CLIProxy-Api",
      }[provider] ||
      provider ||
      "额度"
    );
  }
  planLabel(tile) {
    const plan = tile.plan;
    if (plan === "Pay-as-you-go" || plan === "按量付费") return "";
    if (!plan) {
      if (isAntigravityProvider(tile.provider) || tile.provider === "gemini")
        return "";
      return tile.provider === "opencode" ? "GO" : "套餐未知";
    }
    return plan.toUpperCase();
  }
  layout(compact) {
    const size = this.getWidgetSize(compact ? "medium" : "large");
    const cardWidth = Math.floor((size.width - 20 - 16 - 10) / 2);
    return {
      cardWidth,
      contentWidth: cardWidth * 2 + 10,
      cardHeight: compact
        ? 68
        : Math.min(70, Math.floor((size.height - 140) / 3)),
    };
  }
  alignedRow(widget, width) {
    const outer = widget.addStack();
    outer.layoutHorizontally();
    outer.addSpacer();
    const inner = outer.addStack();
    inner.layoutHorizontally();
    inner.centerAlignContent();
    inner.size = new Size(width, 0);
    outer.addSpacer();
    return inner;
  }
  async addProviderIcon(parent, provider, size = 16) {
    const base =
      "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/";
    const urls = {
      codex: base + "codex.png",
      claude: base + "claude.png",
      copilot: base + "github.png",
      opencode: base + "opencode.png",
      deepseek: base + "deepseek.png",
    };
    if (!(provider in this.providerIcons)) {
      this.providerIcons[provider] = null;
      if (isAntigravityProvider(provider) || provider === "gemini") {
        const data = Data.fromBase64String(antigravityIcon);
        if (data) this.providerIcons[provider] = Image.fromData(data);
      } else if (urls[provider]) {
        try {
          this.providerIcons[provider] = await this.getImageByUrl(
            urls[provider],
          );
        } catch {}
      }
    }
    const picture = this.providerIcons[provider];
    const icon = parent.addImage(
      picture ||
        SFSymbol.named(
          provider === "codex"
            ? "terminal.fill"
            : provider === "claude"
              ? "bolt.horizontal.circle.fill"
              : provider === "deepseek"
                ? "drop.fill"
                : "chevron.left.forwardslash.chevron.right",
        ).image,
    );
    icon.imageSize = new Size(size, size);
    icon.cornerRadius = Math.max(3, Math.floor(size / 5));
    if (picture && (provider === "copilot" || provider === "opencode"))
      icon.tintColor = Color.dynamic(
        new Color("#24292F"),
        new Color("#F0F6FC"),
      );
    else if (!picture)
      icon.tintColor = new Color(
        provider === "codex"
          ? "#0F9F58"
          : provider === "claude"
            ? "#D97706"
            : "#4F46E5",
      );
  }
  async providerHeader(parent, tile, width) {
    const header = parent.addStack();
    header.layoutHorizontally();
    header.centerAlignContent();
    header.size = new Size(width, 18);
    await this.addProviderIcon(header, tile.provider, 16);
    header.addSpacer(6);
    const title = header.addText(
      [this.providerName(tile), this.planLabel(tile)]
        .filter(Boolean)
        .join(" | "),
    );
    title.textColor = this.widgetColor;
    title.font = Font.boldSystemFont(15);
    title.textOpacity = 0.86;
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.65;
    header.addSpacer();
  }
  async renderCard(parent, tile, width, height, compact) {
    const card = parent.addStack();
    card.layoutVertically();
    card.setPadding(compact ? 3 : 5, 10, compact ? 3 : 5, 10);
    card.backgroundColor = Color.dynamic(
      new Color("#FFFFFF", 0.78),
      new Color("#20232A", 0.92),
    );
    card.cornerRadius = 8;
    card.size = new Size(width, height);
    const heading = card.addStack();
    heading.centerAlignContent();
    if (compact) {
      await this.addProviderIcon(heading, tile.provider, 10);
      heading.addSpacer(3);
    }
    const shortTitle = tile.title.replace(/^[^·]+ · /, "");
    const title = heading.addText(
      compact
        ? [this.providerName(tile), this.planLabel(tile)]
            .filter(Boolean)
            .join(" | ")
        : shortTitle,
    );
    title.font = Font.mediumSystemFont(compact ? 8 : 9);
    title.textColor = this.widgetColor;
    title.textOpacity = 0.68;
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.65;
    if (compact) {
      card.addSpacer(1);
      const metric = card.addText(shortTitle);
      metric.font = Font.mediumSystemFont(8);
      metric.textColor = this.widgetColor;
      metric.textOpacity = 0.68;
      metric.lineLimit = 1;
      metric.minimumScaleFactor = 0.65;
    }
    card.addSpacer(compact ? 1 : 3);
    const valueRow = card.addStack();
    valueRow.layoutHorizontally();
    valueRow.centerAlignContent();
    const value = valueRow.addText(tile.amount);
    value.font = Font.boldSystemFont(compact ? 16 : 19);
    value.textColor =
      tile.percent !== void 0 && tile.percent < 20
        ? Color.red()
        : this.widgetColor;
    value.lineLimit = 1;
    value.minimumScaleFactor = 0.65;
    valueRow.addSpacer(4);
    const suffix = valueRow.addText(tile.amount === "∞" ? "不限" : tile.suffix);
    suffix.textColor = this.widgetColor;
    suffix.font = Font.boldSystemFont(compact ? 11 : 13);
    suffix.lineLimit = 1;
    suffix.minimumScaleFactor = 0.65;
    card.addSpacer(compact ? 2 : 4);
    const barHeight = compact ? 4 : 7;
    this.renderQuotaBar(card, tile, width - 20, barHeight);
    card.addSpacer(compact ? 2 : 3);
    const reset = Date.parse(tile.resetAt || "");
    const detail = card.addText(
      Number.isFinite(reset)
        ? "重置 " + Utils.time("yyyy年M月d日 HH:mm", new Date(reset))
        : tile.warning
          ? tile.detail
          : tile.amount === "∞"
            ? "不限量"
            : tile.percent === void 0
              ? "余额快照"
              : "未提供重置时间",
    );
    detail.font = Font.systemFont(compact ? 8 : 9);
    detail.textColor = this.widgetColor;
    detail.textOpacity = 0.55;
    detail.lineLimit = 1;
    detail.minimumScaleFactor = 0.7;
  }
  renderQuotaBar(parent, tile, width, barHeight) {
    const bar = parent.addStack();
    bar.layoutHorizontally();
    bar.size = new Size(width, barHeight);
    bar.cornerRadius = Math.floor(barHeight / 2);
    bar.backgroundColor = new Color("#DADDE3", 0.35);
    const percent = tile.amount === "∞" ? 100 : tile.percent;
    if (percent !== void 0 && percent > 0) {
      const fill = bar.addStack();
      fill.size = new Size(Math.round((width * percent) / 100), barHeight);
      fill.cornerRadius = Math.floor(barHeight / 2);
      fill.backgroundColor = new Color(
        percent < 20 ? "#EB5757" : percent < 50 ? "#F2C94C" : "#27C46A",
      );
    }
    bar.addSpacer();
  }
  // The common settings menu discovers previews through these named renderers.
  async renderMedium() {
    this.widgetFamily = "medium";
    return this.render();
  }
  async renderLarge() {
    this.widgetFamily = "large";
    return this.render();
  }
  async renderSmall() {
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    GenrateView.setListWidget(widget);
    widget.setPadding(10, 10, 10, 10);
    widget.url = `scriptable:///run/${encodeURIComponent(Script.name())}`;
    widget.refreshAfterDate = new Date(Date.now() + refreshInterval);
    const width = Math.min(150, this.getWidgetSize("small").width - 20);
    try {
      const response = await this.loadQuota();
      const tile = selectTiles(response, [
        this.currentSettings.smallSettings.slot0.val || smallDefaults[0],
      ])[0];
      const header = this.alignedRow(widget, width);
      header.centerAlignContent();
      await this.addProviderIcon(header, tile.provider, 14);
      header.addSpacer(4);
      const provider = header.addText(
        tile.provider === "copilot" ? "Copilot" : this.providerName(tile),
      );
      provider.font = Font.boldSystemFont(11);
      provider.textColor = this.widgetColor;
      provider.lineLimit = 1;
      provider.minimumScaleFactor = 0.65;
      header.addSpacer();
      const plan = header.addText(this.planLabel(tile));
      plan.font = Font.mediumSystemFont(9);
      plan.textColor = this.widgetColor;
      plan.textOpacity = 0.68;
      plan.lineLimit = 1;
      plan.minimumScaleFactor = 0.65;
      widget.addSpacer();
      const content = this.alignedRow(widget, width);
      content.layoutVertically();
      const metric = content.addText(tile.title.replace(/^[^·]+ · /, ""));
      metric.font = Font.mediumSystemFont(10);
      metric.textColor = this.widgetColor;
      metric.textOpacity = 0.68;
      metric.lineLimit = 1;
      metric.minimumScaleFactor = 0.7;
      content.addSpacer(2);
      const valueRow = content.addStack();
      valueRow.centerAlignContent();
      const value = valueRow.addText(tile.amount);
      value.font = Font.boldSystemFont(28);
      value.textColor =
        tile.percent !== void 0 && tile.percent < 20
          ? Color.red()
          : this.widgetColor;
      value.lineLimit = 1;
      value.minimumScaleFactor = 0.55;
      if (tile.suffix || tile.amount === "∞") {
        valueRow.addSpacer(3);
        const suffix = valueRow.addText(
          tile.amount === "∞" ? "不限" : tile.suffix,
        );
        suffix.font = Font.boldSystemFont(10);
        suffix.textColor = this.widgetColor;
        suffix.lineLimit = 1;
        suffix.minimumScaleFactor = 0.65;
      }
      if (tile.percent !== void 0 || tile.amount === "∞") {
        content.addSpacer(6);
        this.renderQuotaBar(content, tile, width, 6);
      }
      widget.addSpacer();
      const reset = Date.parse(tile.resetAt || "");
      if (Number.isFinite(reset)) {
        const resetBlock = this.alignedRow(widget, width);
        resetBlock.layoutVertically();
        const detail = resetBlock.addText(
          "重置 " + Utils.time("yyyy年M月d日 HH:mm", new Date(reset)),
        );
        detail.font = Font.systemFont(8);
        detail.textColor = this.widgetColor;
        detail.textOpacity = 0.55;
        detail.lineLimit = 1;
        detail.minimumScaleFactor = 0.7;
      }
    } catch (error) {
      this.statusWarning = true;
      this.statusMessage = "请求失败";
      widget.addSpacer();
      const content = this.alignedRow(widget, width);
      const message = content.addText(
        error instanceof Error ? error.message : "额度暂不可用",
      );
      message.font = Font.mediumSystemFont(12);
      message.textColor = Color.red();
      message.lineLimit = 4;
      widget.addSpacer();
    }
    widget.addSpacer(8);
    this.renderFooter(widget, width);
    return widget;
  }
  renderFooter(widget, width) {
    const footer = this.alignedRow(widget, width);
    footer.addSpacer();
    const color = this.statusWarning ? Color.red() : new Color("#27C46A");
    if (this.statusMessage) {
      const status = footer.addText(this.statusMessage);
      status.font = new Font("SF Mono", 10);
      status.textColor = color;
      status.textOpacity = 0.5;
      status.lineLimit = 1;
      status.minimumScaleFactor = 0.7;
      footer.addSpacer(5);
    }
    const icon = footer.addImage(SFSymbol.named("arrow.clockwise").image);
    icon.imageSize = new Size(10, 10);
    icon.tintColor = color;
    icon.imageOpacity = 0.5;
    footer.addSpacer(5);
    const time = footer.addText(
      this.dataFetchTime
        ? Utils.time("HH:mm:ss", new Date(this.dataFetchTime))
        : "暂无缓存",
    );
    time.font = new Font("SF Mono", 10);
    time.textColor = color;
    time.textOpacity = 0.5;
    time.lineLimit = 1;
    time.minimumScaleFactor = 0.7;
  }
  async render() {
    if (this.widgetFamily === "small") return this.renderSmall();
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    GenrateView.setListWidget(widget);
    widget.url = `scriptable:///run/${encodeURIComponent(Script.name())}`;
    widget.refreshAfterDate = new Date(Date.now() + refreshInterval);
    if (this.widgetFamily !== "medium" && this.widgetFamily !== "large") {
      await Utils.renderUnsupport(widget);
      return widget;
    }
    const compact = this.widgetFamily === "medium";
    const { cardWidth, contentWidth, cardHeight } = this.layout(compact);
    widget.setPadding(compact ? 8 : 10, 10, compact ? 8 : 10, 10);
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
        if (!compact) {
          const header = this.alignedRow(widget, contentWidth);
          if (
            tiles[i].provider === tiles[i + 1].provider &&
            this.providerName(tiles[i]) === this.providerName(tiles[i + 1]) &&
            tiles[i].plan === tiles[i + 1].plan
          )
            await this.providerHeader(header, tiles[i], contentWidth);
          else {
            await this.providerHeader(header, tiles[i], cardWidth);
            header.addSpacer(10);
            await this.providerHeader(header, tiles[i + 1], cardWidth);
          }
          widget.addSpacer(10);
        }
        const row = this.alignedRow(widget, contentWidth);
        row.spacing = 10;
        await this.renderCard(row, tiles[i], cardWidth, cardHeight, compact);
        await this.renderCard(
          row,
          tiles[i + 1],
          cardWidth,
          cardHeight,
          compact,
        );
        if (i + 2 < tiles.length) widget.addSpacer(compact ? 4 : 8);
      }
    } catch (error) {
      this.statusWarning = true;
      this.statusMessage = "请求失败";
      widget.addSpacer();
      const message = widget.addText(
        error instanceof Error ? error.message : "额度暂不可用",
      );
      message.font = Font.mediumSystemFont(13);
      message.textColor = Color.red();
      message.centerAlignText();
      message.lineLimit = 3;
      widget.addSpacer();
    }
    widget.addSpacer(compact ? 4 : 8);
    this.renderFooter(widget, contentWidth);
    return widget;
  }
};
EndAwait(() => Runing(CPAMonitor, args.widgetParameter, false));

await __topLevelAwait__();
