// 納品構成の確認：全ページ・全画面の読込（4xx/5xx・失敗・コンソール）、描画後HTMLの検証、ID重複、
// ARIA参照・label・alt・リンク属性の整合。サブディレクトリ配信でも同じ確認をする（--base を変える）。
// 使い方: node scripts/check-delivery.mjs [--base http://localhost:3000/] [--out artifacts/qa/round3/delivery-root]
// 診断の各画面は localhost でのみ公開される window.__dx で再現する（本番では無効）。
import { chromium } from 'playwright';
import { HtmlValidate } from 'html-validate';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const base = args.base ?? 'http://localhost:3000/';
const out = join(root, args.out ?? 'artifacts/qa/round3/delivery-root');
await mkdir(join(out, 'html'), { recursive: true });

const COMPLETE = { q01: 'within3m', q02: 'partial', q03: 'partial', q04: 'partial', q05: 'partial', q06: 'partial', q07: 'partial', q08: 'partial', q09: 'equity', q10: 'partial', q11: 'partial', q12: 'partial' };
const SCREENS = [
  ['q01', { answers: {} }],
  ['q09', { answers: { ...COMPLETE } }],
  ['q05-error', { answers: { ...COMPLETE, q05: undefined }, screen: 'q05', questionError: true }],
  ['skip', { answers: { ...COMPLETE, q09: 'none' } }],
  ['abort', { answers: { q01: 'within3m' }, abortReturn: 'q01' }],
  ['result-a', { answers: { ...COMPLETE, q03: 'notyet' }, screen: 'result' }],
  ['result-b', { answers: Object.fromEntries(Object.keys(COMPLETE).map((k) => [k, k === 'q01' ? 'within3m' : k === 'q09' ? 'equity' : 'done'])), screen: 'result' }],
  ['result-c', { answers: { ...COMPLETE, q01: 'preparing' }, screen: 'result' }],
  ['email', { answers: COMPLETE }],
  ['email-error', { answers: COMPLETE, screen: 'email', errors: { email: { email: true, consent: true } } }],
  ['consult', { answers: COMPLETE }],
  ['consult-error', { answers: COMPLETE, screen: 'consult', errors: { consult: { name: true, email: true, consent: true } } }],
  ['sent', { answers: COMPLETE }],
  ['network', { answers: COMPLETE, networkKind: 'email' }],
  ['received', { answers: COMPLETE }],
];

const validator = new HtmlValidate({ extends: ['html-validate:standard'] });
const browser = await chromium.launch();
const report = { base, browser: `chromium ${browser.version()}`, checkedAt: new Date().toISOString(), pages: [] };

async function inspect(page) {
  return page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    const brokenRefs = [];
    for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls', 'for']) {
      for (const el of document.querySelectorAll(`[${attr}]`)) {
        for (const id of el.getAttribute(attr).split(/\s+/).filter(Boolean)) {
          if (!document.getElementById(id)) brokenRefs.push(`${el.tagName.toLowerCase()}[${attr}=${id}]`);
        }
      }
    }
    const imgNoAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src);
    const links = [...document.querySelectorAll('a')].map((a) => ({ text: a.innerText.trim().replace(/\s+/g, ' ').slice(0, 30), href: a.getAttribute('href'), target: a.target, rel: a.rel }));
    const noHref = links.filter((l) => !l.href);
    const blankNoRel = links.filter((l) => l.target === '_blank' && !/noopener/.test(l.rel));
    const hashOnly = links.filter((l) => l.href === '#');
    const anchorsMissing = links.filter((l) => l.href?.startsWith('#') && l.href.length > 1 && !document.getElementById(l.href.slice(1))).map((l) => l.href);
    const inputsNoLabel = [...document.querySelectorAll('input, select, textarea')].filter((i) => i.type !== 'hidden' && !i.labels?.length && !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby')).map((i) => i.name || i.id);
    const buttonsNoName = [...document.querySelectorAll('button, [role=button]')].filter((b) => !b.innerText.trim() && !b.getAttribute('aria-label')).length;
    return { title: document.title, lang: document.documentElement.lang, dupIds, brokenRefs, imgNoAlt, noHref, blankNoRel, hashOnly, anchorsMissing, inputsNoLabel, buttonsNoName, html: '<!DOCTYPE html>\n' + document.documentElement.outerHTML };
  });
}

async function check(name, url, setup) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const consoleErrors = []; const bad = []; const requests = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleErrors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('requestfailed', (r) => bad.push(`${r.failure()?.errorText} ${r.url()}`));
  page.on('response', (r) => { requests.push(r.url()); if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  if (setup) {
    await page.evaluate((s) => {
      const { state, go, render } = window.__dx;
      state.answers = Object.fromEntries(Object.entries(s.answers ?? {}).filter(([, v]) => v));
      state.abortReturn = s.abortReturn ?? null;
      state.networkKind = s.networkKind ?? null;
      go(s.screen);
      if (s.questionError) state.questionError = true;
      if (s.errors) Object.assign(state.errors, s.errors);
      if (s.questionError || s.errors) render({ focus: false });
    }, setup);
    await page.waitForLoadState('networkidle');
  }
  // 遅延画像も読み込ませる
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } });
  await page.waitForLoadState('networkidle');
  const info = await inspect(page);
  await context.close();
  const file = join(out, 'html', `${name}.html`);
  await writeFile(file, info.html);
  const v = await validator.validateString(info.html, file);
  const messages = v.results.flatMap((r) => r.messages.map((m) => `${m.ruleId} ${m.line}:${m.column} ${m.message}`));
  const { html, ...rest } = info;
  const row = { name, url, requests: requests.length, failed: bad, consoleErrors, htmlErrors: messages, ...rest };
  report.pages.push(row);
  // 配信設定の誤り（ディレクトリ一覧などが返る）を合格にしない：期待するページのtitleか確認
  if (!rest.title.includes('STARTUP TAX CHECK')) bad.push(`unexpected page: title「${rest.title}」`);
  const problems = bad.length +consoleErrors.length + messages.length + rest.dupIds.length + rest.brokenRefs.length + rest.imgNoAlt.length + rest.noHref.length + rest.blankNoRel.length + rest.hashOnly.length + rest.anchorsMissing.length + rest.inputsNoLabel.length + rest.buttonsNoName;
  console.log(`${problems ? 'FAIL' : 'PASS'}\t${name.padEnd(14)}\treq ${String(requests.length).padStart(3)}\tfailed ${bad.length}\tconsole ${consoleErrors.length}\thtml ${messages.length}\tdupId ${rest.dupIds.length}\trefs ${rest.brokenRefs.length}\tnoHref ${rest.noHref.length}\tanchor ${rest.anchorsMissing.length}\tlabel ${rest.inputsNoLabel.length}`);
  for (const p of [...bad, ...consoleErrors, ...messages, ...rest.dupIds, ...rest.brokenRefs, ...rest.anchorsMissing, ...rest.inputsNoLabel]) console.log(`\t- ${p}`);
  return row;
}

await check('lp', base);
for (const [name, s] of SCREENS) await check(`dx-${name}`, new URL('diagnosis/', base).href, { screen: s.screen ?? name, ...s });

await browser.close();
await writeFile(join(out, 'delivery.json'), JSON.stringify(report, null, 2));
const failed = report.pages.filter((p) => p.failed.length || p.consoleErrors.length || p.htmlErrors.length || p.dupIds.length || p.brokenRefs.length || p.anchorsMissing.length || p.inputsNoLabel.length || p.noHref.length || p.blankNoRel.length || p.hashOnly.length || p.imgNoAlt.length || p.buttonsNoName);
console.log(`\n${report.pages.length - failed.length}/${report.pages.length} PASS`);
