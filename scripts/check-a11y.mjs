// a11yの手動確認を補助する記録：lang・title・ランドマーク・見出し階層・読み上げ順（アクセシビリティツリー）・
// リンク/ボタン名・Tab / Shift+Tab の往復・画面切替時のフォーカス・操作対象サイズ（WCAG 2.5.8）。
// 使い方: node scripts/check-a11y.mjs [--base http://localhost:3000/] [--out artifacts/qa/round3/a11y]
// 出力の見出し・ツリー・Tab順は人が読んで妥当性を判断する（自動合否は構造上の誤りのみ）。
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
const out = join(root, args.out ?? 'artifacts/qa/round3/a11y');
await mkdir(out, { recursive: true });
const DX = new URL('diagnosis/', base).href;
const COMPLETE = { q01: 'within3m', q02: 'partial', q03: 'notyet', q04: 'partial', q05: 'partial', q06: 'partial', q07: 'partial', q08: 'partial', q09: 'equity', q10: 'partial', q11: 'partial', q12: 'partial' };

const browser = await chromium.launch();
const report = { base, checkedAt: new Date().toISOString(), pages: {}, focus: [], findings: [] };
const finding = (ok, name, detail = '') => { report.findings.push({ ok, name, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}\t${name}${detail ? `\t${detail}` : ''}`); };

async function structure(page) {
  return page.evaluate(() => {
    const name = (el) => {
      const lb = el.getAttribute('aria-labelledby');
      if (lb) return lb.split(/\s+/).map((id) => document.getElementById(id)?.innerText ?? '').join(' ').trim();
      return (el.getAttribute('aria-label') ?? el.innerText ?? el.getAttribute('alt') ?? '').trim().replace(/\s+/g, ' ');
    };
    const visible = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map((h) => ({ level: +h.tagName[1], text: h.innerText.trim().replace(/\s+/g, ' ') }));
    let skip = null;
    headings.forEach((h, i) => { if (i && h.level > headings[i - 1].level + 1) skip ??= `${headings[i - 1].level}→${h.level}「${h.text}」`; });
    const landmarks = [...document.querySelectorAll('header, nav, main, footer, aside, section[aria-label], section[aria-labelledby], [role=region], form[aria-label], form[aria-labelledby]')]
      .filter(visible).map((e) => `${e.tagName.toLowerCase()}${e.getAttribute('role') ? `[role=${e.getAttribute('role')}]` : ''}「${name(e).slice(0, 24)}」`);
    const interactive = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')].filter(visible);
    const unnamed = interactive.filter((e) => !(name(e) || e.labels?.[0]?.innerText)).map((e) => e.outerHTML.slice(0, 80));
    // 操作対象サイズ（WCAG 2.2 2.5.8：24×24、または中心から24pxの円が他と重ならない間隔の例外）。文中のリンクは例外
    const rects = interactive.map((e) => {
      const target = e.matches('input[type=radio], input[type=checkbox]') ? (e.closest('label') ?? e) : e;
      const r = target.getBoundingClientRect();
      return { e, label: name(target).slice(0, 20) || target.tagName, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, inline: getComputedStyle(e).display === 'inline' && e.closest('p') };
    });
    const small = rects.filter((r) => (r.w < 24 || r.h < 24) && !r.inline && !(r.e.matches('input[type=radio]') && r.e.closest('label'))).filter((r) => {
      // 間隔の例外：24px径の円が他の操作対象の円と重ならなければ可
      return rects.some((o) => o !== r && Math.hypot(o.cx - r.cx, o.cy - r.cy) < 24);
    }).map((r) => `${r.label} ${Math.round(r.w)}×${Math.round(r.h)}`);
    const smallAll = rects.filter((r) => (r.w < 24 || r.h < 24) && !r.inline).map((r) => `${r.label} ${Math.round(r.w)}×${Math.round(r.h)}`);
    return { lang: document.documentElement.lang, title: document.title, headings, headingSkip: skip, h1: headings.filter((h) => h.level === 1).length, landmarks, unnamed, smallTargets: small, under24: smallAll };
  });
}

async function tabOrder(page, max = 60) {
  const forward = [];
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await page.locator('body').focus().catch(() => {});
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
    const d = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; e.dataset.a11ySeen ??= String(Math.random()); return { id: e.dataset.a11ySeen, label: `${e.tagName}:${(e.getAttribute('aria-label') ?? e.innerText ?? e.value ?? '').trim().replace(/\s+/g, ' ').slice(0, 24)}`, visibleFocus: (() => { const c = getComputedStyle(e); return c.outlineStyle !== 'none' || c.boxShadow !== 'none' || (parseFloat(c.borderTopWidth) >= 3 && c.borderTopColor === 'rgb(0, 95, 204)'); })(), inView: (() => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; })(), obscured: (() => { const h = document.querySelector('.site-header'); if (!h || h.contains(e) || getComputedStyle(h).position !== 'fixed') return false; return e.getBoundingClientRect().top < h.getBoundingClientRect().bottom - 1; })() }; });
    if (!d || forward.some((f) => f.id === d.id)) break;
    forward.push(d);
  }
  const backward = [];
  let obscuredBack = 0;
  // 最後のTabで文書外（ブラウザUI）へ出た場合に備え、最後の要素から逆順をたどる
  if (forward.length) await page.evaluate((id) => document.querySelector(`[data-a11y-seen="${id}"]`)?.focus(), forward.at(-1).id);
  for (let i = 0; i < forward.length - 1; i++) {
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(150); // 追従ヘッダーの縮小（スクロール判定は非同期）が反映されてから測る
    backward.push(await page.evaluate(() => document.activeElement?.dataset.a11ySeen));
    // 追従ヘッダーの下に隠れていないか（WCAG 2.4.11）。逆方向の移動で起きやすい
    if (await page.evaluate(() => { const e = document.activeElement; const h = document.querySelector('.site-header'); if (!e || !h || h.contains(e) || getComputedStyle(h).position !== 'fixed') return false; return e.getBoundingClientRect().top < h.getBoundingClientRect().bottom - 1; })) obscuredBack++;
  }
  const expected = forward.slice(0, -1).map((f) => f.id).reverse();
  return { forward: forward.map((f) => `${f.label}${f.visibleFocus ? '' : ' [NO FOCUS STYLE]'}${f.inView ? '' : ' [OUT OF VIEW]'}${f.obscured ? ' [UNDER HEADER]' : ''}`), reverseMatches: JSON.stringify(backward) === JSON.stringify(expected), noFocusStyle: forward.filter((f) => !f.visibleFocus).length, outOfView: forward.filter((f) => !f.inView).length, obscured: forward.filter((f) => f.obscured).length + obscuredBack };
}

async function setScreen(page, screen, extra = {}) {
  await page.evaluate(({ screen, extra, A }) => {
    const { state, go, render } = window.__dx;
    state.answers = { ...(extra.answers ?? A) };
    state.abortReturn = extra.abortReturn ?? null;
    state.networkKind = extra.networkKind ?? null;
    go(screen);
    if (extra.errors) { Object.assign(state.errors, extra.errors); render(); }
  }, { screen, extra, A: COMPLETE });
}

// LP
for (const [vp, w] of [['pc', 1440], ['sp', 390]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  const s = await structure(page);
  const t = await tabOrder(page);
  const tree = await page.locator('body').ariaSnapshot();
  await writeFile(join(out, `lp-${vp}-aria.yaml`), tree);
  report.pages[`lp-${vp}`] = { ...s, tab: t };
  finding(s.lang === 'ja' && !!s.title, `LP ${vp}: lang / title`, `${s.lang} / ${s.title}`);
  finding(s.h1 === 1 && !s.headingSkip, `LP ${vp}: 見出し階層（h1は1つ・段飛ばしなし）`, `h1=${s.h1} skip=${s.headingSkip ?? 'なし'}`);
  finding(!s.unnamed.length, `LP ${vp}: 操作要素の名前`, s.unnamed.join(' | '));
  finding(t.reverseMatches && !t.noFocusStyle && !t.outOfView && !t.obscured, `LP ${vp}: Tab ${t.forward.length}件 / Shift+Tab 逆順一致 / フォーカス表示 / ヘッダーに隠れない`, `reverse=${t.reverseMatches} noStyle=${t.noFocusStyle} outOfView=${t.outOfView} underHeader=${t.obscured}`);
  finding(!s.smallTargets.length, `LP ${vp}: 操作対象サイズ（24px・間隔例外込み）`, s.smallTargets.join(' | ') || `24px未満（間隔で例外）：${s.under24.join(' | ') || 'なし'}`);
  await ctx.close();
}

// ページ内リンク：移動先の見出しが画面内に入り、次のTabが移動先以降から始まる
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  for (const [label, id] of [['診断について', 'benefits'], ['事務所紹介', 'why'], ['FAQ', 'faq']]) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.site-header__nav a', { hasText: label }).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const r = await page.evaluate((id) => { const t = document.getElementById(id).getBoundingClientRect(); const h = document.querySelector('.site-header').getBoundingClientRect(); return { top: Math.round(t.top), headerBottom: Math.round(h.bottom), hash: location.hash }; }, id);
    await page.keyboard.press('Tab');
    const next = await page.evaluate((id) => { const e = document.activeElement; const sec = document.getElementById(id); return sec.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING || sec.contains(e); }, id);
    // 追従ヘッダーに隠れず、ヘッダーの直下（scroll-padding 16px）に出る
    finding(r.hash === `#${id}` && r.top >= r.headerBottom && r.top <= r.headerBottom + 24 && !!next, `アンカー「${label}」→ #${id}（ヘッダーに隠れない）`, `top=${r.top} header=${r.headerBottom} 次のTabは移動先以降=${!!next}`);
  }
  await ctx.close();
}

// FAQ：Enter / Space / クリック後もフォーカスがボタンに残る。Escapeを使うUI（モーダル・メニュー）は存在しない
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  const btn = page.locator('.faq button').first();
  await btn.focus();
  await page.keyboard.press('Enter');
  const a = await btn.evaluate((b) => [b.getAttribute('aria-expanded'), document.activeElement === b]);
  await page.keyboard.press(' ');
  const b = await btn.evaluate((b) => [b.getAttribute('aria-expanded'), document.activeElement === b]);
  const disabled = await page.locator('.faq button[aria-disabled="true"]').count();
  finding(a[0] === 'false' && a[1] && b[0] === 'true' && b[1], 'FAQ：Enter / Space で開閉・フォーカス維持', `Enter→${a[0]} Space→${b[0]}`);
  finding(true, 'FAQ：回答のないQ2〜Q5', `aria-disabled=${disabled}件（読み上げで「無効」と伝わる。B-002）`);
  const dialogs = await page.locator('dialog, [role=dialog], [aria-modal]').count();
  finding(dialogs === 0, 'モーダル・ドロップダウンの有無（Escape・フォーカストラップの対象）', `dialog=${dialogs}（対象なし）`);
  await ctx.close();
}

// SPメニュー（D-056）：開閉・最初の項目へフォーカス・Tab の巡回・Escape で閉じてボタンへ戻る・背面の inert とスクロール停止・
// 項目を選ぶと閉じて移動先がヘッダーの下に出る。PC幅ではボタンを表示しない
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  const toggle = page.locator('.sp-menu-toggle');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  const opened = await page.evaluate(() => ({
    expanded: document.querySelector('.sp-menu-toggle').getAttribute('aria-expanded'),
    label: document.querySelector('.sp-menu-toggle__label').textContent,
    visible: getComputedStyle(document.getElementById('sp-menu')).visibility,
    focus: document.activeElement?.textContent.trim(),
    inert: document.querySelector('main').inert && document.querySelector('.site-footer').inert,
    scrollLocked: getComputedStyle(document.documentElement).overflow === 'hidden',
    items: [...document.querySelectorAll('#sp-menu a')].map((a) => `${a.textContent.trim().replace(/\s+/g, ' ')}→${a.getAttribute('href')}`),
  }));
  finding(opened.expanded === 'true' && opened.visible === 'visible' && opened.focus === '診断について' && opened.inert && opened.scrollLocked, 'SPメニュー：開く（フォーカス・背面inert・スクロール停止）', JSON.stringify(opened));
  // Tab で一巡して開閉ボタンへ戻る
  const order = [];
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement?.className || document.activeElement?.tagName)); }
  finding(order.filter((c) => c.includes('sp-menu-toggle')).length >= 1 && order.every((c) => /sp-menu|c-cta/.test(c) || c === 'A'), 'SPメニュー：Tab はメニューと開閉ボタンだけを巡回', order.join(' > '));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const closed = await page.evaluate(() => ({ expanded: document.querySelector('.sp-menu-toggle').getAttribute('aria-expanded'), focusToggle: document.activeElement === document.querySelector('.sp-menu-toggle'), inert: document.querySelector('main').inert, hidden: document.getElementById('sp-menu').hidden }));
  finding(closed.expanded === 'false' && closed.focusToggle && !closed.inert && closed.hidden, 'SPメニュー：Escape で閉じてボタンへフォーカスが戻る', JSON.stringify(closed));
  // 項目を選ぶ
  await toggle.click();
  await page.locator('#sp-menu a', { hasText: 'FAQ' }).click();
  await page.waitForTimeout(300);
  const nav = await page.evaluate(() => ({ hash: location.hash, expanded: document.querySelector('.sp-menu-toggle').getAttribute('aria-expanded'), top: Math.round(document.getElementById('faq').getBoundingClientRect().top), header: Math.round(document.querySelector('.site-header').getBoundingClientRect().bottom) }));
  finding(nav.hash === '#faq' && nav.expanded === 'false' && nav.top >= nav.header, 'SPメニュー：項目を選ぶと閉じ、移動先がヘッダーの下に出る', JSON.stringify(nav));
  const axe = await new (await import('@axe-core/playwright')).default({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze().catch(() => null);
  await toggle.click();
  await page.waitForTimeout(100);
  const axeOpen = await new (await import('@axe-core/playwright')).default({ page }).include('#sp-menu').include('.site-header').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  finding(!axeOpen.violations.length, 'SPメニュー：開いた状態の axe', axeOpen.violations.map((v) => `${v.id}(${v.nodes.length})`).join(' ') || '違反0');
  await ctx.close();
  const pc = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pcPage = await pc.newPage();
  await pcPage.goto(base, { waitUntil: 'networkidle' });
  finding(!(await pcPage.locator('.sp-menu-toggle').isVisible()), 'SPメニュー：PC幅では開閉ボタンを表示しない');
  await pc.close();
}

// 診断：画面ごとの構造・Tab往復・画面切替後のフォーカス先
const DX_SCREENS = [
  ['q01', {}], ['q05', {}], ['skip', { answers: { ...COMPLETE, q09: 'none' } }], ['abort', { abortReturn: 'q01' }],
  ['result', {}], ['email', {}], ['consult', {}], ['sent', {}], ['network', { networkKind: 'email' }], ['received', {}],
];
for (const [vp, w] of [['pc', 1440], ['sp', 390]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(DX, { waitUntil: 'networkidle' });
  for (const [screen, extra] of DX_SCREENS) {
    await setScreen(page, screen, extra);
    const focus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
    const s = await structure(page);
    const t = await tabOrder(page, 40);
    report.pages[`dx-${screen}-${vp}`] = { ...s, focusAfterRender: focus, tab: t };
    const ok = s.h1 === 1 && !s.headingSkip && !s.unnamed.length && t.reverseMatches && !t.noFocusStyle && !s.smallTargets.length && focus === 'dx-title';
    finding(ok, `診断 ${screen} ${vp}`, `focus=${focus} h1=${s.h1} skip=${s.headingSkip ?? 'なし'} unnamed=${s.unnamed.length} tab=${t.forward.length} reverse=${t.reverseMatches} small=${s.smallTargets.join('|') || 'なし'}`);
    if (vp === 'pc') await writeFile(join(out, `dx-${screen}-aria.yaml`), await page.locator('body').ariaSnapshot());
  }
  // エラー時：要約へフォーカス、入力に aria-invalid と説明の関連付け
  await setScreen(page, 'email', { errors: { email: { email: true, consent: true } } });
  const err = await page.evaluate(() => ({ focus: document.activeElement?.id, role: document.getElementById('dx-error')?.getAttribute('role'), invalid: [...document.querySelectorAll('[aria-invalid=true]')].map((e) => `${e.name}→${e.getAttribute('aria-describedby')}`) }));
  finding(err.focus === 'dx-error' && err.invalid.length === 2, `診断 フォームエラー ${vp}：要約へフォーカス・aria-invalid`, JSON.stringify(err));
  await ctx.close();
}

await browser.close();
await writeFile(join(out, 'a11y.json'), JSON.stringify(report, null, 2));
const failed = report.findings.filter((f) => !f.ok).length;
console.log(`\n${report.findings.length - failed}/${report.findings.length} PASS`);
