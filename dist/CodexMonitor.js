// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: black; icon-glyph: terminal;

/*
 * author   :  seiun
 * date     :  2026/06/05
 * build    :  2026-06-11 22:52:17
 * desc     :  Codex 额度监控，支持官方直连与 Done Hub 代理
 * version  :  1.0.1
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc;
}

// src/scripts/CodexMonitor.tsx
var dependencyFileName = "Seiun.Env.js";
var runtimeRequire = typeof require === "undefined" ? importModule : require;
var { WidgetBase, Runing, Utils, GenrateView, h } =
  runtimeRequire(dependencyFileName);
var USAGE_URL = "https://chatgpt.com/backend-api/wham/usage";
var PROBE_URL = "https://developers.openai.com/codex";
var DONE_HUB_USAGE_PATH = "/api/codex/usage";
var CACHE_KEY = "codex_usage_status";
var CREDENTIAL_KEY = "CodexMonitor.credential";
var CODEX_DESKTOP_USER_AGENT =
  "Codex Desktop/26.601.2237.0 (Windows NT 10.0; x64)";
var CODEX_ICON_URL =
  "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/codex.png";
var CodexMonitor = class extends WidgetBase {
  constructor(scriptName) {
    super(scriptName);
    this.name = "Codex监控";
    this.en = "CodexMonitor";
    this.widgetParam = args.widgetParameter;
    this.usageStatus = null;
    this.dataFetchTime = null;
    this.isRequestSuccess = false;
    this.isDataExpired = false;
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
        config: {
          placeholder: "5",
          style: "compact",
        },
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
        desc: "官方直连使用 Codex access token；Done Hub 使用代理额度接口",
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
        config: {
          placeholder: "https://hub.example.com",
          style: "compact",
        },
      },
      {
        title: "Done Hub Key",
        desc: "填写 done-hub 用户令牌 sk-...；建议单独创建只给监控用的 key",
        icon: { name: "lock.shield", color: "#F2C94C" },
        type: "text",
        option: { doneHubApiKey: "" },
        config: {
          placeholder: "sk-...",
          style: "compact",
        },
      },
      {
        title: "渠道 ID",
        desc: "done-hub 后台 Codex 渠道的 channel_id",
        icon: { name: "number", color: "#27C46A" },
        type: "text",
        option: { doneHubChannelId: "0" },
        config: {
          placeholder: "1",
          style: "compact",
        },
      },
    ]);
    this.registerSetting([
      {
        title: "账号管理",
        desc: "管理官方账号和 Done Hub 请求配置；Parameter 可填官方账号编号",
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
          await this.notify("已清除缓存", "下次刷新会重新探测网络并请求额度");
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
          version: 3,
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
          version: Number(parsed.version ?? 3),
          defaultAccountName: String(
            parsed.defaultAccountName ||
              accounts[0]?.accountName ||
              "请选择或者添加账号",
          ),
          accounts,
        };
      }
      if (parsed.accessToken) {
        const legacyAccount = {
          accountName: parsed.accountName || parsed.accountId || "Default",
          requestMode: "官方",
          accessToken: parsed.accessToken,
          accountId: parsed.accountId ?? null,
          expiresAt: parsed.expiresAt ?? null,
          savedAt: parsed.savedAt ?? Math.floor(Date.now() / 1e3),
        };
        const store = {
          version: 2,
          defaultAccountName: legacyAccount.accountName,
          accounts: [legacyAccount],
        };
        this.saveAccountStore(store);
        return store;
      }
    } catch (error) {
      console.log(`读取鉴权失败: ${error}`);
    }
    return {
      version: 3,
      defaultAccountName: "请选择或者添加账号",
      accounts: [],
    };
  }
  normalizeAccount(account) {
    const requestMode =
      account?.requestMode === "Done Hub" || account?.doneHubBaseUrl
        ? "Done Hub"
        : "官方";
    const accountName = String(
      account?.accountName ||
        (requestMode === "Done Hub"
          ? "Done Hub"
          : account?.accountId || "Default"),
    ).trim();
    if (requestMode === "Done Hub") {
      return {
        accountName,
        requestMode,
        accessToken: "",
        accountId: null,
        expiresAt: null,
        doneHubBaseUrl: String(account?.doneHubBaseUrl || "")
          .trim()
          .replace(/\/+$/, ""),
        doneHubApiKey: String(account?.doneHubApiKey || "").trim(),
        doneHubChannelId: Number(account?.doneHubChannelId || 0),
        savedAt: account?.savedAt ?? Math.floor(Date.now() / 1e3),
      };
    }
    return {
      accountName,
      requestMode,
      accessToken: String(account?.accessToken || ""),
      accountId: account?.accountId ?? null,
      expiresAt: account?.expiresAt ?? null,
      savedAt: account?.savedAt ?? Math.floor(Date.now() / 1e3),
    };
  }
  isAccountConfigured(account) {
    if (!account?.accountName) return false;
    if (this.getAccountMode(account) === "Done Hub") {
      return Boolean(
        account.doneHubBaseUrl &&
        account.doneHubApiKey &&
        Number(account.doneHubChannelId) > 0,
      );
    }
    return Boolean(account.accessToken);
  }
  isSameRequestAccount(left, right) {
    if (this.getAccountMode(left) !== this.getAccountMode(right)) return false;
    if (this.getAccountMode(left) === "Done Hub") {
      return (
        left.doneHubBaseUrl === right.doneHubBaseUrl &&
        Number(left.doneHubChannelId || 0) ===
          Number(right.doneHubChannelId || 0)
      );
    }
    return (
      left.accountId === right.accountId &&
      left.accountName === right.accountName
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
    return {
      accountName: `Done Hub ${index + 1}`,
      requestMode: "Done Hub",
      accessToken: "",
      accountId: null,
      expiresAt: null,
      doneHubBaseUrl: baseUrl,
      doneHubApiKey: apiKey,
      doneHubChannelId: Math.floor(channelId),
      savedAt: Math.floor(Date.now() / 1e3),
    };
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
    const identity = account?.accountName || account?.accountId || "default";
    return `${CACHE_KEY}_${identity.replace(/[^A-Za-z0-9_-]/g, "_")}`;
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
      JSON.stringify({ version: 3, defaultAccountName, accounts }),
    );
    this.currentSettings.accountSettings.defaultAccount.val =
      defaultAccountName;
  }
  getAccounts() {
    return this.getAccountStore().accounts;
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
  getAccountMode(account = this.currentAccount) {
    return account?.requestMode === "Done Hub" ? "Done Hub" : "官方";
  }
  isDoneHubMode(account = this.currentAccount) {
    return this.getAccountMode(account) === "Done Hub";
  }
  getRequestModeLabel() {
    return this.getAccountMode();
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
      `[${this.en}] 缓存状态: ${label} key=${cacheKey} hit=${Boolean(cache?.usage)} fetchedAt=${cache?.fetchedAt ? Utils.time("yyyy-MM-dd HH:mm:ss", new Date(cache.fetchedAt)) : "none"}`,
    );
  }
  logCredentialState(credential) {
    const store = this.getAccountStore();
    console.log(
      `[${this.en}] Keychain状态: contains=${Keychain.contains(CREDENTIAL_KEY)} accounts=${store.accounts.length} default=${store.defaultAccountName} selected=${credential?.accountName || "none"} mode=${this.getAccountMode(credential)} accountId=${credential?.accountId || "none"} token=${credential?.accessToken ? this.maskSecret(credential.accessToken) : "none"}`,
    );
  }
  parseCredentialFromInput(input, accountNameInput) {
    const accessToken = this.extractAccessToken(input);
    if (!accessToken) throw new Error("未找到 access token");
    const payload = this.decodeJwtPayload(accessToken);
    const authInfo = payload["https://api.openai.com/auth"];
    const accountId =
      typeof authInfo?.chatgpt_account_id === "string"
        ? authInfo.chatgpt_account_id
        : null;
    const expiresAt = typeof payload.exp === "number" ? payload.exp : null;
    const accountName = (
      accountNameInput ||
      accountId ||
      `Account ${this.getAccounts().length + 1}`
    ).trim();
    return {
      accountName,
      requestMode: "官方",
      accessToken,
      accountId,
      expiresAt,
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
  extractAccessToken(input) {
    const value = input.trim();
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      const token = parsed.tokens?.access_token;
      if (typeof token === "string" && token.includes(".")) return token.trim();
    } catch {}
    const bearerMatch = value.match(/Bearer\s+([A-Za-z0-9._-]+)/);
    if (bearerMatch?.[1]) return bearerMatch[1];
    const tokenMatch = value.match(/eyJ[A-Za-z0-9._-]+/);
    return tokenMatch?.[0] ?? null;
  }
  decodeJwtPayload(token) {
    const payload = token.split(".")[1];
    if (!payload) throw new Error("access token 格式异常");
    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    const data = Data.fromBase64String(base64);
    if (!data) throw new Error("access token payload 解码失败");
    const raw = data.toRawString();
    if (!raw) throw new Error("access token payload 不是 UTF-8");
    return JSON.parse(raw);
  }
  isCredentialExpired(credential) {
    if (!credential?.expiresAt) return false;
    return credential.expiresAt <= Math.floor(Date.now() / 1e3) + 60;
  }
  async probeCodexSite() {
    try {
      this.logRequestStart("Codex官网探测", PROBE_URL);
      const request = new Request(PROBE_URL);
      request.method = "GET";
      request.timeoutInterval = 8;
      await request.loadString();
      const statusCode = Number(request.response?.statusCode ?? 0);
      if (statusCode > 0) {
        console.log(`Codex官网探测成功: HTTP ${statusCode}`);
        return { ok: true, message: `官网 HTTP ${statusCode}` };
      }
      return { ok: true, message: "官网可访问" };
    } catch (error) {
      const message = `官网探测失败: ${this.shortError(error)}`;
      console.log(message);
      return { ok: false, message };
    }
  }
  shortError(error) {
    const text = String(error ?? "");
    return text.length > 80 ? `${text.slice(0, 77)}...` : text;
  }
  getHttpStatusLabel(request) {
    const statusCode = Number(request.response?.statusCode ?? 0);
    return statusCode > 0 ? String(statusCode) : "OK";
  }
  async requestOfficialUsage(credential) {
    if (!credential.accessToken) throw new Error("请配置 access token");
    const headers = {
      Authorization: `Bearer ${credential.accessToken}`,
      originator: "Codex Desktop",
      "User-Agent": CODEX_DESKTOP_USER_AGENT,
      "Accept-Language": "zh-CN,zh;q=0.9",
    };
    if (credential.accountId) {
      headers["ChatGPT-Account-Id"] = credential.accountId;
    }
    this.logRequestStart("Codex官方", USAGE_URL);
    const request = new Request(USAGE_URL);
    request.method = "GET";
    request.headers = headers;
    request.timeoutInterval = 15;
    let data = null;
    try {
      data = await request.loadJSON();
    } catch (error) {
      const statusCode = Number(request.response?.statusCode ?? 0);
      if (statusCode > 0) throw new Error(`请求失败: HTTP ${statusCode}`);
      throw error;
    }
    this.logRequestResponse("Codex官方", request, data);
    if (!data || typeof data !== "object" || !data.rate_limit) {
      const statusCode = Number(request.response?.statusCode ?? 0);
      if (statusCode > 0) throw new Error(`请求失败: HTTP ${statusCode}`);
      throw new Error("响应缺少 rate_limit");
    }
    console.log(`Codex额度请求成功: HTTP ${this.getHttpStatusLabel(request)}`);
    return data;
  }
  async requestDoneHubUsage(credential) {
    const baseUrl = this.getDoneHubBaseUrl(credential);
    const apiKey = this.getDoneHubApiKey(credential);
    const channelId = this.getDoneHubChannelId(credential);
    if (!baseUrl) throw new Error("请配置 Done Hub 地址");
    if (!apiKey) throw new Error("请配置 Done Hub Key");
    if (channelId <= 0) throw new Error("请配置 Done Hub 渠道 ID");
    const url = `${baseUrl}${DONE_HUB_USAGE_PATH}?channel_id=${encodeURIComponent(String(channelId))}`;
    this.logRequestStart("Done Hub Codex", url);
    const request = new Request(url);
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
    this.logRequestResponse("Done Hub Codex", request, payload);
    if (response?.success === false)
      throw new Error(response.message || "Done Hub 请求失败");
    const data = response?.data?.usage || payload;
    if (!data || typeof data !== "object" || !data.rate_limit) {
      const statusCode = Number(request.response?.statusCode ?? 0);
      if (statusCode > 0)
        throw new Error(`Done Hub 响应异常: HTTP ${statusCode}`);
      throw new Error("Done Hub 响应缺少 rate_limit");
    }
    console.log(
      `Done Hub Codex额度请求成功: HTTP ${this.getHttpStatusLabel(request)}`,
    );
    return data;
  }
  async requestUsage(credential) {
    if (!credential) throw new Error("请先配置鉴权");
    if (this.isDoneHubMode(credential))
      return await this.requestDoneHubUsage(credential);
    return await this.requestOfficialUsage(credential);
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
  async loadUsage() {
    const credential = this.readCredential();
    this.logCredentialState(credential);
    const isDoneHub = this.isDoneHubMode(credential);
    if (!credential) {
      const cache = this.getAnyCachedUsage();
      this.logCacheState("未配置鉴权 fallback", cache);
      if (cache?.usage) {
        this.useCache(cache, true, "未配置鉴权，显示缓存");
        return;
      }
      this.statusMessage = "请先配置鉴权";
      return;
    }
    const freshCache = this.getCachedUsage();
    this.logCacheState("fresh", freshCache);
    if (freshCache?.usage) {
      this.useCache(freshCache, false, "使用缓存");
      return;
    }
    if (!isDoneHub && this.isCredentialExpired(credential)) {
      const cache = this.getAnyCachedUsage();
      this.logCacheState("鉴权过期 fallback", cache);
      if (cache?.usage) {
        this.useCache(cache, true, "鉴权已过期，显示缓存");
        return;
      }
      this.statusMessage = "鉴权已过期";
      return;
    }
    if (!isDoneHub) {
      const probe = await this.probeCodexSite();
      if (!probe.ok) {
        const cache = this.getAnyCachedUsage();
        this.logCacheState("网络探测失败 fallback", cache);
        if (cache?.usage) {
          this.useCache(cache, true, "网络障碍/使用缓存");
          return;
        }
        this.statusMessage = probe.message;
        return;
      }
    }
    if (
      isDoneHub &&
      (!this.getDoneHubBaseUrl(credential) ||
        !this.getDoneHubApiKey(credential) ||
        this.getDoneHubChannelId(credential) <= 0)
    ) {
      const cache = this.getAnyCachedUsage();
      this.logCacheState("Done Hub 未配置 fallback", cache);
      if (cache?.usage) {
        this.useCache(cache, true, "代理未配置/使用缓存");
        return;
      }
      this.statusMessage = "请配置 Done Hub";
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
      this.statusMessage = "在线";
    } catch (error) {
      console.log(`请求Codex额度失败: ${error}`);
      const cache = this.getAnyCachedUsage();
      this.logCacheState("请求失败 fallback", cache);
      if (cache?.usage) {
        this.useCache(
          cache,
          true,
          this.isRateLimitError(error)
            ? "频率限制/使用缓存"
            : "请求失败/使用缓存",
        );
        return;
      }
      this.statusMessage = String(error);
    }
  }
  getWindowLabel(seconds) {
    const minutes = Number(seconds ?? 0) / 60;
    if (Math.abs(minutes - 300) <= 15) return "5 小时";
    if (Math.abs(minutes - 10080) <= 504) return "每周";
    if (Math.abs(minutes - 1440) <= 72) return "每日";
    if (minutes >= 4e4 && minutes <= 46e3) return "每月";
    if (minutes >= 60) return `${Math.round(minutes / 60)} 小时`;
    if (minutes > 0) return `${Math.round(minutes)} 分钟`;
    return "额度";
  }
  normalizeWindow(title, windowInfo, fallbackKey) {
    if (!windowInfo) return null;
    const used = this.clampPercent(windowInfo.used_percent ?? 0);
    const windowLabel = this.getWindowLabel(windowInfo.limit_window_seconds);
    return {
      key: `${fallbackKey}-${windowLabel}`,
      title: `${title ? `${title} ` : ""}${windowLabel}使用限额`,
      usedPercent: used,
      remainingPercent: this.clampPercent(100 - used),
      resetAt:
        typeof windowInfo.reset_at === "number" ? windowInfo.reset_at : null,
      windowLabel,
    };
  }
  getUsageRows() {
    const rows = [];
    const core = this.usageStatus?.rate_limit;
    const primary = this.normalizeWindow(
      "",
      core?.primary_window,
      "core-primary",
    );
    const secondary = this.normalizeWindow(
      "",
      core?.secondary_window,
      "core-secondary",
    );
    if (primary) rows.push(primary);
    if (secondary) rows.push(secondary);
    const additional = this.usageStatus?.additional_rate_limits ?? [];
    for (const item of additional) {
      const name = item.limit_name?.trim() || "模型";
      const p = this.normalizeWindow(
        name,
        item.rate_limit?.primary_window,
        `${name}-primary`,
      );
      const s = this.normalizeWindow(
        name,
        item.rate_limit?.secondary_window,
        `${name}-secondary`,
      );
      if (p) rows.push(p);
      if (s) rows.push(s);
    }
    return rows;
  }
  clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }
  formatResetTime(seconds) {
    if (!seconds) return "使用后滚动计量";
    return Utils.time("yyyy年MM月dd日 HH:mm", new Date(seconds * 1e3));
  }
  getResetText(seconds) {
    return seconds
      ? `重置 ${this.formatResetTime(seconds)}`
      : this.formatResetTime(seconds);
  }
  formatUpdateTime() {
    if (!this.dataFetchTime) return "暂无缓存";
    return Utils.time("HH:mm:ss", new Date(this.dataFetchTime));
  }
  getStatusColor() {
    if (this.isRequestSuccess) return new Color("#27C46A");
    return Color.red();
  }
  getPlanLabel() {
    const planType = this.usageStatus?.plan_type;
    return planType ? String(planType).toUpperCase() : "未连接";
  }
  getTitleText() {
    return "Codex";
  }
  getTitleAccountLabel() {
    return this.currentAccount?.accountName
      ? ` @${this.currentAccount.accountName}`
      : "";
  }
  getHeaderTitleText() {
    return `${this.getTitleText()}${this.getTitleAccountLabel()} | ${this.getPlanLabel()}`;
  }
  getSmallSubtitleText() {
    return `${this.getAccountMode(this.currentAccount)} | ${this.getPlanLabel()}`;
  }
  getCreditText() {
    const credits = this.usageStatus?.credits;
    if (!credits) return "无额度数据";
    if (credits.unlimited) return "无限";
    return `${credits.balance ?? 0} $`;
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
  estimateTextWidth(text, fontSize, min, max) {
    let asciiCount = 0;
    let wideCount = 0;
    for (const char of text) {
      if (char.charCodeAt(0) <= 127) asciiCount += 1;
      else wideCount += 1;
    }
    const asciiWidth = asciiCount * fontSize * 0.62;
    const wideWidth = wideCount * fontSize;
    return Math.max(min, Math.min(Math.ceil(asciiWidth + wideWidth), max));
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
                    var action = window.__codexAction || '';
                    if (action) window.__codexAction = '';
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
        Safari.open("https://chatgpt.com/");
      } else if (action === "docs") {
        Safari.open("https://developers.openai.com/codex/auth");
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
    alert.title = "修改官方账号";
    alert.message = "可修改账号标识，或替换 access token";
    alert.addTextField("账号标识名字", account.accountName || "");
    alert.addTextField("access token / auth.json（留空不变）", "");
    alert.addAction("确定");
    alert.addCancelAction("取消");
    const result = await alert.presentAlert();
    if (result === -1) return null;
    const oldName = account.accountName;
    const nextName = alert.textFieldValue(0).trim();
    const tokenInput = alert.textFieldValue(1).trim();
    if (!nextName) return { message: "账号标识不能为空", type: "bad" };
    let nextAccount = { ...account, accountName: nextName };
    if (tokenInput) {
      nextAccount = this.parseCredentialFromInput(tokenInput, nextName);
    }
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
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }
  getAccountSummary(account) {
    if (this.isDoneHubMode(account)) {
      return `${account.doneHubBaseUrl || "未配置地址"} / channel ${account.doneHubChannelId || "--"}`;
    }
    return account.accountId || "未识别 account id";
  }
  getAccountDetailHtml(account) {
    if (this.isDoneHubMode(account)) {
      return `模式: <b>Done Hub</b><br>Name: ${this.escapeHtml(account.accountName)}<br>地址: ${this.escapeHtml(
        account.doneHubBaseUrl || "未配置",
      )}<br>渠道 ID: ${this.escapeHtml(account.doneHubChannelId || "未配置")}<br>Key: ${this.escapeHtml(this.maskSecret(account.doneHubApiKey || ""))}`;
    }
    return `模式: <b>官方</b><br>Name: ${this.escapeHtml(account.accountName)}<br>Account: ${this.escapeHtml(account.accountId ?? "未识别")}<br>Expires: ${account.expiresAt ? this.escapeHtml(Utils.time("yyyy-MM-dd HH:mm", new Date(account.expiresAt * 1e3))) : "未知"}`;
  }
  getAccountListHtml() {
    const store = this.getAccountStore();
    if (store.accounts.length === 0) {
      return '<div class="empty">暂无账号，保存鉴权后会出现在这里。</div>';
    }
    return store.accounts
      .map((account, index) => {
        const isDefault = account.accountName === store.defaultAccountName;
        const mode = this.getAccountMode(account);
        const meta = this.isDoneHubMode(account)
          ? `编号: ${index} | 地址: ${account.doneHubBaseUrl || "未配置"} | 渠道: ${account.doneHubChannelId || "--"}`
          : `编号: ${index} | Account: ${account.accountId ?? "未识别"} | Expires: ${account.expiresAt ? Utils.time("yyyy-MM-dd HH:mm", new Date(account.expiresAt * 1e3)) : "未知"}`;
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
:root{color-scheme:light dark;--bg:#f4f5f7;--card:#fff;--field:#fff;--text:#111827;--muted:#6b7280;--line:#e5e7eb;--accent:#0f9f58;--danger:#d92d20}
@media(prefers-color-scheme:dark){:root{--bg:#08090b;--card:#181a1f;--field:#111318;--text:#f5f7fb;--muted:#a7acb7;--line:#2b2f38}}
*{box-sizing:border-box}body{margin:0;padding:18px;background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;color:var(--text)}
.title{font-size:28px;font-weight:750;margin:18px 2px 6px}.sub{font-size:14px;line-height:1.45;color:var(--muted);margin:0 2px 16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:12px}
.label{font-size:13px;color:var(--muted);margin-bottom:8px}.saved{font-family:"SF Mono",ui-monospace,monospace;font-size:12px;line-height:1.45;color:var(--muted)}
input,textarea,select{width:100%;border:1px solid var(--line);border-radius:8px;background:var(--field);color:var(--text);padding:10px 12px;font-family:"SF Mono",ui-monospace,monospace;font-size:16px;line-height:1.35;outline:none;-webkit-text-size-adjust:100%}input,select{min-height:44px}textarea{min-height:132px;margin-top:10px;resize:vertical}select{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;font-size:16px;color-scheme:dark}option{background:var(--field);color:var(--text)}::placeholder{color:var(--muted);opacity:.72}
.row{display:flex;gap:10px;margin-top:12px}.btn{flex:1;border:0;border-radius:8px;padding:12px 10px;font-size:15px;font-weight:650;color:#fff;background:#2563eb}.btn.secondary{background:#374151}.btn.warn{background:var(--danger)}
.hint{font-size:12px;color:var(--muted);line-height:1.5}.status{font-size:13px;font-weight:650;margin-top:10px}.status.ok{color:var(--accent)}.status.bad,.status.warn{color:var(--danger)}
.check{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:13px;margin-top:10px}.check input{width:auto}.field{margin-top:10px}.mode-fields{display:none}.mode-fields.active{display:block}.account{display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid var(--line);cursor:pointer}.account:first-child{border-top:0}.account:active{opacity:.72}.account-main{flex:1;min-width:0}.account-name{font-size:15px;font-weight:700}.account-meta{font-family:"SF Mono",ui-monospace,monospace;font-size:11px;color:var(--muted);line-height:1.45;word-break:break-all}.badge,.mode-badge{display:inline-block;margin-left:8px;padding:2px 6px;border-radius:999px;background:var(--accent);color:#fff;font-size:11px}.mode-badge{margin-left:0;background:#374151;white-space:nowrap}.arrow{font-size:24px;color:var(--muted)}.empty{color:var(--muted);font-size:13px;padding:8px 0}
</style>
</head>
<body>
<div class="title">Codex 账号管理</div>
<p class="sub">每个账号都可以选择 <b>官方</b> 或 <b>Done Hub</b> 模式。默认账号决定 Widget 使用哪种请求方式；Parameter 可填账号编号临时切换。</p>
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
    <textarea id="authInput" spellcheck="false" placeholder='粘贴 {"tokens":{"access_token":"..."}} 或 Bearer eyJ...'></textarea>
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
  <div class="hint">官方模式的桌面端路径通常是 <b>~/.codex/auth.json</b>。Parameter 填 <b>0</b> 使用第一个账号，填 <b>1</b> 使用第二个账号；不填则使用默认账号。</div>
  <div class="row"><button class="btn secondary" onclick="act('open')">打开 ChatGPT</button><button class="btn secondary" onclick="act('docs')">官方鉴权文档</button></div>
</div>
<script>
function act(name){ window.__codexAction = name; }
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
    const percentRow = card.addStack();
    percentRow.layoutHorizontally();
    percentRow.centerAlignContent();
    const percent = percentRow.addText(`${Math.round(row.remainingPercent)}%`);
    percent.textColor = this.widgetColor;
    percent.font = Font.boldSystemFont(19);
    percent.minimumScaleFactor = 0.75;
    percent.lineLimit = 1;
    percentRow.addSpacer(4);
    const remaining = percentRow.addText("剩余");
    remaining.textColor = this.widgetColor;
    remaining.font = Font.boldSystemFont(13);
    remaining.minimumScaleFactor = 0.8;
    remaining.lineLimit = 1;
    card.addSpacer(3);
    this.renderProgressBar(card, row.remainingPercent, progressWidth);
    card.addSpacer(5);
    const reset = card.addText(this.getResetText(row.resetAt));
    reset.textColor = this.widgetColor;
    reset.font = Font.systemFont(9);
    reset.textOpacity = 0.55;
    reset.lineLimit = 1;
    reset.minimumScaleFactor = 0.7;
  }
  async renderSmall(widget) {
    const rows = this.getUsageRows();
    const worst =
      rows.length > 0
        ? rows.reduce(
            (min, row) =>
              row.remainingPercent < min.remainingPercent ? row : min,
            rows[0],
          )
        : null;
    GenrateView.setListWidget(widget);
    widget.setPadding(12, 12, 12, 12);
    widget.addSpacer(2);
    const titleRow = widget.addStack();
    titleRow.layoutHorizontally();
    titleRow.centerAlignContent();
    if (CODEX_ICON_URL) {
      try {
        const iconImage = await this.getImageByUrl(CODEX_ICON_URL);
        if (iconImage) {
          const icon = titleRow.addImage(iconImage);
          icon.imageSize = new Size(22, 22);
          icon.cornerRadius = 4;
          titleRow.addSpacer(6);
        }
      } catch (error) {
        console.log(`加载Codex图标失败: ${error}`);
      }
    }
    const title = titleRow.addText(this.getTitleText());
    title.textColor = this.widgetColor;
    title.font = Font.boldSystemFont(14);
    title.textOpacity = 0.78;
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.7;
    titleRow.addSpacer();
    widget.addSpacer(4);
    const subTitleRow = widget.addStack();
    subTitleRow.layoutHorizontally();
    const accountText = this.getSmallSubtitleText();
    const account = subTitleRow.addText(accountText);
    account.textColor = this.widgetColor;
    account.font = Font.mediumSystemFont(11);
    account.textOpacity = 0.68;
    account.lineLimit = 1;
    account.minimumScaleFactor = 0.65;
    subTitleRow.addSpacer();
    widget.addSpacer(8);
    const valueRow = widget.addStack();
    valueRow.layoutHorizontally();
    const value = valueRow.addText(
      worst ? `${Math.round(worst.remainingPercent)}%` : "--",
    );
    value.textColor =
      worst && worst.remainingPercent < 20 ? Color.red() : this.widgetColor;
    value.font = Font.boldSystemFont(36);
    value.minimumScaleFactor = 0.7;
    valueRow.addSpacer();
    widget.addSpacer(4);
    const label = widget.addText(
      worst ? worst.title.replace("Codex ", "") : this.statusMessage,
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
    if (CODEX_ICON_URL) {
      try {
        const iconImage = await this.getImageByUrl(CODEX_ICON_URL);
        if (iconImage) {
          const icon = header.addImage(iconImage);
          icon.imageSize = new Size(16, 16);
          icon.cornerRadius = 3;
          header.addSpacer(6);
        }
      } catch (error) {
        console.log(`加载Codex图标失败: ${error}`);
      }
    }
    const headerTitleText = this.getHeaderTitleText();
    const title = header.addText(headerTitleText);
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
    const credit = footer.addText(
      `账户余额：${this.getCreditText()} · ${this.getAccountMode(this.currentAccount)}`,
    );
    credit.textColor = this.widgetColor;
    credit.font = Font.mediumSystemFont(10);
    credit.textOpacity = 0.62;
    credit.lineLimit = 1;
    credit.minimumScaleFactor = 0.75;
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
EndAwait(() => Runing(CodexMonitor, args.widgetParameter, false));

await __topLevelAwait__();
