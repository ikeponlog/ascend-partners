// 実装の全ページ撮影とセクション寸法の取得。
// 使い方: node scripts/shoot.mjs [--url http://localhost:3000/] [--out artifacts/qa/round1] [--viewports pc,sp] [--widths 320,768,...]
// 条件: Chromium / DPR 1 / document.fonts.ready と画像decode完了後 / 遅延画像はスクロールして読込後に先頭へ戻す
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const url = args.url ?? 'http://localhost:3000/';
const outDir = join(root, args.out ?? 'artifacts/qa/round1');
const config = JSON.parse(await readFile(join(root, 'scripts/sections.json'), 'utf8'));
const targets = (args.viewports ?? 'pc,sp').split(',').filter(Boolean);
const extraWidths = (args.widths ?? '').split(',').filter(Boolean).map(Number);

const browser = await chromium.launch();
const meta = { url, browser: `chromium ${browser.version()}`, dpr: 1, capturedAt: new Date().toISOString(), runs: [] };

async function settle(page) {
  await page.evaluate(async () => {
    // 遅延読込画像を読み込ませる
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    // 非表示（display:none）の遅延画像は読み込まれないため、表示中の画像だけ待つ（各最大3秒）
    const visible = [...document.images].filter((img) => img.getClientRects().length > 0);
    await Promise.all(visible.map((img) => Promise.race([
      img.complete ? img.decode?.().catch(() => {}) : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); }),
      new Promise((r) => setTimeout(r, 3000)),
    ])));
    await document.fonts.ready;
  });
  await page.waitForTimeout(150);
}

async function shoot(name, width, height, sections) {
  // 動きのあるページ（D-047）を決定的な状態で撮るため、動きを減らす設定で撮影する（フェードアップは最初から表示・アニメーションなし）
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const consoleErrors = [];
  const failed = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.url()} ${r.status()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await settle(page);

  const dir = join(outDir, name);
  await mkdir(dir, { recursive: true });
  await page.screenshot({ path: join(dir, 'full.png'), fullPage: true });

  const layout = await page.evaluate((secs) => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    pageHeight: document.documentElement.scrollHeight,
    fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`).filter((v, i, a) => a.indexOf(v) === i),
    sections: secs.map((s) => {
      const el = document.querySelector(s.selector);
      if (!el) return { id: s.id, missing: true };
      const r = el.getBoundingClientRect();
      return { id: s.id, y: r.top + window.scrollY, h: r.height };
    }),
  }), sections ?? []);

  await context.close();
  const run = { name, width, height, ...layout, consoleErrors, failedRequests: failed };
  meta.runs.push(run);
  console.log(`${name}\t${width}px\tpage ${layout.pageHeight}px\toverflowX ${layout.scrollWidth > layout.clientWidth}\terrors ${consoleErrors.length}\tfailed ${failed.length}`);
}

for (const key of targets) {
  const vp = config.viewports[key];
  await shoot(key, vp.width, vp.height, vp.sections);
}
for (const w of extraWidths) {
  await shoot(`w${w}`, w, 900, config.viewports[w < 768 ? 'sp' : 'pc'].sections);
}

await browser.close();
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, `shoot-${targets.join('-') || 'widths'}${extraWidths.length ? '-w' : ''}.json`), JSON.stringify(meta, null, 2));
