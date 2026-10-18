// 操作・リンク・a11y・JS無効・reduced-motion の基本確認。
// 使い方: node scripts/check.mjs [--url http://localhost:3000/] [--out artifacts/qa/round1]
// 結果は <out>/check.json と、フォーカス状態のスクリーンショット <out>/states/*.png
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => {
  if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
  return acc;
}, []));
const url = args.url ?? 'http://localhost:3000/';
const out = join(root, args.out ?? 'artifacts/qa/round1');
await mkdir(join(out, 'states'), { recursive: true });

const browser = await chromium.launch();
const result = { url, browser: `chromium ${browser.version()}`, checkedAt: new Date().toISOString() };

// 1. 読込・コンソール・失敗リクエスト（PC / SP）
for (const [name, width, height] of [['pc', 1440, 900], ['sp', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => failed.push(`${r.failure()?.errorText} ${r.url()}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } });
  await page.waitForLoadState('networkidle');
  result[`load_${name}`] = { consoleErrors: errors, failedRequests: failed };

  // axe（WCAG 2.x A/AA タグ）
  // フェードアップ（D-047）の途中は半透明で、コントラストが低く測られるため、動きの終了を待ってから検査する
  await page.waitForTimeout(1500);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  result[`axe_${name}`] = {
    violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 10) })),
    incomplete: axe.incomplete.map((v) => ({ id: v.id, help: v.help, count: v.nodes.length })),
    passes: axe.passes.length,
  };
  await ctx.close();
}

// 2. リンク一覧（遷移先の状態）
{
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let page = await ctx2.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  result.links = await page.$$eval('a', (as) => as.map((a) => ({
    text: a.textContent.replace(/\s+/g, ' ').trim(),
    href: a.getAttribute('href'),
    target: a.getAttribute('target'),
    rel: a.getAttribute('rel'),
    linkId: a.dataset.linkId ?? null,
    status: a.dataset.linkStatus ?? (a.getAttribute('href')?.startsWith('#') ? 'in-page' : 'external'),
    anchorExists: a.getAttribute('href')?.startsWith('#') ? !!document.querySelector(a.getAttribute('href')) : null,
  })));

  // 3. キーボード：Tab順（先頭30件）とフォーカス表示
  const order = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      if (el.dataset.tabSeen) return { repeat: true };
      el.dataset.tabSeen = '1';
      const cs = getComputedStyle(el);
      return { tag: el.tagName, text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 30), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` };
    });
    if (!info || info.repeat) break;
    order.push(info);
  }
  result.tabOrder = order;

  // 4. FAQ：Enter / Space / クリックでの開閉と aria-expanded
  const q1 = page.locator('#faq-q-1');
  const state = async () => page.evaluate(() => ({
    expanded: document.querySelector('#faq-q-1').getAttribute('aria-expanded'),
    hidden: getComputedStyle(document.querySelector('#faq-answer-1')).visibility === 'hidden',
    open: document.querySelector('#faq-q-1').closest('.faq__item').classList.contains('is-open'),
  }));
  const faq = { initial: await state() };
  await q1.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1000); // フェードアップの終了を待つ
  await q1.focus();
  await page.screenshot({ path: join(out, 'states/faq-q1-focus.png'), clip: await q1.boundingBox().then((b) => ({ x: b.x - 16, y: b.y - 16, width: b.width + 32, height: 220 })) });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  faq.afterEnter = await state();
  await page.screenshot({ path: join(out, 'states/faq-q1-closed.png'), clip: await q1.boundingBox().then((b) => ({ x: b.x - 16, y: b.y - 16, width: b.width + 32, height: 140 })) });
  await page.keyboard.press('Space');
  await page.waitForTimeout(600);
  faq.afterSpace = await state();
  await q1.click();
  await page.waitForTimeout(600);
  faq.afterClick = await state();
  await q1.click();
  // 回答が空の項目がある場合だけ、開かないことを確認（2026-10-18 以降は全項目にダミー回答あり）
  const q2 = page.locator('.faq__button[aria-disabled="true"]').first();
  if (await q2.count()) {
    await q2.click({ force: true });
    faq.missingAnswerItem = await q2.getAttribute('aria-expanded');
  } else {
    faq.missingAnswerItem = 'なし（全項目に回答あり）';
  }
  result.faq = faq;
  await page.close();

  // 4b. 回答を入れた項目は開閉できる（D-048：HTMLの回答欄に文を入れるだけで有効になる）。配信HTMLを読込時に書き換えて確認
  {
    const p2 = await ctx2.newPage();
    await p2.route(/\/(index\.html)?$/, async (route) => {
      const res = await route.fetch();
      const html = (await res.text()).replace(/(<div class="faq__answer-inner">\s*)<!-- 回答文をここに入れる（Q2[^>]*-->/, '$1<p>テスト用の回答文</p>');
      await route.fulfill({ response: res, body: html });
    });
    await p2.goto(url, { waitUntil: 'networkidle' });
    const q2b = p2.locator('#faq-q-2');
    const before = await q2b.evaluate((b) => [b.getAttribute('aria-disabled'), b.getAttribute('aria-controls')]);
    await q2b.click();
    await p2.waitForTimeout(600);
    const after = await p2.evaluate(() => ({ expanded: document.querySelector('#faq-q-2').getAttribute('aria-expanded'), visible: getComputedStyle(document.querySelector('#faq-answer-2')).visibility, height: Math.round(document.querySelector('#faq-answer-2').getBoundingClientRect().height) }));
    result.faq.answerInserted = { disabledBefore: before[0], controls: before[1], ...after };
    await p2.close();
  }
  page = await ctx2.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // 5. CTAの状態（hover / focus）撮影
  const cta = page.locator('.site-header__cta');
  await cta.hover();
  await page.screenshot({ path: join(out, 'states/header-cta-hover.png'), clip: await cta.boundingBox().then((b) => ({ x: b.x - 8, y: b.y - 8, width: b.width + 16, height: b.height + 16 })) });
  const ext = page.locator('.why__message-link');
  await ext.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1000);
  await ext.focus();
  await page.screenshot({ path: join(out, 'states/link-focus.png'), clip: await ext.boundingBox().then((b) => ({ x: b.x - 8, y: b.y - 8, width: b.width + 16, height: b.height + 16 })) });
  await page.close();
}

// 6. reduced-motion：アニメーション・トランジションが存在しないこと
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  result.reducedMotion = await page.evaluate(() => ({
    runningAnimations: document.getAnimations().length,
    elementsWithTransition: [...document.querySelectorAll('*')].filter((e) => { const d = getComputedStyle(e).transitionDuration; return d && d.split(',').some((v) => parseFloat(v) > 0); }).length,
    elementsWithAnimation: [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).animationName !== 'none').length,
  }));
  await ctx.close();
}

// 7. JS無効：本文・FAQ Q1の回答が表示されていること
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  result.noJs = await page.evaluate(() => ({
    faqAnswerVisible: !!document.querySelector('#faq-answer-1')?.getClientRects().length,
    sectionsVisible: [...document.querySelectorAll('main > section')].every((s) => s.getBoundingClientRect().height > 0),
    h1: document.querySelector('h1')?.textContent,
  }));
  await page.screenshot({ path: join(out, 'states/no-js-pc.png'), fullPage: true });
  await ctx.close();
}

await browser.close();
await writeFile(join(out, 'check.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  load: { pc: result.load_pc, sp: result.load_sp },
  axe: { pc: result.axe_pc.violations, sp: result.axe_sp.violations },
  faq: result.faq, reducedMotion: result.reducedMotion, noJs: result.noJs,
  tabOrder: result.tabOrder.map((t) => `${t.tag}:${t.text} [${t.outline}]`),
}, null, 2));
