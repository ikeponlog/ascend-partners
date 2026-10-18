// 結果画面の項目文言。Figmaの結果例（64:5344 / 64:5467 / 64:5585 ほか）にある文言のみ確定値として持つ。
// それ以外は未提供（税理士監修で確定予定：B-006）。作文せず、画面上で「未確定」と分かる表示にする。

// 優先確認（結果A）に表示する項目
export const PRIORITY_COPY = {
  q02: { title: '設立関連の届出', body: '提出済みの書類と提出日を確認し、未確認の届出・期限を整理しましょう。' },
  q08: { title: '消費税・インボイス', body: '取引先や今後の事業予定を整理し、自社に必要な対応を確認しましょう。' },
};

// 「✓ 準備できていること」に表示する項目
export const READY_COPY = {
  q05: '領収書・請求書の保存方法',
  q06: '毎月の収支・手元資金の把握',
};

// 結果C（設立前）の例でのみ使われている表記
export const READY_COPY_PRE_FOUNDING = {
  q04: '会社のお金を分ける準備',
};

export const UNCONFIRMED = {
  priorityTitle: (no) => `【未確定】Q${no}の確認事項`,
  priorityBody: '結果の文言は未提供です（税理士監修のうえ確定予定）。',
  ready: (no) => `【未確定】Q${no}の準備できていること`,
};

// 結果種別ごとの固定文言（Figmaどおり）
export const RESULT_COPY = {
  A: {
    chip: '優先確認あり',
    chipTone: 'warning',
    heading: (n) => `今、優先して確認したい\nことが${n}つ見つかりました。`,
  },
  B: {
    chip: '準備の確認',
    chipTone: 'success',
    heading: () => '創業期の税務・会計の\n準備は、概ね整って\nいるようです。',
    next: { tone: 'success', title: '次は、経営判断に役立つ管理へ', body: '月次の収支と資金繰りを、定期的に振り返る仕組みを整えましょう。' },
  },
  C: {
    chip: '設立準備中',
    chipTone: 'warning',
    heading: () => '会社設立前だからこそ、\n今から準備できることが\nあります。',
    next: { tone: 'paper', title: '設立前に整理したいこと', body: '設立予定日、決算月、設立後の届出、経理の進め方をリストにしましょう。' },
  },
};
