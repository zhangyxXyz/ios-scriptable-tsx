// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: gauge;

/*
 * author   :  seiunzhang
 * date     :  2026/11/15
 * desc     :  CLIProxy-Api 额度卡片，支持 Keychain、查询发现、小号一项、中号四项与大号六项自由排列
 * version  :  1.1.6
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */
import type { SeiunEnv, SettingValue, SettingItemConfig } from "@app/env/types";
import {
  smallDefaults,
  mediumDefaults,
  largeDefaults,
  presets,
  tileChoices,
  selectTiles,
  statusLabels,
  attachPlans,
} from "../widgets/cpa-monitor";
import type { MonitorResponse, Choice, Tile } from "../widgets/cpa-monitor";
import { loadCachedQuota, QuotaRequestError } from "../widgets/cpa-cache";
import type { QuotaCache } from "../widgets/cpa-cache";

declare const importModule: (moduleName: string) => SeiunEnv;
const runtimeRequire = typeof require === "undefined" ? importModule : require;
const { WidgetBase, Runing, GenrateView, Utils } = runtimeRequire(
  "Seiun.Env.js",
) as SeiunEnv;
const keychainSlot = "CPAMonitor:downstream-key";
const refreshInterval = 5 * 60 * 1000;
const quotaCacheKey = "cpa-quota-snapshot-v1";

type Fields = Record<string, SettingValue<string>>;
class CPAMonitor extends WidgetBase {
  name = "CLIProxy-Api额度监控";
  en = "CPAMonitor";
  widgetParam = args.widgetParameter;
  currentSettings: Record<string, Fields> = {
    requestSettings: {
      origin: { val: "", type: this.settingValTypeString },
      include: { val: "", type: this.settingValTypeString },
      provider: { val: "", type: this.settingValTypeString },
    },
    displaySettings: {
      catalog: { val: "[]", type: this.settingValTypeString },
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
  statusMessage = "等待刷新";
  statusWarning = false;
  dataFetchTime: number | null = null;
  providerIcons: Record<string, Image | null> = {};
  choiceConfigs: SettingItemConfig[] = [];
  constructor(scriptName?: string) {
    super(scriptName);
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
    const settings = this.getSettings() as {
      displaySettings?: { catalog?: string };
    };
    let discovered: Choice[] = [];
    try {
      discovered = JSON.parse(settings.displaySettings?.catalog || "[]");
    } catch {
      /* Invalid saved choices are ignored. */
    }
    if (!Array.isArray(discovered)) discovered = [];
    for (const [family, defaults] of [
      ["small", smallDefaults],
      ["medium", mediumDefaults],
      ["large", largeDefaults],
    ] as const) {
      this.registerSettingCategory(
        family + "Settings",
        family === "small"
          ? "小卡片 · 1 项"
          : family === "medium"
            ? "中卡片 · 2 × 2"
            : "大卡片 · 2 × 3",
        defaults.map((id, index) => {
          const cfg: SettingItemConfig = {
            selectOptions: this.choices(discovered),
            style: "compact",
          };
          this.choiceConfigs.push(cfg);
          return {
            title:
              family === "small"
                ? "第 1 项 · 显示额度"
                : `第 ${index + 1} 项 · ${["左上", "右上", "左中", "右中", "左下", "右下"][family === "medium" && index > 1 ? index + 2 : index]}`,
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
          await this.presentSettings(["smallSettings"]);
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
  choices(discovered: Choice[]) {
    return [
      ...presets.map((p) => ({ label: p.label, value: p.id })),
      ...discovered.filter(
        (p) => typeof p?.label === "string" && typeof p?.value === "string",
      ),
    ];
  }
  saveCatalog(choices: Choice[]) {
    const value = JSON.stringify(choices);
    this.settings.displaySettings = {
      ...((this.settings.displaySettings as Record<string, unknown>) || {}),
      catalog: value,
    };
    this.syncCurrentSettings("displaySettings", "catalog", value);
    this.saveSettings(false);
    for (const config of this.choiceConfigs)
      config.selectOptions = this.choices(choices);
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
    if (value) Keychain.set(keychainSlot, value);
    else if (Keychain.contains(keychainSlot)) Keychain.remove(keychainSlot);
    this.saveCatalog([]);
    await this.notify(
      "已保存",
      value ? "请点击“查询并发现额度项”，再调整卡片排列" : "API Key 已清除",
    );
  }
  async loadQuota(force = false): Promise<MonitorResponse> {
    const settings = this.currentSettings.requestSettings;
    const scope = this.md5(
      JSON.stringify([
        settings.origin.val.trim().replace(/\/+$/, ""),
        settings.include.val.trim(),
        settings.provider.val.trim(),
        Keychain.contains(keychainSlot) ? Keychain.get(keychainSlot) : "",
      ]),
    );
    const loaded = await loadCachedQuota({
      scope,
      now: Date.now(),
      force,
      cache: this.storage.getStorage<QuotaCache>(quotaCacheKey),
      request: () => this.fetchQuota(),
      save: (value) => this.storage.setStorage(quotaCacheKey, value),
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
  async fetchQuota(): Promise<MonitorResponse> {
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
        "/v0/resource/plugins/cpa-key-billing/monitor/usage" +
        (params.length ? "?" + params.join("&") : ""),
    );
    request.headers = { Authorization: "Bearer " + Keychain.get(keychainSlot) };
    request.timeoutInterval = 30;
    let body: MonitorResponse;
    try {
      body = (await request.loadJSON()) as MonitorResponse;
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
        origin + "/v0/resource/plugins/cpa-key-billing/auth-files",
      );
      plans.headers = request.headers;
      plans.timeoutInterval = 10;
      try {
        const details = (await plans.loadJSON()) as {
          files?: Array<{
            category?: string;
            disabled?: boolean;
            quota?: { plan?: string };
          }>;
        };
        if (plans.response?.statusCode === 200 && Array.isArray(details.files))
          attachPlans(body, details.files);
      } catch {
        /* Quota amounts remain usable when optional plan metadata is unavailable. */
      }
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
    try {
      const response = await this.loadQuota(true);
      const choices = tileChoices(response);
      this.saveCatalog(choices);
      const items = response.data.upstream?.items || [];
      alert.message =
        `发现 ${choices.length} 个额度窗口。进入小/中/大卡片排列，可选择预设或具体账号窗口。\n\n` +
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
  providerName(provider: string) {
    return (
      (
        {
          codex: "Codex",
          claude: "Claude",
          copilot: "GitHub Copilot",
          opencode: "OpenCode",
          deepseek: "DeepSeek",
          subscription: "CLIProxy-Api",
        } as Record<string, string>
      )[provider] ||
      provider ||
      "额度"
    );
  }
  planLabel(tile: Tile) {
    const plan = tile.plan;
    if (plan === "Pay-as-you-go" || plan === "按量付费") return "";
    if (!plan) return tile.provider === "opencode" ? "GO" : "套餐未知";
    return plan.toUpperCase();
  }
  layout(compact: boolean) {
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
  alignedRow(widget: ListWidget, width: number) {
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
  async addProviderIcon(parent: WidgetStack, provider: string, size = 16) {
    const base =
      "https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/";
    const urls: Record<string, string> = {
      codex: base + "codex.png",
      claude: base + "claude.png",
      copilot: base + "github.png",
      opencode: base + "opencode.png",
      deepseek: base + "deepseek.png",
    };
    if (!(provider in this.providerIcons)) {
      this.providerIcons[provider] = null;
      if (urls[provider]) {
        try {
          this.providerIcons[provider] = await this.getImageByUrl(
            urls[provider],
          );
        } catch {
          /* Same symbol fallback as DoneHub. */
        }
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
  async providerHeader(parent: WidgetStack, tile: Tile, width: number) {
    const header = parent.addStack();
    header.layoutHorizontally();
    header.centerAlignContent();
    header.size = new Size(width, 18);
    await this.addProviderIcon(header, tile.provider, 16);
    header.addSpacer(6);
    const title = header.addText(
      [this.providerName(tile.provider), this.planLabel(tile)]
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
  async renderCard(
    parent: WidgetStack,
    tile: Tile,
    width: number,
    height: number,
    compact: boolean,
  ) {
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
        ? [this.providerName(tile.provider), this.planLabel(tile)]
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
      tile.percent !== undefined && tile.percent < 20
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
            : tile.percent === undefined
              ? "余额快照"
              : "未提供重置时间",
    );
    detail.font = Font.systemFont(compact ? 8 : 9);
    detail.textColor = this.widgetColor;
    detail.textOpacity = 0.55;
    detail.lineLimit = 1;
    detail.minimumScaleFactor = 0.7;
  }
  renderQuotaBar(
    parent: WidgetStack,
    tile: Tile,
    width: number,
    barHeight: number,
  ) {
    const bar = parent.addStack();
    bar.layoutHorizontally();
    bar.size = new Size(width, barHeight);
    bar.cornerRadius = Math.floor(barHeight / 2);
    bar.backgroundColor = new Color("#DADDE3", 0.35);
    // A full bar for explicitly unlimited service; unknown balances have no fabricated percentage.
    const percent = tile.amount === "∞" ? 100 : tile.percent;
    if (percent !== undefined && percent > 0) {
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
    const content = this.alignedRow(widget, width);
    content.layoutVertically();
    try {
      const response = await this.loadQuota();
      const tile = selectTiles(response, [
        this.currentSettings.smallSettings.slot0.val || smallDefaults[0],
      ])[0];
      const header = content.addStack();
      header.centerAlignContent();
      await this.addProviderIcon(header, tile.provider, 14);
      header.addSpacer(4);
      const provider = header.addText(
        tile.provider === "copilot"
          ? "Copilot"
          : this.providerName(tile.provider),
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
      content.addSpacer(6);
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
        tile.percent !== undefined && tile.percent < 20
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
      if (tile.percent !== undefined || tile.amount === "∞") {
        content.addSpacer(6);
        this.renderQuotaBar(content, tile, width, 6);
      }
      const reset = Date.parse(tile.resetAt || "");
      if (Number.isFinite(reset)) {
        content.addSpacer(7);
        for (const line of [
          "重置 " + Utils.time("yyyy年M月d日", new Date(reset)),
          Utils.time("HH:mm", new Date(reset)),
        ]) {
          const detail = content.addText(line);
          detail.font = Font.systemFont(9);
          detail.textColor = this.widgetColor;
          detail.textOpacity = 0.55;
          detail.lineLimit = 1;
          detail.minimumScaleFactor = 0.7;
        }
      }
    } catch (error) {
      this.statusWarning = true;
      this.statusMessage = "请求失败";
      const message = content.addText(
        error instanceof Error ? error.message : "额度暂不可用",
      );
      message.font = Font.mediumSystemFont(12);
      message.textColor = Color.red();
      message.lineLimit = 4;
    }
    widget.addSpacer();
    this.renderFooter(widget, width);
    return widget;
  }
  renderFooter(widget: ListWidget, width: number) {
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
}
EndAwait(() => Runing(CPAMonitor, args.widgetParameter, false));
