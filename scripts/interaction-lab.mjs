// 操作の応答時間のラボ計測（Event Timing API）。実ユーザーの INP ではない（参考値）。
// 使い方: node scripts/interaction-lab.mjs [--base http://localhost:3100/] [--cpu 4] [--repeat 5] [--out artifacts/qa/round3/perf/interaction-lab.json]
// 条件: Playwright Chromium、CPU 4倍低速化（Lighthouse mobile と同程度）、操作ごとに event エントリの最大 duration（入力遅延＋処理＋次の描画まで）を記録。
//       duration は 8ms 単位に丸められる（ブラウザ仕様）。
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const base = args.base ?? 'http://localhost:3100/';
const cpu = Number(args.cpu ?? 4);
const repeat = Number(args.repeat ?? 5);
const out = join(root, args.out ?? 'artifacts/qa/round3/perf/interaction-lab.json');

const browser = await chromium.launch();
const results = {};

async function setup(url, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 768 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(url, { waitUntil: 'networkidle' });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.evaluate(() => {
    window.__events = [];
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (e.interactionId) window.__events.push({ name: e.name, duration: e.duration, id: e.interactionId }); })
      .observe({ type: 'event', durationThreshold: 16, buffered: true });
  });
  return { ctx, page };
}
async function measure(page, name, action) {
  await page.evaluate(() => { window.__events = []; });
  await action();
  await page.waitForTimeout(400);
  const ev = await page.evaluate(() => window.__events);
  const max = ev.length ? Math.max(...ev.map((e) => e.duration)) : 0; // 16ms未満は記録されない（＝16ms未満）
  (results[name] ??= []).push(max);
}

for (const [vp, width] of [['pc', 1440], ['sp', 390]]) {
  // LP：FAQの開閉
  {
    const { ctx, page } = await setup(base, width);
    const btn = page.locator('.faq button').first();
    await btn.scrollIntoViewIfNeeded();
    for (let i = 0; i < repeat; i++) await measure(page, `${vp} LP FAQ開閉（クリック）`, () => btn.click());
    await ctx.close();
  }
  // 診断：回答の選択 → 次へ（画面描画）、戻る
  {
    const { ctx, page } = await setup(new URL('diagnosis/', base).href, width);
    for (let i = 0; i < repeat; i++) {
      await page.evaluate(() => { window.__dx.state.answers = {}; window.__dx.go('q01'); });
      await measure(page, `${vp} 診断 回答を選択`, () => page.locator('.dx-answer').nth(1).click());
      await measure(page, `${vp} 診断 次へ（次の設問を描画）`, () => page.locator('[data-action="next"]').click());
      await measure(page, `${vp} 診断 戻る`, () => page.locator('[data-action="back"]').first().click());
    }
    // 結果画面の描画（Q12で次へ）とフォームの空送信（エラー表示）
    for (let i = 0; i < repeat; i++) {
      await page.evaluate(() => { const A = { q01: 'within3m', q02: 'partial', q03: 'notyet', q04: 'partial', q05: 'partial', q06: 'partial', q07: 'partial', q08: 'partial', q09: 'equity', q10: 'partial', q11: 'partial', q12: 'partial' }; window.__dx.state.answers = A; window.__dx.go('q12'); });
      await measure(page, `${vp} 診断 Q12で次へ（結果を描画）`, () => page.locator('[data-action="next"]').click());
      await page.evaluate(() => window.__dx.go('email'));
      await measure(page, `${vp} 診断 フォーム空送信（エラー表示）`, () => page.locator('form button[type="submit"], [data-action="send"]').first().click());
    }
    await ctx.close();
  }
}
await browser.close();

const summary = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { max: Math.max(...v), median: [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)], samples: v }]));
for (const [k, v] of Object.entries(summary)) console.log(`${k.padEnd(34)}\tmax ${v.max}ms\tmedian ${v.median}ms\t[${v.samples.join(', ')}]`);
await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify({ base, cpuThrottling: cpu, repeat, note: 'ラボ参考値（Event Timing）。実ユーザーINPではない。0 は16ms未満で記録対象外', measuredAt: new Date().toISOString(), summary }, null, 2));
