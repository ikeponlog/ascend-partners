// 設問データ。文言はFigma（PC 63:382 / SP 58:2459 の各設問フレーム）のコピーをそのまま使用。
// 文字列中の "\n" はSPのみの改行位置（Figma SPフレームの手動改行）。PCでは改行しない。

export const STEPS = [
  { no: 1, label: '会社設立・基本手続き' },
  { no: 2, label: '日々のお金の管理' },
  { no: 3, label: '税金・資金調達' },
  { no: 4, label: '成長に向けた準備' },
];

// 回答の種類（判定に使用）。done=できている / partial=一部 / notyet=まだ / unknown=わからない（確認事項） / na=該当なし（対象外）
const STATUS = [
  { value: 'done', label: 'できている' },
  { value: 'partial', label: '一部できている' },
  { value: 'notyet', label: 'まだできていない' },
  { value: 'unknown', label: 'わからない' },
];

export const QUESTIONS = [
  {
    id: 'q01', no: '01', step: 1, scored: false,
    title: '現在の会社の状況を\n教えてください。',
    help: '今の状況に最も近いものを1つ選んでください。',
    options: [
      { value: 'preparing', label: '設立準備中' },
      { value: 'within3m', label: '設立3か月以内' },
      { value: '3to12m', label: '設立3〜12か月' },
      { value: 'over1y', label: '設立1年以上' },
    ],
  },
  {
    id: 'q02', no: '02', step: 1, scored: true,
    title: '必要な税務届出・申請の\n提出状況や期限を\n確認していますか？',
    // Q01で「設立準備中」の場合の文言（64:4884 / 64:1906）
    titlePreFounding: '設立後に必要な税務届出の\n提出予定と期限を\n確認していますか？',
    help: '法人設立届出や青色申告などが対象です。',
    options: STATUS,
  },
  {
    id: 'q03', no: '03', step: 1, scored: true,
    title: '決算月や税務申告の時期、\n担当者は決まっていますか？',
    help: 'すべてが決まっていなくても、近い回答を選べます。',
    options: STATUS,
  },
  {
    id: 'q04', no: '04', step: 2, scored: true,
    title: '会社のお金と個人のお金を\n分けて管理できていますか？',
    help: '口座や支出の記録など、日々の管理方法を確認します。',
    options: STATUS,
  },
  {
    id: 'q05', no: '05', step: 2, scored: true,
    title: '領収書や請求書を、\n決まった方法で\n保存できていますか？',
    help: '取引がまだない場合のみ「該当なし」を選べます。',
    options: [...STATUS, { value: 'na', label: '該当なし：まだ取引がない' }],
  },
  {
    id: 'q06', no: '06', step: 2, scored: true,
    title: '毎月の売上・費用・\n手元資金を把握する\n仕組みがありますか？',
    help: '会計ソフトや管理表など、確認できる仕組みが対象です。',
    options: STATUS,
  },
  {
    id: 'q07', no: '07', step: 3, scored: true,
    title: '役員報酬や給与の支払いに\n必要な税務手続きを\n確認していますか？',
    help: '支払いの予定がない場合のみ「該当なし」を選べます。',
    options: [...STATUS, { value: 'na', label: '該当なし：支払い予定がない' }],
  },
  {
    id: 'q08', no: '08', step: 3, scored: true,
    title: '消費税やインボイスについて、\n自社に必要な対応を\n確認していますか？',
    help: '登録の有無ではなく、必要性を確認できているかを伺います。',
    options: STATUS,
  },
  {
    id: 'q09', no: '09', step: 3, scored: false,
    title: '今後、外部からの資金調達を\n検討していますか？',
    help: '回答に応じて、この後の質問が変わります。',
    options: [
      { value: 'loan', label: '融資を検討' },
      { value: 'equity', label: '出資を検討' },
      { value: 'both', label: '融資と出資の両方' },
      { value: 'none', label: '予定なし' },
      { value: 'undecided', label: '未定' },
    ],
  },
  {
    id: 'q10', no: '10', step: 4, scored: true,
    title: '資金調達に向けて、\n必要な資金額と使い道を\n整理していますか？',
    help: 'まだ金額が決まっていなくても、近い回答を選べます。',
    options: STATUS,
  },
  {
    id: 'q11', no: '11', step: 4, scored: true,
    title: '出資を受ける場合、\n株主構成や持分比率への\n影響を確認していますか？',
    help: '出資や株主構成の変更が関係する場合に確認します。',
    options: [...STATUS, { value: 'na', label: '該当なし：出資・変更予定なし' }],
  },
  {
    id: 'q12', no: '12', step: 4, scored: true,
    title: '経理や税務の重要な判断を\n相談できる相手は\n決まっていますか？',
    help: '相談相手がいないことだけで、危険とは判定しません。',
    options: STATUS,
  },
];

export const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
