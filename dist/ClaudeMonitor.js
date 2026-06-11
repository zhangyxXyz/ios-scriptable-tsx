// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: bolt.horizontal.circle;

/*
 * author   :  seiun
 * date     :  2026/06/10
 * build    :  2026-06-11 14:00:27
 * desc     :  Claude 额度监控，支持 OAuth、API Key 与 Done Hub 代理
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/ClaudeMonitor.tsx
var dependencyFileName = "Seiun.Env.js";
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, Utils, GenrateView } =
  runtimeRequire(dependencyFileName);
var ClaudeUsageWindowEmptyError = class extends Error {
  constructor(
    message = "暂无活跃 ClaudeCode 用量窗口，请发起一次会话后再查询",
  ) {
    super(message);
    this.name = "ClaudeUsageWindowEmptyError";
  }
};
var API_BASE = "https://api.anthropic.com";
var ANTHROPIC_VERSION = "2023-06-01";
var OAUTH_BETA = "oauth-2025-04-20";
var CLAUDE_CODE_USER_AGENT_FALLBACK = "claude-code/2.1.162";
var CLAUDE_CODE_NPM_LATEST_URL =
  "https://registry.npmjs.org/@anthropic-ai%2Fclaude-code/latest";
var DONE_HUB_USAGE_PATH = "/api/claudecode/usage";
var CACHE_KEY = "claude_usage_status";
var USER_AGENT_CACHE_KEY = "claude_code_user_agent";
var CREDENTIAL_KEY = "ClaudeMonitor.credential";
var CLAUDE_USAGE_URL = "https://claude.ai/settings/usage";
var CLAUDE_ICON_URL =
  "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/claude.png";
var ClaudeMonitor = class extends WidgetBase {
  constructor(scriptName) {
    super(scriptName);
    this.name = "Claude监控";
    this.en = "ClaudeMonitor";
    this.widgetParam = args.widgetParameter;
    this.usageStatus = null;
    this.dataFetchTime = null;
    this.isRequestSuccess = false;
    this.isDataExpired = false;
    this.isUsageWindowEmpty = false;
    this.statusMessage = "等待刷新";
    this.currentAccount = null;
    this.paramAccountIndex = null;
    this.currentSettings = {
      accountSettings: {
        defaultAccount: {
          val: "请选择或者添加账号",
          type: this.settingValTypeString,
        },
      },
      displaySettings: {
        pollIntervalMinutes: { val: 5, type: this.settingValTypeInt },
        showUpdateTime: { val: "显示", type: this.settingValTypeString },
      },
      requestSettings: {
        requestMode: { val: "官方", type: this.settingValTypeString },
        doneHubBaseUrl: { val: "", type: this.settingValTypeString },
        doneHubApiKey: { val: "", type: this.settingValTypeString },
        doneHubChannelId: { val: 0, type: this.settingValTypeInt },
      },
    };
    this.storageExpirationMinutes = 5;
    this.Run();
  }
  Run() {
    if (!config.runsInApp) return;
    this.syncDefaultAccountSetting();
    this.registerSettingCategory("displaySettings", "显示设置", [
      {
        title: "检查间隔",
        desc: "缓存仍在间隔内时不会发起网络请求\n建议 5 分钟或更长",
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
    this.registerSettingCategory("requestSettings", "请求设置", [
      {
        title: "请求方式",
        desc: "官方直连使用本地 Claude 鉴权；Done Hub 使用代理额度接口",
        icon: { name: "arrow.triangle.2.circlepath", color: "#2F80ED" },
        type: "select",
        option: { requestMode: "官方" },
        config: {
          selectOptions: [
            { label: "官方", value: "官方" },
            { label: "Done Hub", value: "Done Hub" },
          ],
          defaultShowContent: "官方",
          multiple: false,
        },
      },
      {
        title: "Done Hub 地址",
        desc: "例如 https://hub.example.com，不要以 / 结尾",
        icon: { name: "link", color: "#56CCF2" },
        type: "text",
        option: { doneHubBaseUrl: "" },
        config: { placeholder: "https://hub.example.com", style: "compact" },
      },
      {
        title: "Done Hub Key",
        desc: "填写 done-hub 用户令牌 sk-...；建议单独创建只给监控用的 key",
        icon: { name: "lock.shield", color: "#F2C94C" },
        type: "text",
        option: { doneHubApiKey: "" },
        config: { placeholder: "sk-...", style: "compact" },
      },
      {
        title: "渠道 ID",
        desc: "done-hub 后台 ClaudeCode 渠道的 channel_id",
        icon: { name: "number", color: "#27C46A" },
        type: "text",
        option: { doneHubChannelId: "0" },
        config: { placeholder: "1", style: "compact" },
      },
    ]);
    this.registerSetting([
      {
        title: "账号管理",
        desc: "管理官方账号和 Done Hub 请求配置；Parameter 可填账号编号",
        icon: { name: "key.fill", color: "#F2C94C" },
        type: "text",
        option: {
          defaultAccount:
            this.currentSettings.accountSettings.defaultAccount.val,
        },
        onAction: async () => {
          await this.presentAuthPage();
          this.syncDefaultAccountSetting();
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
        desc: "只清除额度缓存，不删除 Keychain 中的鉴权",
        icon: { name: "trash", color: "#EB5757" },
        onAction: async () => {
          this.storage.removeStorage(this.getCacheKey());
          await this.notify("已清除缓存", "下次刷新会重新请求 Claude 额度");
          return true;
        },
      },
    ]);
  }
  getPollIntervalMinutes() {
    const value = Number(
      this.currentSettings.displaySettings.pollIntervalMinutes.val,
    );
    if (!Number.isFinite(value) || value < 1) return 5;
    return Math.max(1, Math.min(value, 60));
  }
  parseWidgetParameter() {
    this.paramAccountIndex = null;
    const raw = String(this.widgetParam ?? "").trim();
    if (!raw) return;
    const index = parseInt(raw.split(",")[0].trim());
    if (!isNaN(index)) this.paramAccountIndex = index;
  }
  getAccountStore() {
    try {
      if (!Keychain.contains(CREDENTIAL_KEY)) {
        const legacyDoneHub = this.getLegacyDoneHubAccount(0);
        const accounts = legacyDoneHub ? [legacyDoneHub] : [];
        return {
          version: 2,
          defaultAccountName: accounts[0]?.accountName || "请选择或者添加账号",
          accounts,
        };
      }
      const raw = Keychain.get(CREDENTIAL_KEY);
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.accounts)) {
        const accounts = parsed.accounts
          .map((account) => this.normalizeAccount(account))
          .filter((account) => this.isAccountConfigured(account));
        const legacyDoneHub = this.getLegacyDoneHubAccount(accounts.length);
        if (
          legacyDoneHub &&
          !accounts.some((account) =>
            this.isSameRequestAccount(account, legacyDoneHub),
          )
        )
          accounts.push(legacyDoneHub);
        return {
          version: Number(parsed.version ?? 2),
          defaultAccountName: String(
            parsed.defaultAccountName ||
              accounts[0]?.accountName ||
              "请选择或者添加账号",
          ),
          accounts,
        };
      }
      if (parsed.token) {
        const legacyAccount = this.normalizeAccount(parsed);
        const store = {
          version: 2,
          defaultAccountName: legacyAccount.accountName,
          accounts: [legacyAccount],
        };
        this.saveAccountStore(store);
        return store;
      }
    } catch (error) {
      console.log(`读取Claude鉴权失败: ${error}`);
    }
    return {
      version: 2,
      defaultAccountName: "请选择或者添加账号",
      accounts: [],
    };
  }
  normalizeAccount(account) {
    const requestMode =
      account?.requestMode === "Done Hub" || account?.doneHubBaseUrl
        ? "Done Hub"
        : "官方";
    if (requestMode === "Done Hub") {
      return {
        accountName: String(account?.accountName || "Done Hub").trim(),
        authMode: "OAuth",
        requestMode,
        token: "",
        doneHubBaseUrl: String(account?.doneHubBaseUrl || "")
          .trim()
          .replace(/\/+$/, ""),
        doneHubApiKey: String(account?.doneHubApiKey || "").trim(),
        doneHubChannelId: Number(account?.doneHubChannelId || 0),
        savedAt: account?.savedAt ?? Math.floor(Date.now() / 1e3),
      };
    }
    const token = String(account?.token || "").trim();
    const authMode =
      account?.authMode === "API Key" || token.startsWith("sk-ant-api")
        ? "API Key"
        : "OAuth";
    const accountName = String(
      account?.accountName ||
        (authMode === "OAuth" ? "Claude Code" : "Anthropic API"),
    ).trim();
    return {
      accountName,
      authMode,
      requestMode,
      token,
      savedAt: account?.savedAt ?? Math.floor(Date.now() / 1e3),
    };
  }
  isAccountConfigured(account) {
    if (!account?.accountName) return false;
    if (this.isDoneHubMode(account)) {
      return Boolean(
        account.doneHubBaseUrl &&
        account.doneHubApiKey &&
        Number(account.doneHubChannelId) > 0,
      );
    }
    return Boolean(account.token);
  }
  isSameRequestAccount(left, right) {
    if (this.getAccountMode(left) !== this.getAccountMode(right)) return false;
    if (this.isDoneHubMode(left)) {
      return (
        left.doneHubBaseUrl === right.doneHubBaseUrl &&
        Number(left.doneHubChannelId || 0) ===
          Number(right.doneHubChannelId || 0)
      );
    }
    return (
      left.accountName === right.accountName && left.authMode === right.authMode
    );
  }
  getLegacyDoneHubAccount(index) {
    const baseUrl = String(
      this.currentSettings.requestSettings.doneHubBaseUrl.val || "",
    )
      .trim()
      .replace(/\/+$/, "");
    const apiKey = String(
      this.currentSettings.requestSettings.doneHubApiKey.val || "",
    ).trim();
    const channelId = Number(
      this.currentSettings.requestSettings.doneHubChannelId.val || 0,
    );
    if (!baseUrl || !apiKey || !Number.isFinite(channelId) || channelId <= 0)
      return null;
    return this.normalizeAccount({
      accountName: `Done Hub ${index + 1}`,
      requestMode: "Done Hub",
      doneHubBaseUrl: baseUrl,
      doneHubApiKey: apiKey,
      doneHubChannelId: Math.floor(channelId),
      savedAt: Math.floor(Date.now() / 1e3),
    });
  }
  saveAccountStore(store) {
    const accounts = store.accounts
      .map((account) => this.normalizeAccount(account))
      .filter((account) => this.isAccountConfigured(account));
    const defaultAccountName = accounts.some(
      (account) => account.accountName === store.defaultAccountName,
    )
      ? store.defaultAccountName
      : accounts[0]?.accountName || "请选择或者添加账号";
    Keychain.set(
      CREDENTIAL_KEY,
      JSON.stringify({ version: 2, defaultAccountName, accounts }),
    );
    this.currentSettings.accountSettings.defaultAccount.val =
      defaultAccountName;
  }
  getDefaultAccountName() {
    const store = this.getAccountStore();
    return (
      store.defaultAccountName ||
      store.accounts[0]?.accountName ||
      "请选择或者添加账号"
    );
  }
  syncDefaultAccountSetting() {
    this.currentSettings.accountSettings.defaultAccount.val =
      this.getDefaultAccountName();
  }
  readCredential() {
    this.parseWidgetParameter();
    const store = this.getAccountStore();
    if (
      this.paramAccountIndex !== null &&
      store.accounts[this.paramAccountIndex]
    ) {
      this.currentAccount = store.accounts[this.paramAccountIndex];
      return this.currentAccount;
    }
    const defaultAccount =
      store.accounts.find(
        (account) => account.accountName === store.defaultAccountName,
      ) ||
      store.accounts[0] ||
      null;
    this.currentAccount = defaultAccount;
    return defaultAccount;
  }
  getCacheKey(account = this.currentAccount) {
    if (this.isDoneHubMode(account)) {
      const baseUrl = this.getDoneHubBaseUrl(account) || "donehub";
      const channelId = this.getDoneHubChannelId(account) || 0;
      return `${CACHE_KEY}_donehub_${baseUrl}_${channelId}`.replace(
        /[^A-Za-z0-9_-]/g,
        "_",
      );
    }
    const identity = account?.accountName || "default";
    return `${CACHE_KEY}_${identity.replace(/[^A-Za-z0-9_-]/g, "_")}`;
  }
  getAccountMode(account = this.currentAccount) {
    return account?.requestMode === "Done Hub" ? "Done Hub" : "官方";
  }
  isDoneHubMode(account = this.currentAccount) {
    return this.getAccountMode(account) === "Done Hub";
  }
  getDoneHubBaseUrl(account = this.currentAccount) {
    return String(account?.doneHubBaseUrl || "")
      .trim()
      .replace(/\/+$/, "");
  }
  getDoneHubApiKey(account = this.currentAccount) {
    return String(account?.doneHubApiKey || "").trim();
  }
  getDoneHubChannelId(account = this.currentAccount) {
    const value = Number(account?.doneHubChannelId || 0);
    return Number.isFinite(value) ? Math.floor(value) : 0;
  }
  extractToken(input) {
    const raw = input.trim();
    if (!raw) return "";
    try {
      const parsed = JSON.parse(raw);
      if (parsed.claudeAiOauth?.accessToken)
        return parsed.claudeAiOauth.accessToken.trim();
      if (parsed.apiKey) return parsed.apiKey.trim();
    } catch {}
    return raw.replace(/^Bearer\s+/i, "").trim();
  }
  parseCredentialFromInput(input, accountNameInput) {
    const token = this.extractToken(input);
    if (!token) throw new Error("未找到 Claude token 或 API key");
    const authMode = token.startsWith("sk-ant-api") ? "API Key" : "OAuth";
    if (authMode === "OAuth" && !token.startsWith("sk-ant-oat")) {
      console.log(
        "Claude OAuth token 通常以 sk-ant-oat 开头，仍按 OAuth 模式保存",
      );
    }
    const accountName = (
      accountNameInput ||
      (authMode === "OAuth" ? "Claude Code" : "Anthropic API")
    ).trim();
    return {
      accountName,
      authMode,
      token,
      savedAt: Math.floor(Date.now() / 1e3),
    };
  }
  saveCredentialFromInput(input, accountNameInput, setDefault = true) {
    const credential = this.parseCredentialFromInput(input, accountNameInput);
    const store = this.getAccountStore();
    const existingIndex = store.accounts.findIndex(
      (account) => account.accountName === credential.accountName,
    );
    if (existingIndex >= 0) {
      store.accounts[existingIndex] = credential;
    } else {
      store.accounts.push(credential);
    }
    if (
      setDefault ||
      !store.defaultAccountName ||
      store.defaultAccountName === "请选择或者添加账号"
    ) {
      store.defaultAccountName = credential.accountName;
    }
    this.saveAccountStore(store);
    this.currentAccount = credential;
    return credential;
  }
  saveAccountFromForm(form) {
    const requestMode = form.requestMode === "Done Hub" ? "Done Hub" : "官方";
    if (requestMode === "官方") {
      return this.saveCredentialFromInput(
        form.authInput || "",
        form.accountName || "",
        Boolean(form.setDefault),
      );
    }
    const store = this.getAccountStore();
    const accountName = (
      form.accountName || `Done Hub ${store.accounts.length + 1}`
    ).trim();
    if (!accountName) throw new Error("账号标识不能为空");
    const credential = this.normalizeAccount({
      accountName,
      requestMode,
      doneHubBaseUrl: form.doneHubBaseUrl || "",
      doneHubApiKey: form.doneHubApiKey || "",
      doneHubChannelId: Number(form.doneHubChannelId || 0),
      savedAt: Math.floor(Date.now() / 1e3),
    });
    if (!this.isAccountConfigured(credential))
      throw new Error("请完整填写 Done Hub 地址、Key 和渠道 ID");
    const existingIndex = store.accounts.findIndex(
      (account) => account.accountName === credential.accountName,
    );
    if (existingIndex >= 0) {
      store.accounts[existingIndex] = credential;
    } else {
      store.accounts.push(credential);
    }
    if (
      form.setDefault ||
      !store.defaultAccountName ||
      store.defaultAccountName === "请选择或者添加账号"
    ) {
      store.defaultAccountName = credential.accountName;
    }
    this.saveAccountStore(store);
    this.currentAccount = credential;
    return credential;
  }
  async getClaudeCodeUserAgent() {
    const cache = this.storage.getStorage(USER_AGENT_CACHE_KEY, 24 * 60);
    if (cache?.userAgent && this.isValidClaudeUserAgent(cache.userAgent))
      return cache.userAgent;
    try {
      const request = new Request(CLAUDE_CODE_NPM_LATEST_URL);
      request.method = "GET";
      request.headers = { Accept: "application/json" };
      request.timeoutInterval = 8;
      const data = await request.loadJSON();
      const version = this.extractSemver(data.version || "");
      if (version) {
        const userAgent = `claude-code/${version}`;
        this.storage.setStorage(USER_AGENT_CACHE_KEY, {
          userAgent,
          version,
          fetchedAt: Date.now(),
        });
        return userAgent;
      }
    } catch (error) {
      console.log(`获取Claude Code npm版本失败: ${error}`);
    }
    return CLAUDE_CODE_USER_AGENT_FALLBACK;
  }
  extractSemver(value) {
    return value.match(/\b\d+\.\d+\.\d+\b/)?.[0] ?? null;
  }
  isValidClaudeUserAgent(value) {
    return /^claude-code\/\d+\.\d+\.\d+$/.test(value);
  }
  async getRequestHeaders(credential) {
    const headers = {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "User-Agent": await this.getClaudeCodeUserAgent(),
    };
    if (credential.authMode === "API Key") {
      headers["x-api-key"] = credential.token;
      headers["anthropic-version"] = ANTHROPIC_VERSION;
    } else {
      headers.Authorization = `Bearer ${credential.token}`;
      headers["anthropic-beta"] = OAUTH_BETA;
    }
    return headers;
  }
  async requestJson(url, headers) {
    const request = new Request(url);
    request.method = "GET";
    request.headers = headers;
    request.timeoutInterval = 15;
    let data;
    try {
      data = await request.loadJSON();
    } catch (error) {
      const statusCode2 = Number(request.response?.statusCode ?? 0);
      if (statusCode2 > 0)
        throw new Error(
          `请求失败: HTTP ${statusCode2}${this.getRetryAfterText(request)}`,
        );
      throw error;
    }
    const statusCode = Number(request.response?.statusCode ?? 0);
    if (statusCode >= 400) {
      throw new Error(
        `请求失败: HTTP ${statusCode}${this.getAnthropicErrorText(data)}${this.getRetryAfterText(request)}`,
      );
    }
    return data;
  }
  getAnthropicErrorText(data) {
    const payload = data;
    const message = payload?.error?.message;
    const type = payload?.error?.type;
    if (message && type) return ` (${type}: ${message})`;
    if (message) return ` (${message})`;
    return "";
  }
  getRetryAfterText(request) {
    const headers = request.response?.headers || {};
    const retryAfter = headers["Retry-After"] || headers["retry-after"];
    return retryAfter ? `，Retry-After ${retryAfter}s` : "";
  }
  async requestOAuthUsage(credential) {
    const data = await this.requestJson(
      `${API_BASE}/api/oauth/usage`,
      await this.getRequestHeaders(credential),
    );
    return this.parseOAuthUsage(data);
  }
  parseOAuthUsage(data) {
    const fiveHour = this.extractOAuthPeriod(
      "five-hour",
      "5 小时使用限额",
      data.five_hour,
    );
    const oneWeek = this.extractOAuthPeriod(
      "seven-day",
      "7 天使用限额",
      data.seven_day,
    );
    const additional = [
      this.extractOAuthPeriod(
        "seven-day-sonnet",
        "Sonnet 7 天限额",
        data.seven_day_sonnet || void 0,
      ),
      this.extractOAuthPeriod(
        "seven-day-opus",
        "Opus 7 天限额",
        data.seven_day_opus || void 0,
      ),
      this.extractOAuthPeriod(
        "seven-day-oauth-apps",
        "OAuth Apps 7 天限额",
        data.seven_day_oauth_apps || void 0,
      ),
      this.extractOAuthPeriod(
        "seven-day-cowork",
        "Cowork 7 天限额",
        data.seven_day_cowork || void 0,
      ),
      this.extractOAuthPeriod(
        "seven-day-omelette",
        "Omelette 7 天限额",
        data.seven_day_omelette || void 0,
      ),
      this.extractExtraUsagePeriod(data.extra_usage || void 0),
    ].filter((period) => Boolean(period));
    if (!fiveHour && !oneWeek && additional.length === 0)
      throw new ClaudeUsageWindowEmptyError();
    return { fiveHour, oneWeek, additional };
  }
  async requestDoneHubUsage(credential) {
    const baseUrl = this.getDoneHubBaseUrl(credential);
    const apiKey = this.getDoneHubApiKey(credential);
    const channelId = this.getDoneHubChannelId(credential);
    if (!baseUrl) throw new Error("请配置 Done Hub 地址");
    if (!apiKey) throw new Error("请配置 Done Hub Key");
    if (channelId <= 0) throw new Error("请配置 Done Hub 渠道 ID");
    const request = new Request(
      `${baseUrl}${DONE_HUB_USAGE_PATH}?channel_id=${encodeURIComponent(String(channelId))}`,
    );
    request.method = "GET";
    request.headers = {
      Authorization: apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`,
      Accept: "application/json",
    };
    request.timeoutInterval = 20;
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
    if (response?.success === false)
      throw new Error(response.message || "Done Hub 请求失败");
    if (response?.data?.empty) {
      throw new ClaudeUsageWindowEmptyError(response.data.warning || void 0);
    }
    const data = response?.data?.usage || payload;
    console.log(
      `Done Hub Claude额度请求成功: HTTP ${this.getHttpStatusLabel(request)}`,
    );
    return this.parseOAuthUsage(data);
  }
  async requestApiKeyUsage(credential) {
    const now = /* @__PURE__ */ new Date();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1e3);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
    const [fiveHour, oneWeek] = await Promise.all([
      this.requestPeriodCost(
        credential,
        "five-hour",
        "最近 5 小时用量",
        fiveHoursAgo,
        now,
      ),
      this.requestPeriodCost(
        credential,
        "seven-day",
        "最近 7 天用量",
        oneWeekAgo,
        now,
      ),
    ]);
    return { fiveHour, oneWeek, additional: [] };
  }
  async requestPeriodCost(credential, key, title, start, end) {
    const params = `start_time=${encodeURIComponent(start.toISOString())}&end_time=${encodeURIComponent(end.toISOString())}`;
    const data = await this.requestJson(
      `${API_BASE}/v1/usage?${params}`,
      await this.getRequestHeaders(credential),
    );
    return {
      key,
      title,
      used: this.extractAnthropicCost(data),
      limit: null,
      unit: "usd",
      resetsAt: null,
    };
  }
  async requestUsage(credential) {
    if (!credential) throw new Error("请先配置鉴权");
    if (this.isDoneHubMode(credential))
      return await this.requestDoneHubUsage(credential);
    if (credential.authMode === "OAuth")
      return await this.requestOAuthUsage(credential);
    return await this.requestApiKeyUsage(credential);
  }
  getHttpStatusLabel(request) {
    const statusCode = Number(request.response?.statusCode ?? 0);
    return statusCode > 0 ? String(statusCode) : "OK";
  }
  extractOAuthPeriod(key, title, windowInfo) {
    if (!windowInfo || typeof windowInfo.utilization !== "number") return null;
    return {
      key,
      title,
      used: this.clampPercent(windowInfo.utilization),
      limit: 100,
      unit: "percent",
      resetsAt: this.parseDateMs(windowInfo.resets_at),
    };
  }
  extractExtraUsagePeriod(extraUsage) {
    if (!extraUsage?.is_enabled || typeof extraUsage.utilization !== "number")
      return null;
    return {
      key: "extra-usage",
      title: "Extra Usage",
      used: this.clampPercent(extraUsage.utilization),
      limit: 100,
      unit: "percent",
      resetsAt: null,
    };
  }
  extractAnthropicCost(data) {
    if (typeof data.total_cost === "number") return data.total_cost;
    if (!Array.isArray(data.data)) return 0;
    return data.data.reduce((sum, entry) => {
      if (typeof entry.cost === "number") return sum + entry.cost;
      const inputCost = ((entry.input_tokens ?? 0) / 1e6) * 3;
      const outputCost = ((entry.output_tokens ?? 0) / 1e6) * 15;
      return sum + inputCost + outputCost;
    }, 0);
  }
  parseDateMs(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }
  getCachedUsage(ignoreFreshness = false) {
    const interval = ignoreFreshness ? void 0 : this.getPollIntervalMinutes();
    return this.storage.getStorage(this.getCacheKey(), interval);
  }
  getAnyCachedUsage() {
    return this.storage.getStorage(this.getCacheKey());
  }
  useCache(cache, expired, message) {
    this.usageStatus = cache.usage;
    this.dataFetchTime = cache.fetchedAt;
    this.isRequestSuccess = false;
    this.isDataExpired = expired;
    this.isUsageWindowEmpty = false;
    this.statusMessage = message;
  }
  isRateLimitError(error) {
    const text = String(error ?? "").toLowerCase();
    return (
      text.includes("429") ||
      text.includes("rate limit") ||
      text.includes("too many requests")
    );
  }
  isUsageWindowEmptyError(error) {
    return (
      error instanceof ClaudeUsageWindowEmptyError ||
      String(error ?? "").includes("ClaudeUsageWindowEmptyError")
    );
  }
  async loadUsage() {
    const credential = this.readCredential();
    if (!credential) {
      const cache = this.getAnyCachedUsage();
      if (cache?.usage) {
        this.useCache(cache, true, "未配置鉴权，显示缓存");
        return;
      }
      this.statusMessage = "请先配置鉴权";
      return;
    }
    const freshCache = this.getCachedUsage();
    if (freshCache?.usage) {
      this.useCache(freshCache, false, "使用缓存");
      return;
    }
    try {
      const usage = await this.requestUsage(credential);
      const fetchedAt = Date.now();
      this.storage.setStorage(this.getCacheKey(credential), {
        usage,
        fetchedAt,
      });
      this.usageStatus = usage;
      this.dataFetchTime = fetchedAt;
      this.isRequestSuccess = true;
      this.isDataExpired = false;
      this.isUsageWindowEmpty = false;
      this.statusMessage = "在线";
    } catch (error) {
      console.log(`请求Claude额度失败: ${error}`);
      const cache = this.getAnyCachedUsage();
      if (cache?.usage) {
        this.useCache(
          cache,
          true,
          this.isUsageWindowEmptyError(error)
            ? "暂无活跃窗口/使用缓存"
            : this.isRateLimitError(error)
              ? "频率限制/使用缓存"
              : "请求失败/使用缓存",
        );
        return;
      }
      if (this.isUsageWindowEmptyError(error)) {
        this.usageStatus = null;
        this.dataFetchTime = null;
        this.isRequestSuccess = false;
        this.isDataExpired = false;
        this.isUsageWindowEmpty = true;
        this.statusMessage = "暂无活跃窗口";
        return;
      }
      this.isUsageWindowEmpty = false;
      this.statusMessage = String(error);
    }
  }
  getUsageRows() {
    const rows = [];
    if (this.usageStatus?.fiveHour) rows.push(this.usageStatus.fiveHour);
    if (this.usageStatus?.oneWeek) rows.push(this.usageStatus.oneWeek);
    rows.push(...(this.usageStatus?.additional ?? []));
    return rows;
  }
  clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }
  getRemainingPercent(row) {
    if (row.unit !== "percent") return null;
    return this.clampPercent(100 - row.used);
  }
  getValueText(row) {
    if (row.unit === "percent")
      return `${Math.round(this.getRemainingPercent(row) ?? 0)}%`;
    return `$${row.used.toFixed(row.used >= 1 ? 2 : 4)}`;
  }
  getValueLabel(row) {
    return row.unit === "percent" ? "剩余" : "已用";
  }
  formatResetTime(ms) {
    if (!ms) return "使用后滚动计量";
    return Utils.time("yyyy年MM月dd日 HH:mm", new Date(ms));
  }
  getResetText(ms) {
    return ms ? `重置 ${this.formatResetTime(ms)}` : this.formatResetTime(ms);
  }
  formatUpdateTime() {
    if (!this.dataFetchTime) return "暂无缓存";
    return Utils.time("HH:mm:ss", new Date(this.dataFetchTime));
  }
  getStatusColor() {
    if (this.isRequestSuccess) return new Color("#27C46A");
    if (this.isUsageWindowEmpty) return new Color("#F2C94C");
    return Color.red();
  }
  getAuthModeLabel() {
    if (this.getUsageRows().length > 0) return "PRO";
    if (this.isDoneHubMode()) return "Claude Code";
    return this.currentAccount?.authMode || "未连接";
  }
  getTitleText() {
    return "Claude";
  }
  getTitleAccountLabel() {
    return this.currentAccount?.accountName
      ? ` @${this.currentAccount.accountName}`
      : "";
  }
  getHeaderTitleText() {
    return `${this.getTitleText()}${this.getTitleAccountLabel()} | ${this.getAuthModeLabel()}`;
  }
  getSmallSubtitleText() {
    return `${this.getAuthModeLabel()} | ${this.currentAccount?.accountName || "未配置"}`;
  }
  getFooterText() {
    if (this.currentSettings.displaySettings.showUpdateTime.val === "显示") {
      return `${this.statusMessage}  ↻ ${this.formatUpdateTime()}`;
    }
    return this.statusMessage;
  }
  getLayoutMetrics() {
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const cardGap = 12;
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
    const progressWidth = cardWidth - 20;
    return { padding, cardGap, contentWidth, cardWidth, progressWidth };
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
  async addClaudeIcon(stack, size) {
    try {
      const iconImage = await this.getImageByUrl(CLAUDE_ICON_URL);
      if (iconImage) {
        const icon = stack.addImage(iconImage);
        icon.imageSize = new Size(size, size);
        icon.cornerRadius = Math.max(3, Math.floor(size / 5));
        return;
      }
    } catch (error) {
      console.log(`加载Claude图标失败: ${error}`);
    }
    const fallback = stack.addImage(
      SFSymbol.named("bolt.horizontal.circle.fill").image,
    );
    fallback.imageSize = new Size(size, size);
    fallback.tintColor = new Color("#D97706");
  }
  renderProgressBar(stack, percent, width) {
    const bar = stack.addStack();
    bar.layoutHorizontally();
    bar.backgroundColor = new Color("#DADDE3", 0.35);
    bar.cornerRadius = 4;
    bar.size = new Size(width, 7);
    const fillWidth = Math.max(
      3,
      Math.round((width * this.clampPercent(percent)) / 100),
    );
    const fill = bar.addStack();
    fill.backgroundColor =
      percent < 20
        ? new Color("#EB5757")
        : percent < 50
          ? new Color("#F2C94C")
          : new Color("#27C46A");
    fill.cornerRadius = 4;
    fill.size = new Size(fillWidth, 7);
    bar.addSpacer();
  }
  renderRowCard(parent, row, cardWidth, progressWidth) {
    const card = parent.addStack();
    card.layoutVertically();
    card.setPadding(9, 10, 9, 10);
    card.backgroundColor = Color.dynamic(
      new Color("#FFFFFF", 0.78),
      new Color("#20232A", 0.92),
    );
    card.cornerRadius = 8;
    card.size = new Size(cardWidth, 84);
    const title = card.addText(row.title);
    title.textColor = this.widgetColor;
    title.font = Font.mediumSystemFont(9);
    title.textOpacity = 0.68;
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.75;
    card.addSpacer(2);
    const valueRow = card.addStack();
    valueRow.layoutHorizontally();
    valueRow.centerAlignContent();
    const value = valueRow.addText(this.getValueText(row));
    value.textColor =
      row.unit === "percent" && (this.getRemainingPercent(row) ?? 100) < 20
        ? Color.red()
        : this.widgetColor;
    value.font = Font.boldSystemFont(row.unit === "percent" ? 19 : 17);
    value.minimumScaleFactor = 0.65;
    value.lineLimit = 1;
    valueRow.addSpacer(4);
    const label = valueRow.addText(this.getValueLabel(row));
    label.textColor = this.widgetColor;
    label.font = Font.boldSystemFont(13);
    label.minimumScaleFactor = 0.8;
    label.lineLimit = 1;
    card.addSpacer(3);
    if (row.unit === "percent") {
      this.renderProgressBar(
        card,
        this.getRemainingPercent(row) ?? 0,
        progressWidth,
      );
      card.addSpacer(5);
      const reset = card.addText(this.getResetText(row.resetsAt));
      reset.textColor = this.widgetColor;
      reset.font = Font.systemFont(9);
      reset.textOpacity = 0.55;
      reset.lineLimit = 1;
      reset.minimumScaleFactor = 0.7;
    } else {
      const detail = card.addText("官方 usage API");
      detail.textColor = this.widgetColor;
      detail.font = Font.systemFont(9);
      detail.textOpacity = 0.55;
      detail.lineLimit = 1;
    }
  }
  async renderSmall(widget) {
    const rows = this.getUsageRows();
    const primary = rows[0] || null;
    GenrateView.setListWidget(widget);
    widget.setPadding(12, 12, 12, 12);
    widget.addSpacer(2);
    const titleRow = widget.addStack();
    titleRow.layoutHorizontally();
    titleRow.centerAlignContent();
    await this.addClaudeIcon(titleRow, 20);
    titleRow.addSpacer(6);
    const title = titleRow.addText(this.getTitleText());
    title.textColor = this.widgetColor;
    title.font = Font.boldSystemFont(14);
    title.textOpacity = 0.78;
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.7;
    titleRow.addSpacer();
    widget.addSpacer(4);
    const subTitle = widget.addText(this.getSmallSubtitleText());
    subTitle.textColor = this.widgetColor;
    subTitle.font = Font.mediumSystemFont(11);
    subTitle.textOpacity = 0.68;
    subTitle.lineLimit = 1;
    subTitle.minimumScaleFactor = 0.65;
    widget.addSpacer(8);
    const value = widget.addText(primary ? this.getValueText(primary) : "--");
    value.textColor =
      primary?.unit === "percent" &&
      (this.getRemainingPercent(primary) ?? 100) < 20
        ? Color.red()
        : this.widgetColor;
    value.font = Font.boldSystemFont(36);
    value.minimumScaleFactor = 0.65;
    widget.addSpacer(4);
    const label = widget.addText(
      primary
        ? `${primary.title} ${this.getValueLabel(primary)}`
        : this.statusMessage,
    );
    label.textColor = this.widgetColor;
    label.font = Font.systemFont(10);
    label.textOpacity = 0.58;
    label.lineLimit = 2;
    widget.addSpacer();
    const timeRow = widget.addStack();
    timeRow.layoutHorizontally();
    timeRow.addSpacer();
    const timeIcon = timeRow.addImage(SFSymbol.named("arrow.clockwise").image);
    timeIcon.imageSize = new Size(10, 10);
    timeIcon.tintColor = this.getStatusColor();
    timeIcon.imageOpacity = 0.5;
    timeRow.addSpacer(5);
    const time = timeRow.addText(this.formatUpdateTime());
    time.textColor = this.getStatusColor();
    time.font = new Font("SF Mono", 10);
    time.textOpacity = 0.5;
    return widget;
  }
  async renderMedium(widget) {
    return await this.renderCommon(widget, 2);
  }
  async renderLarge(widget) {
    return await this.renderCommon(widget, 4);
  }
  async renderCommon(widget, maxRows) {
    GenrateView.setListWidget(widget);
    const { padding, cardGap, contentWidth, cardWidth, progressWidth } =
      this.getLayoutMetrics();
    widget.setPadding(padding.top, padding.left, padding.bottom, padding.right);
    const header = this.addAlignedRow(widget, contentWidth);
    await this.addClaudeIcon(header, 16);
    header.addSpacer(6);
    const title = header.addText(this.getHeaderTitleText());
    title.textColor = this.widgetColor;
    title.font = Font.boldSystemFont(15);
    title.textOpacity = 0.86;
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.65;
    header.addSpacer();
    widget.addSpacer(10);
    const rows = this.getUsageRows().slice(0, maxRows);
    if (rows.length === 0) {
      widget.addSpacer();
      const empty = widget.addText(this.statusMessage || "暂无额度数据");
      empty.textColor = Color.red();
      empty.font = Font.mediumSystemFont(13);
      empty.centerAlignText();
      widget.addSpacer();
    } else {
      for (let i = 0; i < rows.length; i += 2) {
        const rowStack = this.addAlignedRow(widget, contentWidth);
        rowStack.spacing = cardGap;
        this.renderRowCard(rowStack, rows[i], cardWidth, progressWidth);
        if (rows[i + 1])
          this.renderRowCard(rowStack, rows[i + 1], cardWidth, progressWidth);
        widget.addSpacer(8);
      }
    }
    const footer = this.addAlignedRow(widget, contentWidth);
    const requestMode = footer.addText(
      this.getAccountMode(this.currentAccount),
    );
    requestMode.textColor = this.widgetColor;
    requestMode.font = Font.mediumSystemFont(10);
    requestMode.textOpacity = 0.62;
    requestMode.lineLimit = 1;
    requestMode.minimumScaleFactor = 0.75;
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
    return widget;
  }
  async presentAuthPage() {
    const current = this.readCredential();
    const webView = new WebView();
    await webView.loadHTML(this.buildAuthHtml(current));
    let closed = false;
    webView.present(false).then(() => {
      closed = true;
    });
    while (!closed) {
      await new Promise((resolve) =>
        Timer.schedule(250, false, () => resolve(void 0)),
      );
      if (closed) break;
      const action = await webView.evaluateJavaScript(
        `(function(){
                    var action = window.__claudeAction || '';
                    if (action) window.__claudeAction = '';
                    return action;
                })()`,
        false,
      );
      if (action === "clear") {
        if (Keychain.contains(CREDENTIAL_KEY)) Keychain.remove(CREDENTIAL_KEY);
        this.currentAccount = null;
        this.syncDefaultAccountSetting();
        await webView.evaluateJavaScript(
          `window.setStatus('已清除全部鉴权', 'warn'); window.setSavedInfo(${JSON.stringify(
            this.getSavedInfoHtml(null),
          )}); window.renderAccounts(${JSON.stringify(this.getAccountListHtml())});`,
          false,
        );
      } else if (action.startsWith("account_")) {
        const index = parseInt(action.replace("account_", ""));
        const result = await this.presentAccountAction(index);
        if (result) {
          await webView.evaluateJavaScript(
            `window.setStatus(${JSON.stringify(result.message)}, ${JSON.stringify(result.type)}); window.renderAccounts(${JSON.stringify(
              this.getAccountListHtml(),
            )}); window.setSavedInfo(${JSON.stringify(this.getSavedInfoHtml(this.readCredential()))});`,
            false,
          );
        }
      } else if (action === "open") {
        Safari.open(CLAUDE_USAGE_URL);
      } else if (action === "save") {
        const form = await webView.evaluateJavaScript(
          `(function(){
                        return {
                            accountName: document.getElementById('accountName').value || '',
                            requestMode: document.getElementById('requestMode').value || '官方',
                            authInput: document.getElementById('authInput').value || '',
                            doneHubBaseUrl: document.getElementById('doneHubBaseUrl').value || '',
                            doneHubApiKey: document.getElementById('doneHubApiKey').value || '',
                            doneHubChannelId: document.getElementById('doneHubChannelId').value || '',
                            setDefault: document.getElementById('setDefault').checked
                        };
                    })()`,
          false,
        );
        try {
          const credential = this.saveAccountFromForm(form);
          await webView.evaluateJavaScript(
            `window.setStatus(${JSON.stringify(`保存成功：${credential.accountName}`)}, 'ok'); window.setSavedInfo(${JSON.stringify(
              this.getSavedInfoHtml(credential),
            )}); window.renderAccounts(${JSON.stringify(this.getAccountListHtml())});`,
            false,
          );
        } catch (error) {
          await webView.evaluateJavaScript(
            `window.setStatus(${JSON.stringify(`保存失败：${error}`)}, 'bad');`,
            false,
          );
        }
      }
    }
  }
  async presentAccountAction(index) {
    const store = this.getAccountStore();
    const account = store.accounts[index];
    if (!account) return null;
    const actionAlert = new Alert();
    actionAlert.title = account.accountName || "账号操作";
    actionAlert.message = `编号: ${index}
模式: ${this.getAccountMode(account)}
${this.getAccountSummary(account)}`;
    actionAlert.addAction("设为默认");
    actionAlert.addAction("修改");
    actionAlert.addAction("复制");
    actionAlert.addDestructiveAction("删除");
    actionAlert.addCancelAction("取消");
    const actionIndex = await actionAlert.presentAlert();
    switch (actionIndex) {
      case 0:
        return this.setDefaultAccount(index);
      case 1:
        return await this.editAccount(index);
      case 2:
        return await this.copyAccount(index);
      case 3:
        return await this.deleteAccount(index);
      default:
        return null;
    }
  }
  setDefaultAccount(index) {
    const store = this.getAccountStore();
    const account = store.accounts[index];
    if (!account) return null;
    store.defaultAccountName = account.accountName;
    this.saveAccountStore(store);
    return { message: `已设为默认：${account.accountName}`, type: "ok" };
  }
  async editAccount(index) {
    const store = this.getAccountStore();
    const account = store.accounts[index];
    if (!account) return null;
    if (this.isDoneHubMode(account))
      return await this.editDoneHubAccount(index);
    return await this.editOfficialAccount(index);
  }
  async editOfficialAccount(index) {
    const store = this.getAccountStore();
    const account = store.accounts[index];
    if (!account) return null;
    const alert = new Alert();
    alert.title = "修改 Claude 官方账号";
    alert.message = "可修改账号标识，或替换 token / API key";
    alert.addTextField("账号标识名字", account.accountName || "");
    alert.addTextField("token / credentials.json（留空不变）", "");
    alert.addAction("确定");
    alert.addCancelAction("取消");
    const result = await alert.presentAlert();
    if (result === -1) return null;
    const oldName = account.accountName;
    const nextName = alert.textFieldValue(0).trim();
    const tokenInput = alert.textFieldValue(1).trim();
    if (!nextName) return { message: "账号标识不能为空", type: "bad" };
    const nextAccount = tokenInput
      ? this.parseCredentialFromInput(tokenInput, nextName)
      : { ...account, accountName: nextName };
    nextAccount.requestMode = "官方";
    store.accounts[index] = nextAccount;
    if (store.defaultAccountName === oldName)
      store.defaultAccountName = nextName;
    this.saveAccountStore(store);
    return { message: `已修改：${nextName}`, type: "ok" };
  }
  async editDoneHubAccount(index) {
    const store = this.getAccountStore();
    const account = store.accounts[index];
    if (!account) return null;
    const alert = new Alert();
    alert.title = "修改 Done Hub 账号";
    alert.message = "修改账号标识或 Done Hub 请求参数";
    alert.addTextField("账号标识名字", account.accountName || "");
    alert.addTextField("Done Hub 地址", account.doneHubBaseUrl || "");
    alert.addTextField("Done Hub Key（留空不变）", "");
    alert.addTextField("渠道 ID", String(account.doneHubChannelId || ""));
    alert.addAction("确定");
    alert.addCancelAction("取消");
    const result = await alert.presentAlert();
    if (result === -1) return null;
    const oldName = account.accountName;
    const nextName = alert.textFieldValue(0).trim();
    const baseUrl = alert.textFieldValue(1).trim().replace(/\/+$/, "");
    const apiKeyInput = alert.textFieldValue(2).trim();
    const channelId = Number(alert.textFieldValue(3).trim());
    if (!nextName) return { message: "账号标识不能为空", type: "bad" };
    const nextAccount = this.normalizeAccount({
      ...account,
      accountName: nextName,
      requestMode: "Done Hub",
      doneHubBaseUrl: baseUrl,
      doneHubApiKey: apiKeyInput || account.doneHubApiKey || "",
      doneHubChannelId: channelId,
      savedAt: Math.floor(Date.now() / 1e3),
    });
    if (!this.isAccountConfigured(nextAccount))
      return { message: "Done Hub 参数不完整", type: "bad" };
    store.accounts[index] = nextAccount;
    if (store.defaultAccountName === oldName)
      store.defaultAccountName = nextName;
    this.saveAccountStore(store);
    return { message: `已修改：${nextName}`, type: "ok" };
  }
  async copyAccount(index) {
    const store = this.getAccountStore();
    const account = store.accounts[index];
    if (!account) return null;
    const alert = new Alert();
    alert.title = "复制账号";
    alert.message = "请输入新账号标识";
    alert.addTextField(
      "账号标识名字",
      `${account.accountName || "Account"} 副本`,
    );
    alert.addAction("确定");
    alert.addCancelAction("取消");
    const result = await alert.presentAlert();
    if (result === -1) return null;
    const accountName = alert.textFieldValue(0).trim();
    if (!accountName) return { message: "账号标识不能为空", type: "bad" };
    const copied = {
      ...account,
      accountName,
      savedAt: Math.floor(Date.now() / 1e3),
    };
    store.accounts.splice(index + 1, 0, copied);
    this.saveAccountStore(store);
    return { message: `已复制：${accountName}`, type: "ok" };
  }
  async deleteAccount(index) {
    const store = this.getAccountStore();
    const account = store.accounts[index];
    if (!account) return null;
    const alert = new Alert();
    alert.title = "确认删除";
    alert.message = `确定要删除账号 "${account.accountName}" 吗？`;
    alert.addCancelAction("取消");
    alert.addDestructiveAction("删除");
    const result = await alert.presentAlert();
    if (result !== 0) return null;
    store.accounts.splice(index, 1);
    if (store.defaultAccountName === account.accountName) {
      store.defaultAccountName =
        store.accounts[0]?.accountName || "请选择或者添加账号";
    }
    this.saveAccountStore(store);
    this.storage.removeStorage(this.getCacheKey(account));
    return { message: `已删除：${account.accountName}`, type: "warn" };
  }
  getSavedInfoHtml(current) {
    return current ? this.getAccountDetailHtml(current) : "未配置默认账号";
  }
  maskSecret(value) {
    if (!value) return "未配置";
    if (value.length <= 10) return `${value.slice(0, 2)}***`;
    return `${value.slice(0, 8)}...${value.slice(-4)}`;
  }
  getAccountSummary(account) {
    if (this.isDoneHubMode(account)) {
      return `${account.doneHubBaseUrl || "未配置地址"} / channel ${account.doneHubChannelId || "--"}`;
    }
    return `${account.authMode} / ${this.maskSecret(account.token)}`;
  }
  getAccountDetailHtml(account) {
    if (this.isDoneHubMode(account)) {
      return `模式: <b>Done Hub</b><br>Name: ${this.escapeHtml(account.accountName)}<br>地址: ${this.escapeHtml(
        account.doneHubBaseUrl || "未配置",
      )}<br>渠道 ID: ${this.escapeHtml(account.doneHubChannelId || "未配置")}<br>Key: ${this.escapeHtml(this.maskSecret(account.doneHubApiKey || ""))}`;
    }
    return `模式: <b>${this.escapeHtml(account.authMode)}</b><br>Name: ${this.escapeHtml(account.accountName)}<br>Token: ${this.escapeHtml(
      this.maskSecret(account.token),
    )}<br>Saved: ${this.escapeHtml(Utils.time("yyyy-MM-dd HH:mm", new Date(account.savedAt * 1e3)))}`;
  }
  getAccountListHtml() {
    const store = this.getAccountStore();
    if (store.accounts.length === 0)
      return '<div class="empty">暂无账号，保存鉴权后会出现在这里。</div>';
    return store.accounts
      .map((account, index) => {
        const isDefault = account.accountName === store.defaultAccountName;
        const mode = this.getAccountMode(account);
        const meta = this.isDoneHubMode(account)
          ? `编号: ${index} | 地址: ${account.doneHubBaseUrl || "未配置"} | 渠道: ${account.doneHubChannelId || "--"}`
          : `编号: ${index} | ${account.authMode} | ${this.maskSecret(account.token)}`;
        return `<div class="account" onclick="act('account_${index}')">
  <div class="account-main">
    <div class="account-name">${this.escapeHtml(account.accountName)}${isDefault ? '<span class="badge">默认</span>' : ""}</div>
    <div class="account-meta">${this.escapeHtml(meta)}</div>
  </div>
  <div class="mode-badge">${this.escapeHtml(mode)}</div>
  <div class="arrow">›</div>
</div>`;
      })
      .join("");
  }
  buildAuthHtml(current) {
    const savedInfo = this.getSavedInfoHtml(current);
    const accountListHtml = this.getAccountListHtml();
    return `
<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
:root{color-scheme:light dark;--bg:#f4f5f7;--card:#fff;--field:#fff;--text:#111827;--muted:#6b7280;--line:#e5e7eb;--accent:#d97706;--danger:#d92d20}
@media(prefers-color-scheme:dark){:root{--bg:#08090b;--card:#181a1f;--field:#111318;--text:#f5f7fb;--muted:#a7acb7;--line:#2b2f38}}
*{box-sizing:border-box}body{margin:0;padding:18px;background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;color:var(--text)}
.title{font-size:28px;font-weight:750;margin:18px 2px 6px}.sub{font-size:14px;line-height:1.45;color:var(--muted);margin:0 2px 16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:12px}
.label{font-size:13px;color:var(--muted);margin-bottom:8px}.saved{font-family:"SF Mono",ui-monospace,monospace;font-size:12px;line-height:1.45;color:var(--muted)}
input,textarea,select{width:100%;border:1px solid var(--line);border-radius:8px;background:var(--field);color:var(--text);padding:10px 12px;font-family:"SF Mono",ui-monospace,monospace;font-size:16px;line-height:1.35;outline:none;-webkit-text-size-adjust:100%}input,select{min-height:44px}textarea{min-height:132px;margin-top:10px;resize:vertical}select{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;font-size:16px;color-scheme:dark}option{background:var(--field);color:var(--text)}::placeholder{color:var(--muted);opacity:.72}
.row{display:flex;gap:10px;margin-top:12px}.btn{flex:1;border:0;border-radius:8px;padding:12px 10px;font-size:15px;font-weight:650;color:#fff;background:#d97706}.btn.secondary{background:#374151}.btn.warn{background:var(--danger)}
.hint{font-size:12px;color:var(--muted);line-height:1.5}.status{font-size:13px;font-weight:650;margin-top:10px}.status.ok{color:var(--accent)}.status.bad,.status.warn{color:var(--danger)}
.check{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:13px;margin-top:10px}.check input{width:auto}.field{margin-top:10px}.mode-fields{display:none}.mode-fields.active{display:block}.account{display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid var(--line);cursor:pointer}.account:first-child{border-top:0}.account:active{opacity:.72}.account-main{flex:1;min-width:0}.account-name{font-size:15px;font-weight:700}.account-meta{font-family:"SF Mono",ui-monospace,monospace;font-size:11px;color:var(--muted);line-height:1.45;word-break:break-all}.badge,.mode-badge{display:inline-block;margin-left:8px;padding:2px 6px;border-radius:999px;background:var(--accent);color:#fff;font-size:11px}.mode-badge{margin-left:0;background:#374151;white-space:nowrap}.arrow{font-size:24px;color:var(--muted)}.empty{color:var(--muted);font-size:13px;padding:8px 0}
</style>
</head>
<body>
<div class="title">Claude 账号管理</div>
<p class="sub">每个账号都可以选择 <b>官方</b> 或 <b>Done Hub</b> 模式。官方可粘贴 Claude Code OAuth token 或 Anthropic API key；Done Hub 填代理额度接口参数。</p>
<div class="card">
  <div class="label">当前默认账号</div>
  <div id="savedInfo" class="saved">${savedInfo}</div>
  <div id="status" class="status"></div>
</div>
<div class="card">
  <div class="label">添加账号</div>
  <select id="requestMode" onchange="toggleModeFields()">
    <option value="官方">官方</option>
    <option value="Done Hub">Done Hub</option>
  </select>
  <input class="field" id="accountName" spellcheck="false" placeholder="账号标识名字，例如 Pro / Team / Done Hub">
  <div id="officialFields" class="mode-fields active">
    <textarea id="authInput" spellcheck="false" placeholder='粘贴 {"claudeAiOauth":{"accessToken":"sk-ant-oat..."}} 或 sk-ant-api...'></textarea>
  </div>
  <div id="doneHubFields" class="mode-fields">
    <input class="field" id="doneHubBaseUrl" spellcheck="false" placeholder="Done Hub 地址，例如 https://hub.example.com">
    <input class="field" id="doneHubApiKey" spellcheck="false" placeholder="Done Hub Key，sk-...">
    <input class="field" id="doneHubChannelId" inputmode="numeric" spellcheck="false" placeholder="渠道 ID，例如 1">
  </div>
  <label class="check"><input id="setDefault" type="checkbox" checked> 保存后设为默认账号</label>
  <div class="row"><button class="btn" onclick="act('save')">保存账号</button><button class="btn warn" onclick="act('clear')">清除全部</button></div>
</div>
<div class="card">
  <div class="label">账号列表</div>
  <div id="accountList">${accountListHtml}</div>
</div>
<div class="card">
  <div class="hint">桌面端 Claude Code 凭据通常在 <b>~/.claude/.credentials.json</b>；如果是 macOS Keychain，也可把 Keychain 中的同结构 JSON 或 token 粘贴进来。Parameter 填 <b>0</b> 使用第一个账号，填 <b>1</b> 使用第二个账号。</div>
  <div class="row"><button class="btn secondary" onclick="act('open')">打开 Claude 用量页</button></div>
</div>
<script>
function act(name){ window.__claudeAction = name; }
function toggleModeFields(){
  var mode=document.getElementById('requestMode').value;
  document.getElementById('officialFields').className='mode-fields'+(mode==='官方'?' active':'');
  document.getElementById('doneHubFields').className='mode-fields'+(mode==='Done Hub'?' active':'');
}
window.setStatus=function(text,type){var el=document.getElementById('status');el.innerText=text;el.className='status '+(type||'');}
window.setSavedInfo=function(html){document.getElementById('savedInfo').innerHTML=html;}
window.renderAccounts=function(html){document.getElementById('accountList').innerHTML=html;}
toggleModeFields();
</script>
</body>
</html>`;
  }
  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  async render() {
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    await this.loadUsage();
    widget.url = `scriptable:///run/${encodeURIComponent(Script.name())}`;
    switch (this.widgetFamily) {
      case "small":
        return await this.renderSmall(widget);
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
EndAwait(() => Runing(ClaudeMonitor, args.widgetParameter, false));

await __topLevelAwait__();
