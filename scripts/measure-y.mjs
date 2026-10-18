// Figmaのテキストノードと実装の要素の位置（y・高さ）を突き合わせ、累積ずれの発生箇所を特定する。
// 使い方: node scripts/measure-y.mjs --frame 134:5068 --width 390 [--url http://localhost:3000/] [--out artifacts/qa/round2/measure-sp.json]
// 根拠: references/figma/raw/*.metadata.xml（get_metadata）。テキストノード名＝本文（Figmaの既定）を前提に、
//       空白を除いた本文が一致する「表示中の最小の要素」を対応づける。対応できないノードは unmatched として出力する。
import { chromium } from 'playwright';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const frameId = args.frame ?? '134:5068';
const width = Number(args.width ?? 390);
const url = args.url ?? 'http://localhost:3000/';

// メタデータXMLを読み、対象フレーム基準の絶対座標でテキストノードを列挙
const rawDir = join(root, 'references/figma/raw');
let texts = null;
for (const f of (await readdir(rawDir)).filter((f) => f.endsWith('.xml'))) {
  const xml = await readFile(join(rawDir, f), 'utf8');
  if (!xml.includes(`id="${frameId}"`)) continue;
  const stack = [];
  let inside = 0;
  texts = [];
  for (const m of xml.matchAll(/<(\/?)([\w-]+)([^>]*?)(\/?)>/g)) {
    const [, close, , attrs, self] = m;
    if (close) { const n = stack.pop(); if (n?.root) inside = 0; continue; }
    const a = Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map((x) => [x[1], x[2]]));
    const parent = stack.at(-1);
    const isRoot = a.id === frameId;
    const node = { id: a.id, name: a.name, x: isRoot ? 0 : (parent?.ax ?? 0) + Number(a.x), y: isRoot ? 0 : (parent?.ay ?? 0) + Number(a.y), w: Number(a.width), h: Number(a.height), root: isRoot };
    // Figmaのグループ（メタデータ上は frame で名前が Group…）は座標系を作らない：子の座標はグループの親基準
    const isGroup = !isRoot && /^Group\b/.test(a.name ?? '');
    node.ax = isGroup ? (parent?.ax ?? 0) : node.x;
    node.ay = isGroup ? (parent?.ay ?? 0) : node.y;
    if (isRoot) inside = 1;
    if (inside && m[2] === 'text') texts.push(node);
    if (!self) stack.push(node);
  }
  break;
}
if (!texts) throw new Error(`frame ${frameId} not found in ${rawDir}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const rows = await page.evaluate((texts) => {
  const norm = (s) => s.replace(/[\s　]/g, '');
  const els = [...document.body.querySelectorAll('*')].filter((e) => e.getClientRects().length && !['SCRIPT', 'STYLE'].includes(e.tagName));
  const used = new Set();
  return texts.map((t) => {
    const key = norm(t.name ?? '');
    // 本文が一致する要素のうち最小（最も内側）を選ぶ。同文が複数ある場合はFigmaのyに近いものを選ぶ
    const cands = els.filter((e) => !used.has(e) && norm(e.innerText ?? '') === key)
      .filter((e, _, arr) => !arr.some((o) => o !== e && e.contains(o)));
    if (!key || !cands.length) return { id: t.id, name: t.name, fy: t.y, fh: t.h, unmatched: true };
    const withY = cands.map((e) => { const r = e.getBoundingClientRect(); return { e, y: r.top + scrollY, h: r.height, x: r.left }; });
    withY.sort((a, b) => Math.abs(a.y - t.y) - Math.abs(b.y - t.y));
    const best = withY[0];
    used.add(best.e);
    return { id: t.id, name: t.name, fx: t.x, fy: t.y, fh: t.h, ix: +best.x.toFixed(2), iy: +best.y.toFixed(2), ih: +best.h.toFixed(2), dy: +(best.y - t.y).toFixed(2), dh: +(best.h - t.h).toFixed(2), dx: +(best.x - t.x).toFixed(2) };
  });
}, texts);
await browser.close();

rows.sort((a, b) => a.fy - b.fy);
let prev = 0;
for (const r of rows) {
  if (r.unmatched) { console.log(`  ?? ${r.id}\ty${r.fy}\t${(r.name ?? '').slice(0, 24)}`); continue; }
  const step = +(r.dy - prev).toFixed(2);
  prev = r.dy;
  const flag = Math.abs(step) >= 1 || Math.abs(r.dx) >= 1 ? '*' : ' ';
  console.log(`${flag} ${r.id}\tfy${r.fy}\tdy${r.dy}\tstep${step}\tdx${r.dx}\tfh${r.fh}/ih${r.ih}\t${r.name.slice(0, 24)}`);
}
if (args.out) {
  await mkdir(dirname(join(root, args.out)), { recursive: true });
  await writeFile(join(root, args.out), JSON.stringify({ frameId, width, url, rows }, null, 2));
}
