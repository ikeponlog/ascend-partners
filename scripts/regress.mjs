// 回帰比較：前Roundの実装画像と今回の実装画像を同条件で比べる（Figma参照との比較は compare.mjs / shoot-flow.mjs）。
// 使い方: node scripts/regress.mjs [--from artifacts/qa/round2] [--to artifacts/qa/round3] [--out artifacts/qa/round3/regress]
// 対象: <dir>/{pc,sp}/full.png、<dir>/flow/{pc,sp}/<画面>.png、<dir>/w<幅>/full.png（両方にあるもの）
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { comparePair } from './lib/visual.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const from = join(root, args.from ?? 'artifacts/qa/round2');
const to = join(root, args.to ?? 'artifacts/qa/round3');
const out = join(root, args.out ?? 'artifacts/qa/round3/regress');
await mkdir(out, { recursive: true });

const pairs = [];
for (const vp of ['pc', 'sp']) pairs.push([`${vp}-full`, join(vp, 'full.png')]);
for (const d of (await readdir(to)).filter((d) => /^w\d+$/.test(d))) pairs.push([`${d}-full`, join(d, 'full.png')]);
for (const vp of ['pc', 'sp']) {
  const dir = join(to, 'flow', vp);
  if (!existsSync(dir)) continue;
  for (const f of (await readdir(dir)).filter((f) => /^[\w-]+\.png$/.test(f) && !f.includes('-cmp-'))) pairs.push([`flow-${vp}-${f.replace('.png', '')}`, join('flow', vp, f)]);
}

const rows = [];
for (const [name, rel] of pairs) {
  const a = join(from, rel);
  const b = join(to, rel);
  if (!existsSync(a) || !existsSync(b)) continue;
  const width = (await sharp(b).metadata()).width;
  if ((await sharp(a).metadata()).width !== width) { rows.push({ name, error: 'width differs' }); continue; }
  const r = await comparePair(name, await sharp(a).png().toBuffer(), await sharp(b).png().toBuffer(), width, join(out, name));
  rows.push(r);
  console.log(`${r.diffPx === 0 && r.mismatchPct === 0 ? 'SAME ' : 'DIFF '}\t${name.padEnd(28)}\t${r.refH}→${r.implH}\tmismatch ${r.mismatchPct}%`);
}
await writeFile(join(out, 'regress.json'), JSON.stringify({ from, to, generatedAt: new Date().toISOString(), rows }, null, 2));
