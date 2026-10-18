// 表示性能のラボ計測（Lighthouse）。実ユーザーデータ（CrUX / RUM）ではない。
// 使い方: node scripts/perf.mjs [--base http://localhost:3000/] [--runs 3] [--throttling simulate|devtools] [--out artifacts/qa/round3/perf]
// 条件: Lighthouse 既定の mobile（Moto G Power相当・4倍CPU低速化・Slow 4G 相当の擬似スロットリング）と desktop プリセット。
//       Chromium は Playwright 同梱版。キャッシュなし（各回新規プロファイル）。中央値を採用する。
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const base = args.base ?? 'http://localhost:3000/';
const runs = Number(args.runs ?? 3);
// simulate（既定・Lanternの推定）/ devtools（実際に回線とCPUを絞って計測）
const throttling = args.throttling ?? 'simulate';
const out = join(root, args.out ?? 'artifacts/qa/round3/perf');
await mkdir(out, { recursive: true });
const CHROME_PATH = chromium.executablePath();

const targets = [['lp', base], ['diagnosis', new URL('diagnosis/', base).href]];
const presets = ['mobile', 'desktop'];

function lighthouse(url, preset, file) {
  const flags = [url, '--quiet', '--output=json', `--output-path=${file}`, '--only-categories=performance', '--chrome-flags=--headless=new --no-sandbox'];
  if (preset === 'desktop') flags.push('--preset=desktop');
  flags.push(`--throttling-method=${throttling}`);
  return new Promise((resolve, reject) => {
    const p = spawn(join(root, 'node_modules/.bin/lighthouse'), flags, { env: { ...process.env, CHROME_PATH }, stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`lighthouse exit ${code}`))));
  });
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const summary = { tool: 'Lighthouse', chrome: CHROME_PATH, base, runs, throttling, measuredAt: new Date().toISOString(), note: 'ラボ計測（擬似スロットリング）。実ユーザーの Core Web Vitals ではない。INP はナビゲーション計測では測れない', results: {} };

for (const [name, url] of targets) {
  for (const preset of presets) {
    const rows = [];
    for (let i = 1; i <= runs; i++) {
      const file = join(out, `${name}-${preset}-${i}.json`);
      await lighthouse(url, preset, file);
      const lhr = JSON.parse(await readFile(file, 'utf8'));
      const a = lhr.audits;
      rows.push({
        score: Math.round(lhr.categories.performance.score * 100),
        fcp: a['first-contentful-paint'].numericValue,
        lcp: a['largest-contentful-paint'].numericValue,
        cls: a['cumulative-layout-shift'].numericValue,
        tbt: a['total-blocking-time'].numericValue,
        si: a['speed-index'].numericValue,
        bytes: a['total-byte-weight'].numericValue,
        requests: a['network-requests']?.details?.items?.length,
        lcpElement: a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? a['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet,
        lcpPhases: a['largest-contentful-paint-element']?.details?.items?.[1]?.items,
        renderBlocking: a['render-blocking-resources']?.details?.items?.map((x) => `${x.url.replace(base, '')} ${Math.round(x.wastedMs)}ms`),
      });
    }
    const m = { score: median(rows.map((r) => r.score)), fcp: median(rows.map((r) => r.fcp)), lcp: median(rows.map((r) => r.lcp)), cls: median(rows.map((r) => r.cls)), tbt: median(rows.map((r) => r.tbt)), bytes: median(rows.map((r) => r.bytes)) };
    summary.results[`${name}-${preset}`] = { url, median: m, runs: rows };
    console.log(`${name.padEnd(9)} ${preset.padEnd(7)} score ${m.score}\tFCP ${Math.round(m.fcp)}ms\tLCP ${Math.round(m.lcp)}ms\tCLS ${m.cls.toFixed(3)}\tTBT ${Math.round(m.tbt)}ms\t${Math.round(m.bytes / 1024)}KB\tLCP要素 ${rows[0].lcpElement?.slice(0, 70)}`);
  }
}
await writeFile(join(out, 'perf-summary.json'), JSON.stringify(summary, null, 2));
