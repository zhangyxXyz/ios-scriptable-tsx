const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
function load(entry) {
  const result = buildSync({ entryPoints: [entry], bundle: true, write: false, format: 'cjs', platform: 'node' });
  const module = { exports: {} };
  new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports);
  return module.exports;
}
const { selectTiles, discoverChoices, layoutChoices, flattenQuota, mediumDefaults, largeDefaults } = load('src/widgets/cpa-monitor.ts');
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
  const choice = discoverChoices(data).find(row => row.label.startsWith('Copilot'));
  assert.equal(selectTiles(data, [choice.value], now)[0].amount, '1,493.4');
});
test('DeepSeek balance and Codex weekly are unique and purchased usage credits stay separate', () => {
  const data = response();
  data.data.upstream.items.push({ provider:'codex', credential_id:'1234abcd' + '0'.repeat(56), name:'codex 1234abcd', status:'ok', windows:[
    { label:'Weekly limit', remaining_percent:80, reset_at:'2099-11-26T12:00:00Z' },
    { label:'Code Review Weekly limit', remaining_percent:65 },
    { label:'Credit balance', remaining:0 },
  ] });
  const choices = discoverChoices(data);
  assert.deepEqual(choices.filter(row => row.label.startsWith('DeepSeek')).map(row => row.label), ['DeepSeek · Balance · dummy-b']);
  assert.equal(choices.filter(row => row.label === 'Codex · Weekly limit · 1234abcd').length, 1);
  assert.ok(choices.filter(row => /^codex/i.test(row.label)).every(row => row.label.endsWith(' · 1234abcd')));
  assert.ok(choices.some(row => row.label.includes('Code Review Weekly limit')));
  const [weekly, credits, balance] = selectTiles(data, ['codex-weekly', 'codex-credits', 'deepseek-balance'], now);
  assert.equal(weekly.amount, '80%');
  assert.equal(credits.amount, '0');
  assert.equal(credits.suffix, '积分');
  assert.equal(credits.percent, undefined);
  assert.equal(credits.resetAt, undefined);
  assert.equal(balance.amount, '¥0');
  const saved = 'window:' + flattenQuota(data).find(row => row.title === 'Credit balance').id;
  assert.equal(choices.find(row => row.label === 'Codex · Credit balance · 1234abcd').value, saved);
  assert.equal(selectTiles(data, [saved], now)[0].title, 'Codex · Credit balance');
  assert.ok(discoverChoices(response()).every(row => !/^codex/i.test(row.label)));
  assert.equal(layoutChoices(null, 'codex-weekly').find(row => row.value === 'codex-weekly').label, 'Codex · Weekly limit');
});
test('Gemini presets match both Antigravity sources and skip other model groups', () => {
  for (const provider of ['antigravity', 'agy']) {
    const data = response();
    const reset_at = '2099-11-26T12:00:00Z';
    data.data.upstream.items.push({ provider, credential_id: 'google-dummy', status: 'ok', windows: [
      { label: 'Gemini Models 5-hour limit', remaining_percent: 74, reset_at },
      { label: 'Gemini Models Weekly limit', remaining_percent: 0 },
      { label: 'Claude and GPT models 5-hour limit', remaining_percent: 35 },
    ] });
    const rows = selectTiles(data, ['gemini-five', 'gemini-weekly'], now);
    assert.deepEqual(rows.map(row => row.amount), ['74%', '0%']);
    assert.deepEqual(rows.map(row => row.displayProvider), ['Gemini', 'Gemini']);
    assert.equal(rows[0].resetAt, reset_at);
    assert.equal(rows[0].provider, provider);
    assert.equal(selectTiles(data, ['antigravity-claude-five'], now)[0].amount, '35%');
  }
});
test('Antigravity and OpenCode show one option per window and preserve saved window IDs', () => {
  const data = response();
  const item = (provider, credential_id, labels) => ({ provider, credential_id, status: 'ok',
    windows: labels.map((label, index) => ({ label, remaining_percent: 80 - index })),
  });
  const google = item('antigravity', 'native', ['Gemini Models 5-hour limit', 'Gemini Models Weekly limit',
    'Claude and GPT models 5-hour limit', 'Claude and GPT models Weekly limit']);
  const go = item('opencode-go', 'go-first', ['Rolling 5 hours', 'Weekly limit', 'Monthly limit']);
  data.data.upstream.items.push(google, go);
  const choices = discoverChoices(data);
  assert.deepEqual(choices.filter(row => row.label.startsWith('Antigravity')).map(row => row.label), [
    'Antigravity Gemini · 5-hour limit · native', 'Antigravity Gemini · Weekly limit · native',
    'Antigravity Claude/GPT · 5-hour limit · native', 'Antigravity Claude/GPT · Weekly limit · native',
  ]);
  assert.deepEqual(choices.filter(row => row.label.startsWith('OpenCode')).flatMap(row => row.presetIds),
    ['opencode-five', 'opencode-weekly', 'opencode-monthly']);
  assert.ok(choices.filter(row => row.label.startsWith('OpenCode')).every(row => row.label.endsWith(' · go-first')));
  const saved = 'window:' + flattenQuota(data).find(row => row.provider === 'antigravity').id;
  assert.equal(choices.find(row => row.presetIds?.includes('gemini-five')).value, saved);
  assert.equal(layoutChoices(choices, 'gemini-five').find(row => row.label.startsWith('Antigravity Gemini · 5-hour')).value, 'gemini-five');
  data.data.upstream.items.push(
    item('agy', 'cli', ['Gemini Models 5h']), item('opencode-go', 'go-second', ['Weekly limit']),
  );
  const multiple = discoverChoices(data);
  assert.equal(multiple.filter(row => row.label.startsWith('Antigravity CLI Gemini')).length, 1);
  assert.equal(multiple.filter(row => row.label.startsWith('OpenCode · Weekly limit · ')).length, 2);
  assert.ok(multiple.some(row => row.value === saved));
  assert.ok(multiple.every(row => row.value !== 'gemini-five' && row.value !== 'opencode-weekly'));
  assert.equal(selectTiles(data, ['gemini-five'], now)[0].amount, '请选择');
  assert.ok(layoutChoices(null, saved).every(row => !row.label.startsWith('Antigravity CLI')));
});
test('manual discovery lists only returned windows with a value and can represent an empty result', () => {
  const data = response();
  data.data.upstream.items[0].windows = [{ label: 'Premium interactions' }];
  data.data.upstream.items.push({ provider:'codex', credential_id:'zero', status:'ok', windows:[
    { label:'Weekly limit', remaining_percent:0 }, { label:'Credits', unlimited:true },
  ] });
  const choices = discoverChoices(data);
  assert.equal(choices.length, 3);
  assert.ok(choices.every(row => !row.label.startsWith('Copilot')));
  assert.ok(layoutChoices(null, 'copilot-premium').some(row => row.label.startsWith('Copilot')));
  const preserved = { value:'copilot-premium', label:'当前项暂无可用额度' };
  assert.deepEqual(layoutChoices(choices, 'copilot-premium').at(-1), preserved);
  assert.deepEqual(layoutChoices([], 'copilot-premium'), [preserved]);
});
test('a revoked part does not recover old items and reset never refills', () => {
  const data = response(); data.data.upstream = { status: 'forbidden' };
  assert.equal(selectTiles(data, ['copilot-premium'], now)[0].amount, '未授权');
  const reset = response(); reset.data.upstream.items[0].windows[0].reset_at = new Date(now - 1).toISOString();
  const row = selectTiles(reset, ['copilot-premium'], now)[0];
  assert.equal(row.amount, '1,493.4'); assert.equal(row.stale, true);
  assert.equal(row.resetAt, reset.data.upstream.items[0].windows[0].reset_at);
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
  assert.equal(requests, 0); assert.equal(fresh.status, ''); assert.equal(fresh.warning, false);
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


test('server cache is quiet but cached service failures stay red', async () => {
  const options = cacheOptions(); options.cache.response.data.upstream.items[0].cached = true;
  assert.equal((await loadCachedQuota(options)).warning, false);
  options.cache.response.data.upstream.items[0].refresh_status = 'error';
  options.cache.response.data.upstream.items[0].stale = true;
  const failed = await loadCachedQuota(options);
  assert.equal(failed.warning, true); assert.equal(failed.status, '请求失败/使用缓存');
  options.force = true;
  options.request = async () => { const data = response(); data.data.upstream.items.forEach(item => { item.cached = true; }); return data; };
  const freshServerCache = await loadCachedQuota(options);
  assert.equal(freshServerCache.status, ''); assert.equal(freshServerCache.warning, false);
});
