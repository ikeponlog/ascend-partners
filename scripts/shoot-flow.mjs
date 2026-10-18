// 診断フロー（site/diagnosis/）の各画面をFigmaの状態に合わせて撮影し、参照画像と比較する。
// 使い方: node scripts/shoot-flow.mjs [--url http://localhost:3000/diagnosis/] [--out artifacts/qa/round1/flow] [--only q01,result-a]
// 状態の再現：localhost でのみ公開される window.__dx（scripts/diagnosis/app.js）で回答・画面を設定する。
// Figmaの設問フレームはいずれも2番目の回答を選択した例のため、同じ状態で撮影する。
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { comparePair } from './lib/visual.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const url = args.url ?? 'http://localhost:3000/diagnosis/';
const outDir = join(root, args.out ?? 'artifacts/qa/round1/flow');
const only = args.only?.split(',');
const REF = join(root, 'references/figma/flow');

// 2番目の回答で埋めた回答（q01 は「設立3か月以内」）
const ANSWERED = { q01: 'within3m', q02: 'partial', q03: 'partial', q04: 'partial', q05: 'partial', q06: 'partial', q07: 'partial', q08: 'partial' };

const SAMPLE_RESULT = {
  'result-a': { type: 'A', checks: ['q02', 'q08'], ready: ['q05', 'q06'] },
  'result-b': { type: 'B', checks: [], ready: ['q05', 'q06'] },
  'result-c': { type: 'C', checks: [], ready: ['q04'] },
};
const COMPLETE = { ...ANSWERED, q09: 'equity', q10: 'partial', q11: 'partial', q12: 'partial' };

// [画面ID, PC参照, SP参照, 状態設定]
const CASES = [
  ['q01', 'pc-01-q01-64-3244@1x.png', 'sp-03-q01-64-382@1x.png', { answers: { q01: 'within3m' }, screen: 'q01' }],
  ['q02', 'pc-02-q02-64-3379@1x.png', null, { answers: { q01: 'within3m', q02: 'partial' }, screen: 'q02' }],
  ['q05', 'pc-05-q05-64-3784@1x.png', 'sp-03-q05-64-894@1x.png', { answers: ANSWERED, screen: 'q05' }],
  ['q09', 'pc-09-q09-64-4334@1x.png', 'sp-03-q09-64-1400@1x.png', { answers: { ...ANSWERED, q09: 'equity' }, screen: 'q09' }],
  ['q11', 'pc-11-q11-64-4609@1x.png', null, { answers: { ...ANSWERED, q09: 'equity', q10: 'partial', q11: 'partial' }, screen: 'q11' }],
  ['q02-pre', 'pc-13-q02pre-64-4884@1x.png', 'sp-03-q02pre-64-1906@1x.png', { answers: { q01: 'preparing', q02: 'partial' }, screen: 'q02' }],
  ['skip', 'pc-14-skip-64-5019@1x.png', 'sp-04-skip-64-2030@1x.png', { answers: { ...ANSWERED, q09: 'none' }, screen: 'skip' }],
  ['unanswered', 'pc-15-unanswered-64-5125@1x.png', 'sp-04-unanswered-64-2124@1x.png', { answers: { ...ANSWERED, q05: undefined }, screen: 'q05', questionError: true }],
  ['abort', 'pc-16-abort-64-5241@1x.png', 'sp-04-abort-64-2228@1x.png', { answers: { q01: 'within3m' }, screen: 'abort', abortReturn: 'q01' }],
  ['result-a', 'pc-17-result-a-64-5344@1x.png', 'sp-05-result-a-64-2319@1x.png', { answers: COMPLETE, screen: 'result', sample: 'result-a' }],
  ['result-b', 'pc-18-result-b-64-5467@1x.png', 'sp-05-result-b-64-2430@1x.png', { answers: COMPLETE, screen: 'result', sample: 'result-b' }],
  ['result-c', 'pc-19-result-c-64-5585@1x.png', 'sp-05-result-c-64-2536@1x.png', { answers: COMPLETE, screen: 'result', sample: 'result-c' }],
  ['email', 'pc-20-email-64-5703@1x.png', 'sp-06-email-64-2642@1x.png', { answers: COMPLETE, screen: 'email' }],
  ['consult', 'pc-21-consult-64-5820@1x.png', 'sp-06-consult-64-2747@1x.png', { answers: COMPLETE, screen: 'consult' }],
  ['input-error', 'pc-22-input-error-64-5964@1x.png', 'sp-06-input-error-64-2879@1x.png', { answers: COMPLETE, screen: 'email', email: { email: 'name@example', consent: false }, errors: { email: true, consent: true } }],
  ['sending', 'pc-26-sending-67-4380@1x.png', 'sp-06-sending-67-2226@1x.png', { answers: COMPLETE, screen: 'email', sending: true }],
  ['sent', 'pc-23-sent-64-6084@1x.png', 'sp-06-sent-64-2987@1x.png', { answers: COMPLETE, screen: 'sent' }],
  ['network', 'pc-24-network-64-6179@1x.png', 'sp-06-network-64-3070@1x.png', { answers: COMPLETE, screen: 'network', networkKind: 'email' }],
  ['received', 'pc-25-consult-received-64-6283@1x.png', 'sp-06-consult-received-64-3162@1x.png', { answers: COMPLETE, screen: 'received' }],
];

const browser = await chromium.launch();
const report = { url, browser: `chromium ${browser.version()}`, dpr: 1, capturedAt: new Date().toISOString(), rows: [] };

for (const [vpName, width] of [['pc', 1440], ['sp', 390]]) {
  const dir = join(outDir, vpName);
  await mkdir(dir, { recursive: true });
  for (const [id, pcRef, spRef, setup] of CASES) {
    if (only && !only.includes(id)) continue;
    const ref = vpName === 'pc' ? pcRef : spRef;
    if (!ref) continue;
    const refFile = join(REF, ref);
    const { height } = await sharp(refFile).metadata();
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(({ setup, sample }) => {
      const { state, go, render } = window.__dx;
      state.answers = Object.fromEntries(Object.entries(setup.answers).filter(([, v]) => v));
      state.abortReturn = setup.abortReturn ?? null;
      state.networkKind = setup.networkKind ?? null;
      state.sampleResult = sample ?? null;
      go(setup.screen);
      if (setup.email) Object.assign(state.forms.email, setup.email);
      if (setup.errors) state.errors.email = setup.errors;
      if (setup.questionError) state.questionError = true;
      if (setup.sending) state.sending = true;
      if (setup.email || setup.errors || setup.questionError || setup.sending) render({ focus: false });
      document.activeElement?.blur();
    }, { setup, sample: setup.sample ? SAMPLE_RESULT[setup.sample] : null });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const implFile = join(dir, `${id}.png`);
    await page.screenshot({ path: implFile, fullPage: true });
    await context.close();
    const refBuf = await sharp(refFile).png().toBuffer();
    const implBuf = await sharp(implFile).png().toBuffer();
    const row = await comparePair(id, refBuf, implBuf, width, join(dir, `${id}-cmp`));
    report.rows.push({ viewport: vpName, ref, ...row, errors });
    console.log(`${vpName}\t${id.padEnd(12)}\tref ${row.refH}\timpl ${row.implH}\tdiff ${row.diffPx}px\tmismatch ${row.mismatchPct}%${errors.length ? `\tERR ${errors.join(' | ')}` : ''}`);
  }
}

await browser.close();
await writeFile(join(outDir, 'flow-report.json'), JSON.stringify(report, null, 2));
