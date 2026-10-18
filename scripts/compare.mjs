// Figma参照画像と実装スクリーンショットの比較（全ページ＋セクション単位）。
// 使い方: node scripts/compare.mjs [--dir artifacts/qa/round1] [--viewports pc,sp]
// 前提: scripts/shoot.mjs で <dir>/<viewport>/full.png と shoot-*.json を作成済み。
// 正規化: 参照・実装とも1x（CSS px = 画像px）。原点（各セクション上端・左端）だけを合わせ、拡大縮小や要素ごとの位置補正はしない。
// 高さが違う場合は切り捨てず、共通キャンバスの不足分を灰色（#808080）で埋めて差を可視化する。
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { comparePair, region } from './lib/visual.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const dir = join(root, args.dir ?? 'artifacts/qa/round1');
const config = JSON.parse(await readFile(join(root, 'scripts/sections.json'), 'utf8'));
const targets = (args.viewports ?? 'pc,sp').split(',');

const shots = {};
for (const f of (await readdir(dir)).filter((f) => f.startsWith('shoot-') && f.endsWith('.json'))) {
  const meta = JSON.parse(await readFile(join(dir, f), 'utf8'));
  for (const run of meta.runs) shots[run.name] = { ...run, meta };
}

const report = { generatedAt: new Date().toISOString(), normalization: '1x, origin-aligned, gray padding for height differences', viewports: {} };

for (const key of targets) {
  const vp = config.viewports[key];
  const shot = shots[key];
  if (!shot) { console.warn(`no shoot data for ${key}`); continue; }
  const refFile = join(root, vp.reference);
  const implFile = join(dir, key, 'full.png');
  const out = join(dir, key, 'compare');
  await mkdir(out, { recursive: true });
  const rows = [];

  const refFull = await sharp(refFile).png().toBuffer();
  const implFull = await sharp(implFile).png().toBuffer();
  rows.push(await comparePair('full', refFull, implFull, vp.width, join(out, 'full')));

  for (const sec of vp.sections) {
    const m = shot.sections.find((s) => s.id === sec.id);
    if (!m || m.missing) { rows.push({ name: sec.id, missing: true }); continue; }
    const refBuf = await region(refFile, sec.y, sec.h, vp.width);
    const implBuf = await region(implFile, m.y, m.h, vp.width);
    const r = await comparePair(sec.id, refBuf, implBuf, vp.width, join(out, sec.id));
    rows.push({ ...r, refY: sec.y, implY: +m.y.toFixed(1), implHExact: +m.h.toFixed(2) });
  }
  report.viewports[key] = { width: vp.width, reference: vp.reference, implementation: implFile.replace(root + '/', ''), browser: shot.meta.browser, rows };
  console.log(`\n[${key}] ${vp.width}px`);
  console.table(rows.map(({ name, refH, implH, diffPx, diffPct, mismatchPct }) => ({ name, refH, implH, diffPx, diffPct, mismatchPct })));
}

await writeFile(join(dir, 'compare-report.json'), JSON.stringify(report, null, 2));
