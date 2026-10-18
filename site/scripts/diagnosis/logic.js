// 分岐と結果判定。根拠：Figma 58:4814「07 / v3 診断ロジック・実装引継ぎ」
// - Q01・Q09は分類のみ（加点・減点に使わない）
// - Q09：融資→Q10のみ（Q11対象外・全11問）／出資・両方→Q10・Q11（全12問）／予定なし→Q10・Q11対象外（全10問）／未定→Q10・Q11を表示
// - わからない＝確認事項、該当なし＝対象外
// - 結果：設立前はC。設立済みで確認事項がある場合はA、それ以外はB（Figma上は「案」。税理士監修で確定：B-006）
import { QUESTIONS, QUESTION_BY_ID } from './questions.js';

const CHECK_ITEMS = new Set(['partial', 'notyet', 'unknown']);

// 現在の回答で表示対象になる設問ID（Q09未回答の間はQ10・Q11も含む＝最大12問）
export function visibleQuestionIds(answers) {
  const funding = answers.q09;
  return QUESTIONS.map((q) => q.id).filter((id) => {
    if (id === 'q10') return funding !== 'none';
    if (id === 'q11') return !['none', 'loan'].includes(funding);
    return true;
  });
}

// 分岐確定後の総数（Q09回答前は null＝「最大12問」表示）
// 12問のルートはFigmaの表記「最大12問」のまま。減った場合のみ「全N問」（D-026）
export function totalQuestions(answers) {
  if (!answers.q09) return null;
  const n = visibleQuestionIds(answers).length;
  return n < 12 ? n : null;
}

export function nextQuestionId(currentId, answers) {
  const ids = visibleQuestionIds(answers);
  const i = ids.indexOf(currentId);
  return i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;
}

export function previousQuestionId(currentId, answers) {
  const ids = visibleQuestionIds(answers);
  const i = ids.indexOf(currentId);
  return i > 0 ? ids[i - 1] : null;
}

// 「予定なし」でQ10・Q11をスキップする時だけ、案内画面（64:5019 / 64:2030）を挟む
export function needsSkipNotice(currentId, answers) {
  return currentId === 'q09' && answers.q09 === 'none';
}

export function isPreFounding(answers) {
  return answers.q01 === 'preparing';
}

// 判定に使う回答（表示対象かつ採点対象の設問のみ。対象外になった回答は除外）
export function scoredAnswers(answers) {
  return visibleQuestionIds(answers)
    .map((id) => QUESTION_BY_ID[id])
    .filter((q) => q.scored && answers[q.id])
    .map((q) => ({ id: q.id, value: answers[q.id] }));
}

export function isComplete(answers) {
  return visibleQuestionIds(answers).every((id) => answers[id]);
}

export function evaluate(answers) {
  const scored = scoredAnswers(answers);
  const checks = scored.filter((a) => CHECK_ITEMS.has(a.value)).map((a) => a.id);
  const ready = scored.filter((a) => a.value === 'done').map((a) => a.id);
  let type = 'B';
  if (isPreFounding(answers)) type = 'C';
  else if (checks.length > 0) type = 'A';
  return { type, checks, ready };
}
