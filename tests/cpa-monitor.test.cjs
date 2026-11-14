const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
function load(entry) {
  const result = buildSync({ entryPoints: [entry], bundle: true, write: false, format: 'cjs', platform: 'node' });
  const module = { exports: {} };
  new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports);
  return module.exports;
}
const { selectTiles, tileChoices, mediumDefaults, largeDefaults } = load('src/widgets/cpa-monitor.ts');
const now = Date.parse('2026-11-15T04:00:00Z');
function response(age = 0) {
  return { success: true, schema_version: 1, data: { upstream: { status: 'ok', items: [
    { provider: 'copilot', credential_id: 'dummy-a', status: 'ok', fetched_at: new Date(now - age).toISOString(), windows: [
      { label: 'Premium interactions', remaining: 1493.4, limit: 1500, unit: 'credits' },
      { label: 'Completions', unlimited: true },
    ] },
    { provider: 'deepseek', credential_id: 'dummy-b', status: 'ok', fetched_at: new Date(now - age).toISOString(), windows: [{ label: 'Balance', unit: 'CNY', remaining: 0 }] },
  ] } } };
}
test('layout defaults have exactly four and six ordered metrics', () => {
  assert.equal(mediumDefaults.length, 4); assert.equal(largeDefaults.length, 6);
  assert.equal(mediumDefaults[0], 'codex-weekly');
});
test('credits preserve fractions, zero balance and unlimited are distinct', () => {
  const rows = selectTiles(response(), ['copilot-premium', 'copilot-completions', 'deepseek-balance'], now);
  assert.equal(rows[0].amount, '1,493.4'); assert.equal(rows[1].amount, '∞');
  assert.equal(rows[1].percent, undefined); assert.equal(rows[2].amount, '¥0');
});
test('multiple accounts require an explicit window rather than summing', () => {
  const data = response(); const item = structuredClone(data.data.upstream.items[0]);
  item.credential_id = 'dummy-c'; data.data.upstream.items.push(item);
  assert.equal(selectTiles(data, ['copilot-premium'], now)[0].amount, '请选择');
  const choice = tileChoices(data)[0];
  assert.equal(selectTiles(data, [choice.value], now)[0].amount, '1,493.4');
});
test('a revoked part does not recover old items and reset never refills', () => {
  const data = response(); data.data.upstream = { status: 'forbidden' };
  assert.equal(selectTiles(data, ['copilot-premium'], now)[0].amount, '未授权');
  const reset = response(); reset.data.upstream.items[0].windows[0].reset_at = new Date(now - 1).toISOString();
  const row = selectTiles(reset, ['copilot-premium'], now)[0];
  assert.equal(row.amount, '1,493.4'); assert.equal(row.stale, true);
});

const { loadCachedQuota, QuotaRequestError } = load('src/widgets/cpa-cache.ts');
const { attachPlans } = load('src/widgets/cpa-monitor.ts');
function cacheOptions(age = 0) {
  return { scope: 'dummy-scope', now, cache: { scope: 'dummy-scope', response: response(), fetchedAt: now - age },
    request: async () => response(), save: () => {}, clear: () => {} };
}
test('fresh cache skips requests; exactly five minutes refreshes', async () => {
  let requests = 0; const options = cacheOptions(299999);
  options.request = async () => { requests++; return response(); };
  const fresh = await loadCachedQuota(options);
  assert.equal(requests, 0); assert.equal(fresh.status, '使用缓存'); assert.equal(fresh.warning, true);
  options.now++;
  assert.equal((await loadCachedQuota(options)).status, '在线'); assert.equal(requests, 1);
});
test('failed refresh preserves arbitrarily old cache and its timestamp', async () => {
  const options = cacheOptions(86400000);
  options.request = async () => { throw new Error('offline'); };
  options.save = () => assert.fail('must not refresh cache timestamp');
  const cached = await loadCachedQuota(options);
  assert.equal(cached.fetchedAt, now - 86400000); assert.equal(cached.status, '请求失败/使用缓存');
});
test('changed scope cannot fall back and permission failures clear cache', async () => {
  let cleared = 0; const options = cacheOptions(300000);
  options.clear = () => { cleared++; }; options.scope = 'another-key';
  options.request = async () => { throw new Error('offline'); };
  await assert.rejects(loadCachedQuota(options), /offline/); assert.equal(cleared, 1);
  options.scope = 'dummy-scope'; options.request = async () => { throw new QuotaRequestError('revoked', true); };
  await assert.rejects(loadCachedQuota(options), /revoked/); assert.equal(cleared, 2);
});
test('forced discovery refreshes and replaces revoked parts without merging old data', async () => {
  const options = cacheOptions(); options.force = true;
  options.request = async () => ({ success: true, schema_version: 1, partial: true, data: { upstream: { status: 'forbidden' } } });
  let saved; options.save = (value) => { saved = value; };
  const result = await loadCachedQuota(options);
  assert.equal(result.status, '部分查询失败'); assert.equal(saved.response.data.upstream.items, undefined);
});
test('plan enrichment requires one refreshable account and never invents plans', () => {
  const data = response(); data.data.upstream.items.forEach(item => { item.refresh_supported = true; });
  attachPlans(data, [{ category: 'copilot', quota: { plan: 'individual' } }, { category: 'deepseek', quota: {} }]);
  assert.equal(data.data.upstream.items[0].plan_name, 'individual'); assert.equal(data.data.upstream.items[1].plan_name, undefined);
  const ambiguous = response(); ambiguous.data.upstream.items[0].refresh_supported = true;
  attachPlans(ambiguous, [{ category: 'copilot', quota: { plan: 'a' } }, { category: 'copilot', quota: { plan: 'b' } }]);
  assert.equal(ambiguous.data.upstream.items[0].plan_name, undefined);
});
