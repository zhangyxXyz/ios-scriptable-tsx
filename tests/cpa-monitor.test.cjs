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
