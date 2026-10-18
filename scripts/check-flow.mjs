// 診断フローの動作確認（分岐・未回答・戻る・履歴・フォーム・送信状態・キーボード・axe）。
// 使い方: node scripts/check-flow.mjs [--base http://localhost:3000/] [--out artifacts/qa/round1/flow]
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
const base = args.base ?? 'http://localhost:3000/';
const out = join(root, args.out ?? 'artifacts/qa/round1/flow');
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const results = [];
const errors = [];

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}\t${name}${detail ? `\t${detail}` : ''}`);
}

async function newPage(width = 1440, height = 1024, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  return { ctx, page };
}

const screen = (page) => page.evaluate(() => document.body.dataset.screen);
const text = (page, sel) => page.locator(sel).first().innerText();
async function answer(page, label) {
  await page.locator('.dx-answer', { hasText: label }).first().click();
  await page.locator('[data-action="next"]').click();
}

// 1. LPのCTAから診断・相談へ
{
  const { ctx, page } = await newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('.hero__cta').click();
  await page.waitForURL(/diagnosis\/#q01$/);
  record('LP「無料診断を始める」→ Q01', (await screen(page)) === 'q01');
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('.cta__consult').click();
  await page.waitForURL(/diagnosis\/#consult$/);
  record('LP「30分無料相談を希望する」→ 相談フォーム', (await screen(page)) === 'consult');
  record('直接の相談フォームでは「診断結果に戻る」を出さない', (await page.locator('[data-action="to-result"]:visible').count()) === 0);
  await ctx.close();
}

// 2. 未回答エラー
{
  const { ctx, page } = await newPage();
  await page.goto(`${base}diagnosis/`, { waitUntil: 'networkidle' });
  await page.locator('[data-action="next"]').click();
  const focusedId = await page.evaluate(() => document.activeElement?.id);
  const invalid = await page.locator('.dx-answer__input[aria-invalid="true"]').count();
  const described = await page.locator('.dx-answers').getAttribute('aria-describedby');
  record('未回答で「次へ」→ エラー要約へフォーカス', focusedId === 'dx-error', `focus=${focusedId}`);
  record('エラー時：回答群と要約を関連付け', invalid === 4 && described === 'dx-error');
  await page.screenshot({ path: join(out, 'state-unanswered-focus.png') });
  await ctx.close();
}

// 3. 通常ルート（全問「できている」、Q09=出資）→ 結果B
{
  const { ctx, page } = await newPage();
  await page.goto(`${base}diagnosis/`, { waitUntil: 'networkidle' });
  await answer(page, '設立1年以上');
  for (let i = 0; i < 7; i++) await answer(page, 'できている');
  record('Q09表示時のSTEP表記', (await text(page, '.dx-step')).includes('最大12問'), await text(page, '.dx-step'));
  await answer(page, '出資を検討');
  record('出資 → Q10', (await screen(page)) === 'q10');
  await answer(page, 'できている');
  record('出資 → Q11を表示', (await screen(page)) === 'q11');
  await answer(page, 'できている');
  await answer(page, 'できている');
  record('全問できている → 結果B', (await page.locator('[data-result]').getAttribute('data-result')) === 'B');
  const unconfirmed = await page.locator('[data-unconfirmed]').count();
  record('結果B：準備できていることに未確定文言を含む（B-006の可視化）', unconfirmed > 0, `未確定 ${unconfirmed}件`);
  await page.screenshot({ path: join(out, 'state-result-b-all-done.png'), fullPage: true });

  // 履歴：ブラウザの戻る → Q12
  await page.goBack();
  record('ブラウザの戻る → 直前の設問（Q12）', (await screen(page)) === 'q12');
  // 回答を見直す
  await page.goForward();
  await page.locator('[data-action="review"]').click();
  const kept = await page.locator('.dx-answer__input:checked').count();
  record('「回答を見直す」→ Q01（回答は保持）', (await screen(page)) === 'q01' && kept === 1);
  await ctx.close();
}

// 4. 予定なし → 案内画面 → Q12（全10問）、戻って変更で再評価
{
  const { ctx, page } = await newPage();
  await page.goto(`${base}diagnosis/`, { waitUntil: 'networkidle' });
  await answer(page, '設立3か月以内');
  for (let i = 0; i < 7; i++) await answer(page, i === 6 ? 'わからない' : 'できている');
  await answer(page, '予定なし');
  record('予定なし → スキップ案内', (await screen(page)) === 'skip');
  await page.locator('[data-action="to-q12"]').click();
  record('「最後の質問へ」→ Q12、表記「全10問」', (await screen(page)) === 'q12' && (await text(page, '.dx-step')).includes('全10問'), await text(page, '.dx-step'));
  await page.locator('[data-action="back"]').click();
  record('Q12で「戻る」→ スキップ案内', (await screen(page)) === 'skip');
  await page.locator('[data-action="to-q09"]').click();
  await answer(page, '融資を検討');
  record('融資 → Q10', (await screen(page)) === 'q10' && (await text(page, '.dx-step')).includes('全11問'), await text(page, '.dx-step'));
  await answer(page, 'できている');
  record('融資 → Q11をスキップしてQ12', (await screen(page)) === 'q12');
  await answer(page, 'できている');
  const type = await page.locator('[data-result]').getAttribute('data-result');
  const titles = await page.locator('.dx-priority__title').allInnerTexts();
  record('確認事項あり → 結果A（Q08「わからない」を優先確認に）', type === 'A' && titles.some((t) => t.includes('消費税・インボイス')), titles.join(' / '));
  const answers = await page.evaluate(() => window.__dx.state.answers);
  record('対象外の回答は保持しても判定に使わない（Q11未回答で結果表示）', !answers.q11);
  await ctx.close();
}

// 5. 設立準備中 → Q02の文言変更・結果C
{
  const { ctx, page } = await newPage();
  await page.goto(`${base}diagnosis/`, { waitUntil: 'networkidle' });
  await answer(page, '設立準備中');
  record('設立準備中 → Q02の文言が「提出予定と期限」', (await text(page, '.dx-title')).includes('提出予定と期限'));
  for (let i = 0; i < 7; i++) await answer(page, 'まだできていない');
  await answer(page, '未定');
  record('未定 → Q10', (await screen(page)) === 'q10');
  await answer(page, 'まだできていない');
  record('未定 → Q11を表示', (await screen(page)) === 'q11');
  await answer(page, '該当なし：出資・変更予定なし');
  await answer(page, 'まだできていない');
  record('設立準備中 → 結果C', (await page.locator('[data-result]').getAttribute('data-result')) === 'C');
  await ctx.close();
}

// 6. 中断 → 回答に戻る / 診断を終了する
{
  const { ctx, page } = await newPage();
  await page.goto(`${base}diagnosis/`, { waitUntil: 'networkidle' });
  await answer(page, '設立1年以上');
  await page.locator('.dx-card [data-action="abort"]').click();
  record('「診断を中断する」→ 中断確認、ヘッダー「回答に戻る」', (await screen(page)) === 'abort' && (await text(page, '#dx-header-action')).includes('回答に戻る'));
  await page.locator('.dx-card [data-action="resume"]').click();
  record('「回答に戻る」→ 元の設問（Q02）', (await screen(page)) === 'q02');
  await page.locator('#dx-header-action').click();
  await page.locator('a', { hasText: '診断を終了する' }).click();
  await page.waitForURL(base);
  record('「診断を終了する」→ LP', page.url() === base);
  await ctx.close();
}

// 7. キーボード操作（矢印キーで選択、Enterで次へ）
{
  const { ctx, page } = await newPage();
  await page.goto(`${base}diagnosis/`, { waitUntil: 'networkidle' });
  // 回答群に着くまで Tab（ヘッダーのロゴのリンク・ボタンの後。D-062 でロゴがリンクに）
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement?.classList.contains('dx-answer__input'))) break;
  }
  await page.keyboard.press('ArrowDown');
  const checked = await page.locator('.dx-answer__input:checked').getAttribute('value');
  const focusRing = await page.locator('.dx-answer:has(input:focus-visible)').evaluate((el) => getComputedStyle(el).borderTopWidth);
  await page.screenshot({ path: join(out, 'state-answer-focus.png'), clip: { x: 320, y: 400, width: 800, height: 320 } });
  record('矢印キーで回答を選択（自動で進まない）', !!checked && (await screen(page)) === 'q01', `checked=${checked}`);
  record('回答のフォーカス表示（3px）', focusRing === '3px', focusRing);
  await page.keyboard.press('Tab'); // 戻る
  await page.keyboard.press('Tab'); // 次へ
  await page.keyboard.press('Enter');
  record('Enterで「次へ」→ Q02', (await screen(page)) === 'q02');
  await ctx.close();
}

// 8. メール受取フォーム：検証 → 送信（未接続）→ 通信エラー、mockで成功
{
  const { ctx, page } = await newPage();
  await page.goto(`${base}diagnosis/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const { state, go } = window.__dx;
    state.answers = { q01: 'over1y', q02: 'done', q03: 'done', q04: 'done', q05: 'done', q06: 'done', q07: 'done', q08: 'done', q09: 'equity', q10: 'done', q11: 'done', q12: 'done' };
    go('result');
  });
  await page.locator('[data-action="to-email"]').click();
  await page.locator('button[type="submit"]').click();
  record('空送信 → エラー要約・メール欄エラー・同意エラー', (await page.locator('#dx-error').count()) === 1 && (await page.locator('#dx-email[aria-invalid="true"]').count()) === 1 && (await page.locator('.dx-check.is-error').count()) === 1);
  record('エラー要約へフォーカス', (await page.evaluate(() => document.activeElement?.id)) === 'dx-error');
  await page.fill('#dx-email', 'name@example.com');
  await page.locator('input[name="consent"]').check();
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.body.dataset.screen === 'network');
  record('送信先未接続 → 通信エラー画面（成功を装わない）', true);
  await page.locator('[data-action="retry"]').click();
  await page.waitForFunction(() => document.body.dataset.screen === 'network');
  record('「再送信する」→ 再度送信（未接続のため通信エラー）', true);
  await page.goBack();
  await page.goBack();
  record('戻る → 入力内容が残っている', (await page.inputValue('#dx-email').catch(() => '')) === 'name@example.com');
  await ctx.close();

  const m = await newPage();
  await m.page.goto(`${base}diagnosis/?mock=success`, { waitUntil: 'networkidle' });
  await m.page.evaluate(() => { const { state, go } = window.__dx; state.answers = { q01: 'over1y', q02: 'done', q03: 'done', q04: 'done', q05: 'done', q06: 'done', q07: 'done', q08: 'done', q09: 'none', q12: 'done' }; go('email'); });
  await m.page.fill('#dx-email', 'name@example.com');
  await m.page.locator('input[name="consent"]').check();
  await m.page.locator('button[type="submit"]').click();
  const busy = await m.page.locator('button[type="submit"][aria-busy="true"]').count();
  const busyLabel = await m.page.locator('button[type="submit"]').innerText().catch(() => '');
  record('送信中：ボタン「送信しています…」・二重送信防止', busy === 1 && busyLabel.includes('送信しています'), busyLabel);
  await m.page.waitForFunction(() => document.body.dataset.screen === 'sent');
  record('mock成功 → 送信完了画面', true);
  await m.ctx.close();
}

// 9. 30分相談（診断なし）：検証 → mock成功 → 受付
{
  const { ctx, page } = await newPage(390, 844);
  await page.goto(`${base}diagnosis/?mock=success#consult`, { waitUntil: 'networkidle' });
  await page.locator('button[type="submit"]').click();
  record('相談：空送信 → お名前・メール・同意エラー', (await page.locator('.dx-field.is-error').count()) === 2 && (await page.locator('.dx-check.is-error').count()) === 1);
  await page.fill('#dx-name', '山田 太郎');
  await page.fill('#dx-consult-email', 'name@example.com');
  await page.locator('input[name="consent"]').check();
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.body.dataset.screen === 'received');
  record('相談：mock成功 → 相談希望受付', true);
  await ctx.close();
}

// 10. axe（PC / SP、主要画面）
const axeRows = [];
for (const [vp, w, h] of [['pc', 1440, 1024], ['sp', 390, 844]]) {
  for (const scr of ['q01', 'skip', 'abort', 'result', 'email', 'consult', 'network', 'sent', 'received']) {
    const { ctx, page } = await newPage(w, h);
    await page.goto(`${base}diagnosis/`, { waitUntil: 'networkidle' });
    await page.evaluate((scr) => {
      const { state, go } = window.__dx;
      state.answers = { q01: 'within3m', q02: 'partial', q03: 'done', q04: 'done', q05: 'done', q06: 'done', q07: 'done', q08: 'partial', q09: 'none', q12: 'done' };
      state.abortReturn = 'q01';
      state.networkKind = 'email';
      go(scr);
    }, scr);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    axeRows.push({ vp, screen: scr, violations: axe.violations.map((v) => `${v.id}(${v.nodes.length})`) });
    await ctx.close();
  }
}
const axeViolations = axeRows.filter((r) => r.violations.length);
record('axe（PC/SP × 9画面）違反なし', axeViolations.length === 0, axeViolations.map((r) => `${r.vp}/${r.screen}: ${r.violations.join(',')}`).join(' ; '));

// 11. reduced-motion：アニメーション・トランジションなし
{
  const { ctx, page } = await newPage(1440, 1024, { reducedMotion: 'reduce' });
  await page.goto(`${base}diagnosis/`, { waitUntil: 'networkidle' });
  const n = await page.evaluate(() => document.getAnimations().length + [...document.querySelectorAll('*')].filter((e) => parseFloat(getComputedStyle(e).transitionDuration) > 0).length);
  record('reduced-motion：動きなし', n === 0);
  await ctx.close();
}

record('コンソールエラー・4xx/5xx なし', errors.length === 0, errors.slice(0, 5).join(' | '));
await browser.close();
await writeFile(join(out, 'check-flow.json'), JSON.stringify({ checkedAt: new Date().toISOString(), results, axe: axeRows, errors }, null, 2));
process.exitCode = results.every((r) => r.pass) ? 0 : 1;
