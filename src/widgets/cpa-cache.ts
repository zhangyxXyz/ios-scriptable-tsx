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

function responseStatus(response: MonitorResponse, localCache = false) {
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
