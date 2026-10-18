// 診断フローの状態管理・画面遷移。回答はこのページのメモリ上だけに保持（中断・離脱で失われる：64:5241 の文言どおり）。
import { QUESTION_BY_ID } from './questions.js';
import {
  visibleQuestionIds, totalQuestions, nextQuestionId, previousQuestionId,
  needsSkipNotice, isPreFounding, isComplete, evaluate,
} from './logic.js';
import {
  questionView, skipView, abortView, resultView, emailView, consultView, sentView, receivedView, networkView,
} from './views.js';
import { submitForm } from './submit.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const state = {
  screen: 'q01',
  answers: {},
  questionError: false,
  abortReturn: null,
  forms: {
    email: { email: '', consent: false, newsletter: false },
    consult: { name: '', company: '', email: '', message: '', consent: false, newsletter: false },
  },
  errors: { email: {}, consult: {} },
  sending: false,
  networkKind: null,
  sampleResult: null, // 比較撮影でFigmaの結果例を再現するためだけに使う（localhostの __dx 経由のみ）
};

// ヘッダー右のボタン（PCのみ表示。SP参照にはない）。文言は画面ごとのFigma値
const HEADER_ACTION = {
  question: { label: '診断を中断する', action: 'abort' },
  skip: { label: '診断を中断する', action: 'abort' },
  abort: { label: '回答に戻る', action: 'resume' },
  result: { label: '診断をやり直す', action: 'restart' },
  form: { label: '診断結果に戻る', action: 'to-result' },
};

const main = document.querySelector('#dx-main');
const headerAction = document.querySelector('#dx-header-action');

const isQuestion = (screen) => /^q\d\d$/.test(screen);
const hasResult = () => isComplete(state.answers);

function screenKind(screen) {
  if (isQuestion(screen)) return 'question';
  if (['email', 'consult', 'sent', 'received', 'network'].includes(screen)) return 'form';
  return screen;
}

// 表示できない画面（直接URLや履歴で到達した場合）は、最初の未回答の設問へ寄せる
function resolve(screen) {
  const ids = visibleQuestionIds(state.answers);
  const firstOpen = ids.find((id) => !state.answers[id]) ?? 'q01';
  if (isQuestion(screen)) {
    if (!ids.includes(screen)) return firstOpen;
    const prior = ids.slice(0, ids.indexOf(screen));
    return prior.every((id) => state.answers[id]) ? screen : firstOpen;
  }
  if (screen === 'skip') return state.answers.q09 === 'none' ? 'skip' : firstOpen;
  if (screen === 'abort') return state.abortReturn ? 'abort' : firstOpen;
  if (['result', 'email', 'sent'].includes(screen)) return hasResult() ? screen : firstOpen;
  if (screen === 'network') return state.networkKind ? 'network' : firstOpen;
  if (['consult', 'received'].includes(screen)) return screen;
  return firstOpen;
}

function render({ focus = true } = {}) {
  const { screen } = state;
  let html = '';
  if (isQuestion(screen)) {
    html = questionView({
      id: screen,
      answers: state.answers,
      total: totalQuestions(state.answers),
      error: state.questionError,
      preFounding: isPreFounding(state.answers),
    });
  } else if (screen === 'skip') html = skipView();
  else if (screen === 'abort') html = abortView();
  else if (screen === 'result') html = resultView(state.sampleResult ?? evaluate(state.answers));
  else if (screen === 'email') html = emailView({ values: state.forms.email, errors: state.errors.email, sending: state.sending, hasResult: hasResult() });
  else if (screen === 'consult') html = consultView({ values: state.forms.consult, errors: state.errors.consult, sending: state.sending, hasResult: hasResult() });
  else if (screen === 'sent') html = sentView({ hasResult: hasResult() });
  else if (screen === 'received') html = receivedView({ hasResult: hasResult() });
  else if (screen === 'network') html = networkView({ kind: state.networkKind, hasResult: hasResult() });

  main.innerHTML = html;
  const kind = screenKind(screen);
  document.body.dataset.surface = kind === 'form' ? 'paper' : 'canvas';
  document.body.dataset.screen = screen;

  const header = HEADER_ACTION[kind];
  const showHeader = header && !(kind === 'form' && !hasResult());
  headerAction.hidden = !showHeader;
  if (showHeader) {
    headerAction.dataset.action = header.action;
    headerAction.querySelector('.c-cta__label').textContent = header.label;
  }

  if (focus) {
    const target = main.querySelector('#dx-error') ?? main.querySelector('#dx-title');
    window.scrollTo(0, 0);
    target?.focus({ preventScroll: true });
  }
}

function go(screen, { replace = false } = {}) {
  state.screen = resolve(screen);
  state.questionError = false;
  state.sending = false;
  const method = replace ? 'replaceState' : 'pushState';
  history[method]({ screen: state.screen }, '', `#${state.screen}`);
  render();
}

function restart() {
  state.answers = {};
  state.abortReturn = null;
  go('q01');
}

function nextFromQuestion() {
  const id = state.screen;
  if (!state.answers[id]) {
    state.questionError = true;
    render();
    return;
  }
  if (needsSkipNotice(id, state.answers)) return go('skip');
  const next = nextQuestionId(id, state.answers);
  go(next ?? 'result');
}

function backFromQuestion() {
  const id = state.screen;
  if (id === 'q12' && state.answers.q09 === 'none') return go('skip');
  const prev = previousQuestionId(id, state.answers);
  go(prev ?? 'q01');
}

function validate(kind) {
  const values = state.forms[kind];
  const errors = {};
  if (kind === 'consult' && !values.name.trim()) errors.name = true;
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = true;
  if (!values.consent) errors.consent = true;
  return errors;
}

async function send(kind) {
  state.errors[kind] = validate(kind);
  if (Object.keys(state.errors[kind]).length) {
    render();
    return;
  }
  if (state.sending) return; // 二重送信防止
  state.sending = true;
  render({ focus: false });
  main.querySelector('button[type="submit"]')?.focus();
  const payload = {
    form: kind,
    ...state.forms[kind],
    // ロボット対策：人には見えない入力欄（人が使えば必ず空。D-064）
    website: main.querySelector('input[name="website"]')?.value ?? '',
    result: hasResult() ? { answers: state.answers, ...evaluate(state.answers) } : null,
  };
  try {
    await submitForm(kind, payload);
    state.networkKind = null;
    go(kind === 'email' ? 'sent' : 'received');
  } catch {
    state.networkKind = kind;
    go('network');
  }
}

const ACTIONS = {
  next: nextFromQuestion,
  back: backFromQuestion,
  abort: () => { state.abortReturn = state.screen; go('abort'); },
  resume: () => go(state.abortReturn ?? 'q01'),
  restart,
  review: () => go('q01'),
  'to-q12': () => go('q12'),
  'to-q09': () => go('q09'),
  'to-result': () => go('result'),
  'to-consult': () => go('consult'),
  'to-email': () => go('email'),
  retry: () => { const kind = state.networkKind; state.screen = kind; send(kind); },
};

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (!fn) return;
  event.preventDefault();
  fn();
});

main.addEventListener('change', (event) => {
  const input = event.target;
  if (input.name === 'answer' && isQuestion(state.screen)) {
    state.answers[state.screen] = input.value;
    // 回答を戻って変更した場合、対象外になった設問の回答は判定から除外される（logic.js の visibleQuestionIds）
    return;
  }
  const form = input.closest('[data-form]');
  if (form && input.type === 'checkbox') state.forms[form.dataset.form][input.name] = input.checked;
});

main.addEventListener('input', (event) => {
  const input = event.target;
  const form = input.closest('[data-form]');
  if (form && input.type !== 'checkbox') state.forms[form.dataset.form][input.name] = input.value;
});

main.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-form]');
  if (!form) return;
  event.preventDefault();
  send(form.dataset.form);
});

window.addEventListener('popstate', (event) => {
  state.screen = resolve(event.state?.screen ?? 'q01');
  state.questionError = false;
  state.sending = false;
  render();
});

// ローカル確認専用：?demo=<画面名> で、回答の例を入れた状態の各画面を直接開く（2026-10-18 ご依頼：全画面をブラウザで確認するため）。
// localhost / 127.0.0.1 以外では無効（本番では使えない）。回答の例は比較撮影（scripts/shoot-flow.mjs）と同じ「2番目の回答」
const DEMO_ANSWERED = { q01: 'within3m', q02: 'partial', q03: 'partial', q04: 'partial', q05: 'partial', q06: 'partial', q07: 'partial', q08: 'partial' };
const DEMO_COMPLETE = { ...DEMO_ANSWERED, q09: 'equity', q10: 'partial', q11: 'partial', q12: 'partial' };
const DEMO_ALL_DONE = Object.fromEntries(Object.keys(DEMO_COMPLETE).map((id) => [id, { q01: 'within3m', q09: 'equity' }[id] ?? 'done']));
const DEMOS = {
  ...Object.fromEntries(Object.keys(DEMO_COMPLETE).map((id) => [id, { answers: DEMO_COMPLETE, screen: id }])),
  'q02-pre': { answers: { q01: 'preparing', q02: 'partial' }, screen: 'q02' },
  skip: { answers: { ...DEMO_ANSWERED, q09: 'none' }, screen: 'skip' },
  unanswered: { answers: { ...DEMO_COMPLETE, q05: undefined }, screen: 'q05', questionError: true },
  abort: { answers: { q01: 'within3m' }, screen: 'abort', abortReturn: 'q01' },
  'result-a': { answers: { ...DEMO_ALL_DONE, q02: 'partial', q08: 'partial' }, screen: 'result' }, // Figmaの例と同じ「2つ」
  'result-b': { answers: DEMO_ALL_DONE, screen: 'result' },
  'result-c': { answers: { ...DEMO_ALL_DONE, q01: 'preparing' }, screen: 'result' },
  email: { answers: DEMO_COMPLETE, screen: 'email' },
  'input-error': { answers: DEMO_COMPLETE, screen: 'email', email: { email: 'name@example', consent: false }, errors: { email: { email: true, consent: true } } },
  sending: { answers: DEMO_COMPLETE, screen: 'email', sending: true },
  sent: { answers: DEMO_COMPLETE, screen: 'sent' },
  network: { answers: DEMO_COMPLETE, screen: 'network', networkKind: 'email' },
  consult: { answers: DEMO_COMPLETE, screen: 'consult' },
  'consult-error': { answers: DEMO_COMPLETE, screen: 'consult', errors: { consult: { name: true, email: true, consent: true } } },
  received: { answers: DEMO_COMPLETE, screen: 'received' },
};

function startDemo(name) {
  const demo = DEMOS[name];
  if (!demo) return false;
  state.answers = Object.fromEntries(Object.entries(demo.answers).filter(([, v]) => v));
  state.abortReturn = demo.abortReturn ?? null;
  state.networkKind = demo.networkKind ?? null;
  go(demo.screen, { replace: true });
  if (demo.email) Object.assign(state.forms.email, demo.email);
  if (demo.errors) Object.assign(state.errors, demo.errors);
  if (demo.questionError) state.questionError = true;
  if (demo.sending) state.sending = true;
  if (demo.email || demo.errors || demo.questionError || demo.sending) render({ focus: false });
  return true;
}

export function start() {
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const demo = isLocal ? new URLSearchParams(location.search).get('demo') : null;
  if (demo && startDemo(demo)) {
    document.documentElement.dataset.ready = 'true';
    return;
  }
  const requested = location.hash.slice(1);
  // LPの「30分無料相談を希望する」（診断を受けずに相談）は #consult で直接開く
  state.screen = requested === 'consult' ? 'consult' : 'q01';
  history.replaceState({ screen: state.screen }, '', `#${state.screen}`);
  render({ focus: false });
  document.documentElement.dataset.ready = 'true';
}

// テスト・比較撮影用に状態の一部を公開（ローカル確認のみで使用）
if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
  window.__dx = { state, go, render, QUESTION_BY_ID };
}
