export type QuotaWindow = {
  label: string;
  unit?: string;
  limit?: number;
  used?: number;
  remaining?: number;
  remaining_percent?: number;
  unlimited?: boolean;
  reset_at?: string;
  observed_at?: string;
};
export type QuotaPart = {
  status: string;
  credential_id?: string;
  provider?: string;
  name?: string;
  plan_name?: string;
  refresh_supported?: boolean;
  unlimited?: boolean;
  cached?: boolean;
  refresh_status?: string;
  stale?: boolean;
  fetched_at?: string;
  windows?: QuotaWindow[];
  items?: QuotaPart[];
};
export type MonitorResponse = {
  schema_version: number;
  success: boolean;
  partial?: boolean;
  data: { subscription?: QuotaPart; upstream?: QuotaPart };
};
export type Choice = { label: string; value: string };
export type Tile = {
  plan?: string;
  resetAt?: string;
  observedAt?: string;
  cached?: boolean;
  id: string;
  provider: string;
  title: string;
  account: string;
  amount: string;
  suffix: string;
  detail: string;
  percent?: number;
  warning: boolean;
  stale: boolean;
};
export const statusLabels: Record<string, string> = {
  ok: "正常",
  stale: "旧快照",
  forbidden: "未授权",
  error: "刷新失败",
  refresh_pending: "等待刷新",
  unavailable: "暂不可用",
  unsupported: "暂不支持",
};
export const mediumDefaults = [
  "codex-weekly",
  "deepseek-balance",
  "copilot-premium",
  "opencode-five",
];
export const largeDefaults = [
  "codex-weekly",
  "deepseek-balance",
  "copilot-premium",
  "copilot-completions",
  "opencode-five",
  "opencode-weekly",
];
export const presets = [
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
export function normalizeProvider(raw = "") {
  const value = raw.toLowerCase().replace(/^openai-compatible-/, "");
  if (/copilot/.test(value)) return "copilot";
  if (/opencode/.test(value)) return "opencode";
  if (/deepseek/.test(value)) return "deepseek";
  return value;
}
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const number = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 2 });
const clamp = (value: number) => Math.max(0, Math.min(100, value));
function timeLabel(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const two = (v: number) => String(v).padStart(2, "0");
  return `${two(date.getMonth() + 1)}/${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}`;
}
export function flattenQuota(
  response: MonitorResponse,
  now = Date.now(),
): Tile[] {
  const rows: Tile[] = [];
  const append = (part: QuotaPart, provider: string, identity: string) => {
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
          : undefined;
      let amount = "未知",
        suffix = "",
        percent = rawPercent === undefined ? undefined : clamp(rawPercent);
      if (window.unlimited || part.unlimited) {
        amount = "∞";
        suffix = "不限量";
        percent = undefined;
      } else if (finite(window.remaining) && unit) {
        amount =
          (unit === "CNY" ? "¥" : unit === "USD" ? "$" : "") +
          number(window.remaining);
        suffix = ["CNY", "USD"].includes(unit)
          ? unit
          : unit === "credits"
            ? "credits"
            : unit;
      } else if (percent !== undefined) {
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
        plan: part.plan_name,
        resetAt: window.reset_at,
        observedAt: window.observed_at || part.fetched_at,
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
        plan: part.plan_name,
        observedAt: part.fetched_at,
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

export function attachPlans(
  response: MonitorResponse,
  files: Array<{
    category?: string;
    disabled?: boolean;
    quota?: { plan?: string };
  }>,
) {
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
    // The legacy file list uses different IDs. Only an unambiguous single
    // readable credential can supply a plan; never guess across accounts.
    if (
      matchingItems.length === 1 &&
      matchingFiles.length === 1 &&
      matchingFiles[0].quota?.plan
    )
      item.plan_name = matchingFiles[0].quota.plan;
  }
}
export function tileChoices(response: MonitorResponse): Choice[] {
  return flattenQuota(response).map((row) => ({
    value: "window:" + row.id,
    label: `${row.provider} · ${row.title} · ${row.account}${row.suffix === "CNY" || row.suffix === "USD" ? " · " + row.suffix : ""}`,
  }));
}
export function selectTiles(
  response: MonitorResponse,
  selections: string[],
  now = Date.now(),
): Tile[] {
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
