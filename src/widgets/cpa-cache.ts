import type { MonitorResponse } from "./cpa-monitor";

export type QuotaCache = {
  scope: string;
  response: MonitorResponse;
  fetchedAt: number;
};
export class QuotaRequestError extends Error {
  constructor(
    message: string,
    public discardCache = false,
  ) {
    super(message);
  }
}

// DoneHub policy: five minutes fresh; retain the last successful snapshot on
// network/provider failures. Never renew its timestamp when reading it.
export async function loadCachedQuota(options: {
  scope: string;
  cache: QuotaCache | null;
  now: number;
  force?: boolean;
  request: () => Promise<MonitorResponse>;
  save: (cache: QuotaCache) => void;
  clear: () => void;
}) {
  const { scope, now } = options;
  const cache =
    options.cache?.scope === scope && options.cache.fetchedAt <= now
      ? options.cache
      : null;
  if (!cache && options.cache) options.clear();
  if (!options.force && cache && now - cache.fetchedAt < 300000)
    return { ...cache, status: "使用缓存", warning: true };
  try {
    const response = await options.request();
    const snapshot = { scope, response, fetchedAt: now };
    options.save(snapshot);
    const items = response.data.upstream?.items || [];
    const stale = items.some((item) => item.stale || item.status === "stale");
    const failed = items.some(
      (item) => item.status === "error" || item.refresh_status === "error",
    );
    const partial =
      response.partial || items.some((item) => item.status !== "ok");
    return {
      ...snapshot,
      status: stale
        ? failed
          ? "请求失败/使用缓存"
          : "使用缓存"
        : partial
          ? "部分查询失败"
          : "在线",
      warning: !!(stale || partial),
    };
  } catch (error) {
    if (error instanceof QuotaRequestError && error.discardCache) {
      options.clear();
      throw error;
    }
    if (cache) return { ...cache, status: "请求失败/使用缓存", warning: true };
    throw error;
  }
}
