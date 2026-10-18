// 耐性の確認：BP前後1px・200%拡大相当・WCAG 1.4.12 文字間隔・長い入力・画像/フォント/JSの読込失敗・JS無効。
// 使い方: node scripts/check-robustness.mjs [--base http://localhost:3000/] [--out artifacts/qa/round3/robustness]
// 判定：横はみ出し（scrollWidth > clientWidth）、テキストのはみ出し（固定高の要素で scrollHeight > clientHeight）、
//       コンソールエラー。画像は目視用に保存する（自動判定だけで合格にしない）。
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const base = args.base ?? 'http://localhost:3000/';
const out = join(root, args.out ?? 'artifacts/qa/round3/robustness');
await mkdir(out, { recursive: true });
const DX = new URL('diagnosis/', base).href;
const COMPLETE = { q01: 'within3m', q02: 'partial', q03: 'notyet', q04: 'partial', q05: 'partial', q06: 'partial', q07: 'partial', q08: 'partial', q09: 'equity', q10: 'partial', q11: 'partial', q12: 'partial' };

// WCAG 1.4.12 の文字間隔（行高1.5倍・段落後2倍・字間0.12em・語間0.16em）
const TEXT_SPACING = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';

const browser = await chromium.launch();
const rows = [];

async function measure(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const clipped = [...document.body.querySelectorAll('*')].filter((e) => {
      if (!e.getClientRects().length) return false;
      const cs = getComputedStyle(e);
      if (!['visible', 'clip', 'hidden'].includes(cs.overflowY) || cs.display === 'inline') return false;
      const hasText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      return hasText && e.scrollHeight > e.clientHeight + 1 && cs.height !== 'auto' && e.clientHeight > 0;
    }).map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')} ${e.scrollHeight}>${e.clientHeight} 「${e.textContent.trim().slice(0, 14)}」`);
    return { overflowX: doc.scrollWidth - doc.clientWidth, height: doc.scrollHeight, clipped };
  });
}

async function run(name, { url = base, width = 1440, height = 900, css, screen, answers, js = true, block, fill, before } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: js, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (block) await page.route(block, (r) => r.abort());
  await page.goto(url, { waitUntil: 'networkidle' });
  if (screen) {
    await page.evaluate(({ screen, answers }) => { const { state, go } = window.__dx; state.answers = { ...answers }; go(screen); }, { screen, answers: answers ?? COMPLETE });
  }
  if (before) await before(page);
  if (css) await page.addStyleTag({ content: css });
  if (fill) for (const [sel, v] of fill) await page.locator(sel).fill(v);
  // JS無効ではページ内のタイマーが動かないため、遅延画像のスクロール読込はJS有効時のみ
  if (js) await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 20)); } scrollTo(0, 0); });
  await page.waitForTimeout(150);
  const m = await measure(page);
  await page.screenshot({ path: join(out, `${name}.png`), fullPage: true });
  await context.close();
  // ブロックした読込の失敗はコンソールエラーとして想定内（読込失敗の再現そのもの）
  const unexpected = block ? errors.filter((e) => !/Failed to load resource|net::ERR_FAILED|Failed to fetch dynamically imported module|Failed to decode/.test(e)) : errors;
  const row = { name, width, ...m, errors: unexpected };
  rows.push(row);
  const ok = m.overflowX <= 0 && !unexpected.length;
  console.log(`${ok ? (m.clipped.length ? 'CHECK' : 'PASS') : 'FAIL'}\t${name.padEnd(28)}\tw${width}\toverflowX ${m.overflowX}\tclipped ${m.clipped.length}\terrors ${unexpected.length}`);
  for (const c of m.clipped.slice(0, 8)) console.log(`\t- ${c}`);
  for (const e of unexpected) console.log(`\t! ${e}`);
  return row;
}

// 1. BP前後1px（LP：767/768・1023/1024・1199/1200・1279/1280、診断：359/360・767/768・1023/1024）
for (const w of [767, 768, 1023, 1024, 1199, 1200, 1279, 1280]) await run(`bp-lp-${w}`, { width: w });
for (const w of [359, 360, 767, 768, 1023, 1024]) await run(`bp-dx-q05-${w}`, { url: DX, width: w, screen: 'q05' });
for (const w of [359, 360]) await run(`bp-dx-consult-${w}`, { url: DX, width: w, screen: 'consult' });

// 2. 200%拡大相当（1440 / 1280 の50%＝720 / 640 CSS px）と 400%相当のリフロー（320）
for (const w of [720, 640]) { await run(`zoom200-lp-${w}`, { width: w }); await run(`zoom200-dx-result-${w}`, { url: DX, width: w, screen: 'result' }); }

// 3. WCAG 1.4.12 文字間隔
for (const [vp, w] of [['pc', 1440], ['sp', 390]]) {
  await run(`spacing-lp-${vp}`, { width: w, css: TEXT_SPACING });
  await run(`spacing-dx-q05-${vp}`, { url: DX, width: w, screen: 'q05', css: TEXT_SPACING });
  await run(`spacing-dx-result-${vp}`, { url: DX, width: w, screen: 'result', css: TEXT_SPACING });
  await run(`spacing-dx-consult-${vp}`, { url: DX, width: w, screen: 'consult', css: TEXT_SPACING });
}

// 4. 長い入力値（区切りのない英数字を含む）
const LONG = 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(6);
for (const [vp, w] of [['pc', 1440], ['sp', 320]]) {
  await run(`long-input-consult-${vp}`, { url: DX, width: w, screen: 'consult', fill: [['input[name="name"]', 'アセンド'.repeat(30)], ['input[type="email"]', `${LONG}@example.com`]] });
}

// 5. 読込失敗：画像・フォント・JS
for (const [vp, w] of [['pc', 1440], ['sp', 390]]) {
  await run(`fail-images-lp-${vp}`, { width: w, block: /\.(webp|png|jpg|svg)(\?|$)/ });
  await run(`fail-fonts-lp-${vp}`, { width: w, block: /\.woff2(\?|$)/ });
  await run(`fail-fonts-dx-${vp}`, { url: DX, width: w, block: /\.woff2(\?|$)/ });
}
await run('fail-js-lp', { block: /\/scripts\/.*\.js$/ });
await run('fail-js-dx', { url: DX, block: /\/scripts\/.*\.js$/ });
await run('nojs-lp-pc', { js: false });
await run('nojs-lp-sp', { js: false, width: 390 });
await run('nojs-dx', { url: DX, js: false });

await browser.close();
await writeFile(join(out, 'robustness.json'), JSON.stringify({ base, checkedAt: new Date().toISOString(), rows }, null, 2));
