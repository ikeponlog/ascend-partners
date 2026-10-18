// 画像・テクスチャ上の文字のコントラストを実測する（axeが自動判定できず incomplete になった要素が対象）。
// 使い方: node scripts/contrast.mjs [--url http://localhost:3000/] [--out artifacts/qa/round2/contrast.json]
// 方法: 文字を透明にした状態で要素の範囲を撮影し、背景の各画素と文字色のコントラスト比（WCAG 2.x）を計算する。
//       最小値（最悪の画素）と5パーセンタイル値を出す。text-shadow 等の補助効果は含めない（安全側）。
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const url = args.url ?? 'http://localhost:3000/';
const out = join(root, args.out ?? 'artifacts/qa/round2/contrast.json');

const lum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const browser = await chromium.launch();
const result = { url, browser: `chromium ${browser.version()}`, measuredAt: new Date().toISOString(), viewports: {} };

// --widths 768,1024 で任意幅も測れる（既定は参照幅の PC 1440 / SP 390）
const viewports = args.widths ? args.widths.split(',').map((w) => [`w${w}`, Number(w)]) : [['pc', 1440], ['sp', 390]];
for (const [name, width] of viewports) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
    window.scrollTo(0, 0);
    await document.fonts.ready;
  });
  const axe = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  const targets = axe.incomplete.flatMap((v) => v.nodes.map((n) => n.target[0]));
  const items = await page.evaluate((sels) => sels.map((sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { sel, text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  }), targets);
  // 文字を消した背景だけの全ページ画像
  await page.addStyleTag({ content: '*{color:transparent!important;text-shadow:none!important;-webkit-text-stroke:0!important}' });
  await page.waitForTimeout(100);
  const shot = await page.screenshot({ fullPage: true });
  const meta = await sharp(shot).metadata();
  const rows = [];
  for (const it of items) {
    const left = Math.max(0, Math.floor(it.x)); const top = Math.max(0, Math.floor(it.y));
    const w = Math.min(meta.width - left, Math.ceil(it.w)); const h = Math.min(meta.height - top, Math.ceil(it.h));
    if (w < 1 || h < 1) continue;
    const { data, info } = await sharp(shot).extract({ left, top, width: w, height: h }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const fg = it.color.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    const ratios = [];
    for (let i = 0; i < data.length; i += info.channels) ratios.push(ratio(fg, [data[i], data[i + 1], data[i + 2]]));
    ratios.sort((a, b) => a - b);
    const large = parseFloat(it.fontSize) >= 24 || (parseFloat(it.fontSize) >= 18.66 && Number(it.fontWeight) >= 700);
    const need = large ? 3 : 4.5;
    const p5 = ratios[Math.floor(ratios.length * 0.05)];
    rows.push({ ...it, large, need, min: +ratios[0].toFixed(2), p5: +p5.toFixed(2), median: +ratios[Math.floor(ratios.length / 2)].toFixed(2), pass: ratios[0] >= need ? 'PASS' : p5 >= need ? 'PASS（局所的に下回る画素あり）' : 'FAIL' });
  }
  result.viewports[name] = rows;
  console.log(`\n[${name}] incomplete ${targets.length}`);
  for (const r of rows) console.log(`${r.pass.padEnd(6)}\tmin ${r.min}\tp5 ${r.p5}\tneed ${r.need}\t${r.fontSize}/${r.fontWeight}\t${r.text}`);
  await context.close();
}
await browser.close();
await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(result, null, 2));
