// 画面ごとのHTML。文言はFigmaのコピーのみ。"\n" はSPのみの改行。
import { STEPS, QUESTION_BY_ID } from './questions.js';
import { RESULT_COPY, PRIORITY_COPY, READY_COPY, READY_COPY_PRE_FOUNDING, UNCONFIRMED } from './content.js';

const ASSET = '../assets';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const t = (s) => esc(s).replace(/\n/g, '<br class="u-sp">');

// STC v3 / Brand CTA（Primary / Secondary）。高さ56はフロー内のインスタンス値
function cta({ label, tone = 'primary', action, type = 'button', loading = false, extra = '' }) {
  const icon = tone === 'primary' ? 'arrow-capsule-brand.svg' : 'arrow-capsule-white.svg';
  const capsule = loading ? '' : `<span class="c-cta__capsule" aria-hidden="true"><img src="${ASSET}/icons/${icon}" width="16" height="16" alt=""></span>`;
  const attrs = loading ? ' disabled aria-busy="true"' : '';
  return `<button class="c-cta c-cta--${tone} dx-btn" type="${type}"${action ? ` data-action="${action}"` : ''}${attrs}${extra}><span class="c-cta__label">${esc(label)}</span>${capsule}</button>`;
}

const chip = (label, tone) => `<p class="dx-chip dx-chip--${tone}">${esc(label)}</p>`;
const title = (text, extra = '') => `<h1 class="dx-title" id="dx-title" tabindex="-1"${extra}>${t(text)}</h1>`;

function stepLabel(step, total) {
  return `STEP 0${step} / 04　・　${total ? `全${total}問` : '最大12問'}`;
}

function progress(step) {
  return `<div class="dx-progress" aria-hidden="true">${[1, 2, 3, 4].map((n) => `<span${n <= step ? ' class="is-done"' : ''}></span>`).join('')}</div>`;
}

export function questionView({ id, answers, total, error, preFounding }) {
  const q = QUESTION_BY_ID[id];
  const stepName = STEPS[q.step - 1].label;
  const qTitle = preFounding && q.titlePreFounding ? q.titlePreFounding : q.title;
  const describedBy = error ? 'dx-error' : 'dx-help';
  const options = q.options.map((o) => `
      <label class="dx-answer">
        <input class="dx-answer__input" type="radio" name="answer" value="${esc(o.value)}"${answers[id] === o.value ? ' checked' : ''}${error ? ' aria-invalid="true"' : ''}>
        <span class="dx-answer__mark" aria-hidden="true"></span>
        <span class="dx-answer__label">${esc(o.label)}</span>
      </label>`).join('');

  const head = error
    ? `<p class="dx-eyebrow dx-eyebrow--small">Q${q.no} / ${esc(stepName)}</p>`
    : `<p class="dx-step">${stepLabel(q.step, total)}</p>${progress(q.step)}<p class="dx-category">${esc(stepName)}</p><p class="dx-qid">Q${q.no}</p>`;

  const errorSummary = error
    ? `<div class="dx-error-summary" id="dx-error" tabindex="-1" role="alert"><p class="dx-error-summary__title">! 回答を1つ選んでください</p><p>迷う場合は「わからない」を選べます。</p></div>`
    : '';

  const back = id === 'q01'
    ? `<a class="c-cta c-cta--secondary dx-back" href="../"><span class="c-cta__label">戻る</span></a>`
    : `<button class="c-cta c-cta--secondary dx-back" type="button" data-action="back"><span class="c-cta__label">戻る</span></button>`;

  const actions = error
    ? cta({ label: '次へ', action: 'next', extra: ' data-wide' })
    : `<div class="dx-actions">${back}${cta({ label: '次へ', action: 'next' })}</div>`;

  return `
    <div class="dx-card" data-screen="question" data-question="${id}"${error ? ' data-error' : ''}>
      ${head}
      ${title(qTitle)}
      ${errorSummary}
      ${error ? '' : `<p class="dx-help" id="dx-help">${esc(q.help)}</p>`}
      <fieldset class="dx-answers" aria-labelledby="dx-title" aria-describedby="${describedBy}">${options}
      </fieldset>
      ${error ? '' : '<p class="dx-note">選択しても自動で進みません。</p>'}
      ${actions}
      ${error ? '' : '<button class="dx-text-link" type="button" data-action="abort">診断を中断する</button>'}
    </div>`;
}

export function skipView() {
  return `
    <div class="dx-card" data-screen="skip">
      ${chip('回答に合わせて質問を調整', 'tint')}
      ${title('資金調達の質問は、\n今回はスキップします。')}
      <p class="dx-lead">「予定なし」を選んだため、必要資金額と出資に関する2問を対象外にしました。評価は下がりません。</p>
      <p class="dx-small">${t('次は、相談体制について伺います。\n全10問で完了するルートです。')}</p>
      ${cta({ label: '最後の質問へ', action: 'to-q12' })}
      ${cta({ label: '資金調達の回答を変更', tone: 'secondary', action: 'to-q09' })}
    </div>`;
}

export function abortView() {
  return `
    <div class="dx-card" data-screen="abort">
      ${title('診断を中断しますか？')}
      <p class="dx-lead">この画面を閉じると、入力中の回答は失われます。続ける場合は「回答に戻る」を選んでください。</p>
      ${cta({ label: '回答に戻る', action: 'resume' })}
      <a class="c-cta c-cta--secondary dx-btn" href="../"><span class="c-cta__label">診断を終了する</span><span class="c-cta__capsule" aria-hidden="true"><img src="${ASSET}/icons/arrow-capsule-white.svg" width="16" height="16" alt=""></span></a>
    </div>`;
}

function priorityItems(ids) {
  return ids.map((id, i) => {
    const no = QUESTION_BY_ID[id].no;
    const copy = PRIORITY_COPY[id];
    const unconfirmed = !copy;
    return `
        <li class="dx-priority${unconfirmed ? ' is-unconfirmed' : ''}"${unconfirmed ? ' data-unconfirmed' : ''}>
          <p class="dx-priority__label">優先確認 ${String(i + 1).padStart(2, '0')}</p>
          <h2 class="dx-priority__title">${esc(copy ? copy.title : UNCONFIRMED.priorityTitle(no))}</h2>
          <p class="dx-priority__body">${esc(copy ? copy.body : UNCONFIRMED.priorityBody)}</p>
        </li>`;
  }).join('');
}

function readyBlock(ids, type) {
  if (!ids.length) return '';
  const items = ids.map((id) => {
    const label = (type === 'C' && READY_COPY_PRE_FOUNDING[id]) || READY_COPY[id];
    return label
      ? `<li>${esc(label)}</li>`
      : `<li class="is-unconfirmed" data-unconfirmed>${esc(UNCONFIRMED.ready(QUESTION_BY_ID[id].no))}</li>`;
  }).join('');
  return `
      <section class="dx-ready" aria-labelledby="dx-ready-title">
        <h2 class="dx-ready__title" id="dx-ready-title">✓ 準備できていること</h2>
        <ul class="dx-ready__list">${items}</ul>
      </section>`;
}

export function resultView({ type, checks, ready }) {
  const copy = RESULT_COPY[type];
  const body = type === 'A'
    ? `<ol class="dx-priorities">${priorityItems(checks)}</ol>`
    : `<div class="dx-next dx-next--${copy.next.tone}"><h2 class="dx-next__title">${esc(copy.next.title)}</h2><p>${esc(copy.next.body)}</p></div>`;
  return `
    <div class="dx-card" data-screen="result" data-result="${type}">
      <p class="dx-eyebrow dx-eyebrow--result">YOUR CHECK RESULT</p>
      ${chip(copy.chip, copy.chipTone)}
      ${title(copy.heading(checks.length))}
      <p class="dx-small">${t('回答をもとに、確認事項を整理しました。\n個別の税務判断や法令違反の判定ではありません。')}</p>
      ${body}
      ${readyBlock(ready, type)}
      <p class="dx-small">${t('対象外の項目は評価に含めていません。\n「わからない」は確認したい事項として整理します。')}</p>
      <hr class="dx-divider">
      <h2 class="dx-heading">${t('結果をもとに、\n税理士と次の一歩を。')}</h2>
      <p class="dx-lead dx-lead--muted">${t('30分無料相談で、気になる項目と\n確認の進め方を整理できます。')}</p>
      ${cta({ label: '税理士に30分無料相談する', action: 'to-consult' })}
      <p class="dx-small">30分無料・ご希望の方のみ</p>
      ${cta({ label: '結果をメールで受け取る', tone: 'secondary', action: 'to-email' })}
      <button class="dx-text-link dx-text-link--brand" type="button" data-action="review">回答を見直す</button>
    </div>`;
}

function field({ id, name, label, type = 'text', autocomplete, placeholder, hint, value, error, errorText }) {
  return `
      <div class="dx-field${error ? ' is-error' : ''}">
        <label class="dx-field__label" for="${id}">${esc(label)}</label>
        <input class="dx-field__input" id="${id}" name="${name}" type="${type}"${autocomplete ? ` autocomplete="${autocomplete}"` : ''} placeholder="${esc(placeholder)}" value="${esc(value)}" aria-describedby="${id}-hint"${error ? ' aria-invalid="true"' : ''}>
        <p class="dx-field__hint" id="${id}-hint">${esc(error && errorText ? errorText : hint)}</p>
      </div>`;
}

function consentBlock({ values, errors }) {
  return `
      <label class="dx-check dx-check--required${errors.consent ? ' is-error' : ''}">
        <input type="checkbox" name="consent"${values.consent ? ' checked' : ''}${errors.consent ? ' aria-invalid="true" aria-describedby="dx-error"' : ''}>
        <span>個人情報の取り扱いに同意する　必須</span>
      </label>
      <a class="dx-policy-link" href="https://ascend-tax.jp/privacypolicy/" target="_blank" rel="noopener">プライバシーポリシーを確認する ↗<span class="u-visually-hidden">（新しいタブで開きます）</span></a>
      <label class="dx-check">
        <input type="checkbox" name="newsletter"${values.newsletter ? ' checked' : ''}>
        <span>税務・会計のお役立ち情報を受け取る　任意</span>
      </label>
      <p class="dx-small">${t('継続案内は希望する方だけにお届けします。\n同意しなくても、結果の受取・相談は利用できます。')}</p>`;
}

function errorSummary(errors, { formatText }) {
  if (!Object.keys(errors).length) return '';
  // 2行目はFigma（64:5975）の文言。メール形式・同意の誤りがある場合のみ表示する
  const second = errors.email || errors.consent ? `<p>${esc(formatText)}</p>` : '';
  return `<div class="dx-error-summary dx-error-summary--form" id="dx-error" tabindex="-1" role="alert"><p class="dx-error-summary__title">! 入力内容をご確認ください</p>${second}</div>`;
}

const RETURN_RESULT = (hasResult) => (hasResult ? cta({ label: '診断結果に戻る', tone: 'secondary', action: 'to-result' }) : '');
const FORMAT_TEXT = 'メールアドレスの形式と、個人情報の取り扱いへの同意を確認してください。';
const EMAIL_ERROR = '! name@example.com の形式で入力してください。';

export function emailView({ values, errors, sending, hasResult }) {
  return `
    <div class="dx-card" data-screen="email">
      <p class="dx-eyebrow dx-eyebrow--small">診断結果のメール受取</p>
      ${title('結果をメールで\n受け取れます。')}
      <p class="dx-lead dx-lead--muted">${t('診断結果を手元に残したい方へ。\n入力は任意です。')}</p>
      ${errorSummary(errors, { formatText: FORMAT_TEXT })}
      <form class="dx-form" data-form="email" novalidate>
        ${field({ id: 'dx-email', name: 'email', label: 'メールアドレス　必須', type: 'email', autocomplete: 'email', placeholder: '例：name@example.com', hint: '結果の送付・ご相談への返信に使用します。', value: values.email, error: errors.email, errorText: EMAIL_ERROR })}
        <!-- ロボット対策（D-064）：人には見えず、Tab でも入らない入力欄。値が入っていたら送信しない -->
      <div class="u-visually-hidden" aria-hidden="true"><label>空欄のままにしてください<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        ${consentBlock({ values, errors })}
        ${cta({ label: sending ? '送信しています…' : '診断結果を受け取る', type: 'submit', loading: sending })}
        ${RETURN_RESULT(hasResult)}
      </form>
    </div>`;
}

export function consultView({ values, errors, sending, hasResult }) {
  return `
    <div class="dx-card" data-screen="consult">
      <p class="dx-eyebrow dx-eyebrow--small">30分無料相談</p>
      ${title('相談したいことを、\n聞かせてください。')}
      <p class="dx-lead dx-lead--muted">${t('ご希望を送信後、日程を調整します。\nこの送信で予約は確定しません。')}</p>
      ${errorSummary(errors, { formatText: FORMAT_TEXT })}
      <form class="dx-form" data-form="consult" novalidate>
        ${field({ id: 'dx-name', name: 'name', label: 'お名前　必須', autocomplete: 'name', placeholder: '例：山田 太郎', hint: 'ご相談時のお呼び名を入力してください。', value: values.name, error: errors.name })}
        ${field({ id: 'dx-company', name: 'company', label: '会社名　任意', autocomplete: 'organization', placeholder: '例：株式会社〇〇', hint: '設立前の方は空欄で構いません。', value: values.company })}
        ${field({ id: 'dx-consult-email', name: 'email', label: 'メールアドレス　必須', type: 'email', autocomplete: 'email', placeholder: '例：name@example.com', hint: '結果の送付・ご相談への返信に使用します。', value: values.email, error: errors.email, errorText: EMAIL_ERROR })}
        ${field({ id: 'dx-message', name: 'message', label: '相談したいこと　任意', placeholder: '例：設立後の届出について', hint: '診断結果をもとに整理することもできます。', value: values.message })}
        <!-- ロボット対策（D-064）：人には見えず、Tab でも入らない入力欄。値が入っていたら送信しない -->
      <div class="u-visually-hidden" aria-hidden="true"><label>空欄のままにしてください<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        ${consentBlock({ values, errors })}
        ${cta({ label: sending ? '送信しています…' : '相談希望を送信する', type: 'submit', loading: sending })}
        ${RETURN_RESULT(hasResult)}
      </form>
    </div>`;
}

export function sentView({ hasResult }) {
  return `
    <div class="dx-card" data-screen="sent">
      <p class="dx-eyebrow dx-eyebrow--small">診断結果のメール受取</p>
      ${chip('✓ 送信完了', 'success')}
      ${title('診断結果を\nお送りしました。')}
      <p class="dx-lead">入力したメールアドレスをご確認ください。見つからない場合は、迷惑メールフォルダもご確認ください。</p>
      ${RETURN_RESULT(hasResult)}
    </div>`;
}

export function receivedView({ hasResult }) {
  return `
    <div class="dx-card" data-screen="received">
      ${chip('✓ 相談希望を受け付けました', 'success-wide')}
      ${title('ご相談に向けて、\n日程を調整します。')}
      <p class="dx-lead">${t('ご入力のメールアドレス宛に、日程調整のご案内をお送りします。\nこの時点では予約は確定していません。')}</p>
      ${RETURN_RESULT(hasResult)}
    </div>`;
}

export function networkView({ kind, hasResult }) {
  const eyebrow = kind === 'consult' ? '30分無料相談' : '診断結果のメール受取';
  return `
    <div class="dx-card" data-screen="network">
      <p class="dx-eyebrow dx-eyebrow--small">${eyebrow}</p>
      ${title('送信できませんでした。')}
      <p class="dx-lead dx-lead--muted">通信環境を確認して、もう一度お試しください。入力内容はこの画面に残っています。</p>
      ${cta({ label: '再送信する', action: 'retry' })}
      ${RETURN_RESULT(hasResult)}
    </div>`;
}
