# ROUND 1 結果 — 初回実装

- 実装範囲：LP本体（PC Frame 4 / SP Frame 7）の全12ブロック、および診断フロー（2026-10-18追加：Q01〜Q12＋Q02設立前、Q09分岐と対象外案内、未回答エラー、中断確認、結果A/B/C、メール受取・30分相談フォーム、入力エラー・送信中・送信完了・通信エラー・相談受付）。送信先は未接続（B-007）
- 参照Figma・バージョン：`QPJTeaII3U88AUVFGV6Qhs` ページ 58:2459、REF-001（116:2338, 1440×7266）/ REF-002（134:5068, 390×10183）、2026-10-17 21:43 JST取得。バージョンID UNKNOWN
- 確認URL・コードの状態：LP `http://localhost:3000/`、診断 `http://localhost:3000/diagnosis/`（相談フォーム直接 `#consult`、送信状態の確認 `?mock=success｜error｜pending`）（`npm run serve`）。gitリポジトリではないためコミットなし（2026-10-17時点の作業ツリー）
- 実装状況：部分完了（LP本体は完了。遷移先・FAQ回答・メタ情報はBLOCKER）
- 検証状況：一部未実施（Chromiumのみ。Safari/Firefox・実機・200%拡大・手動コントラスト測定は未実施）

撮影条件：Playwright Chromium（`artifacts/qa/round1/shoot-pc-sp.json` に版を記録）・DPR 1・`document.fonts.ready`と表示中画像のdecode完了後・遅延画像はスクロールで読込後に先頭へ戻して全ページ撮影。

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠・画像パス | 未解決事項 |
|---|---|---|---|---|---|
| 全ページ高さ | PC 1440 | Figma参照と比較（compare.mjs） | PASS（B） | 7260 / 7266（−0.08%）`artifacts/qa/round1/pc/compare/full-*.png` | 文字枠の丸め差（D-005） |
| 全ページ高さ | SP 390 | 同上 | PASS（B） | 10152 / 10183（−0.30%）`artifacts/qa/round1/sp/compare/full-*.png` | 同上 |
| セクション単位 | PC 1440 ×12 | 横並び・半透明重ね・diff、拡大目視 | PASS（A/B） | `pc/compare/<section>-{side,overlay,diff}.png`。高さ差は0〜−2px、画素不一致率0.2〜2.9% | なし |
| セクション単位 | SP 390 ×12 | 同上 | PASS（B） | `sp/compare/<section>-*.png`。高さ差−8〜+1px（最大−0.93%）。画素不一致はyの累積ずれによる | SPヒーローの不一致10%は写真上の2〜3px縦ずれ（B） |
| 改行・整列・crop | PC / SP | 拡大比較（参照と同位置で切出し） | PASS | 見出しの意図的改行・本文の改行位置・左整列軸80/24・写真のトリミングが一致 | — |
| 中間幅・境界 | 320 / 375 / 393 / 767 / 768 / 1023 / 1024 / 1199 / 1200 / 1279 / 1280 / 1439 / 1920 | 全ページ撮影＋横はみ出し検出 | PASS（はみ出し0）/ 要承認あり | `artifacts/qa/round1/w<幅>/full.png`、`shoot-widths-w.json` | D-007 / D-013 / D-019（参照なし幅の表現） |
| コンソール・404 | PC / SP | check.mjs（console error/warning、4xx/5xx、失敗リクエスト） | PASS | `artifacts/qa/round1/check.json`：エラー0・失敗0 | — |
| a11y自動検査 | PC / SP | axe-core（WCAG 2.0/2.1/2.2 A・AA タグ） | PASS（違反0） | `check.json` axe_pc / axe_sp | 画像上の文字のコントラストは「要確認」（D-025）。自動検査のみでWCAG適合とはしない |
| FAQ開閉 | PC | Enter / Space / クリック、aria-expanded・hidden | PASS | `check.json` faq、`states/faq-q1-focus.png`・`faq-q1-closed.png` | Q2〜Q5は回答なしで開閉不可（B-002） |
| キーボード | PC | Tab順・フォーカス表示 | PASS（一部BLOCKER） | `check.json` tabOrder（全要素 3px #005fcc）、`states/link-focus.png` | 未接続CTA（href なし）はTab順に入らない（B-001） |
| CTA状態 | PC | hover撮影 | PASS | `states/header-cta-hover.png`（#871111） | pressed/focusはCSSで実装、撮影はhoverのみ |
| reduced-motion | PC | `reducedMotion: 'reduce'` でアニメーション・トランジション数 | PASS | 0 / 0 / 0 | — |
| JS無効 | PC | `javaScriptEnabled: false` | PASS | `states/no-js-pc.png`、FAQ Q1回答・全セクション表示 | — |
| リンク設定 | PC | 全aの href / target / rel / 状態 | 一部BLOCKER | `check.json` links：外部3件（noopener・新しいタブ注記あり）、ページ内3件（遷移先存在、うち2件推定）、未接続4件 | B-001、D-017 |
| ローカル素材 | PC / SP | 失敗リクエスト検出 | PASS | 404なし | — |
| フォント | PC / SP | 読込済みフォント（document.fonts） | PASS | Noto Sans JP / Noto Serif JP / EB Garamond / Inter（すべて可変・セルフホスト） | — |
| 他ブラウザ・実機 | — | — | NOT_TESTED | — | Round 2/3 |
| 200%拡大・長文 | — | — | NOT_TESTED | — | Round 3 |
| 性能（LCP等） | — | — | NOT_TESTED | — | Round 3（テクスチャ容量 D-023） |

### 診断フロー（2026-10-18）

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠・画像パス | 未解決事項 |
|---|---|---|---|---|---|
| 画面比較 | PC 1440 ×19画面 | Figma参照と同状態で撮影し比較（`scripts/shoot-flow.mjs`） | PASS（A/B）16画面・要承認3画面 | `artifacts/qa/round1/flow/pc/<画面>-cmp-{side,overlay,diff}.png`。16画面は高さ差0px・不一致0.05〜0.25%。結果A/Bは +28px。未回答エラーは高さ一致・不一致5.43%（5つ目の選択肢による位置ずれ） | D-027（準備できていることのリスト化）、D-029 |
| 画面比較 | SP 390 ×17画面 | 同上 | PASS 16画面・要確認1画面 | `artifacts/qa/round1/flow/sp/…`。16画面は高さ差0px・不一致0.27〜0.99%。未回答エラー +88px | D-029（5つ目の選択肢を維持） |
| 分岐・判定 | PC | `scripts/check-flow.mjs`（Q09 出資/融資/予定なし/未定、設立準備中、戻って変更） | PASS | `artifacts/qa/round1/flow/check-flow.json` | 判定ルールは handoff の「案」（B-006） |
| 未回答エラー | PC | 未選択で次へ → 要約へフォーカス・aria-invalid・describedby | PASS | `flow/state-unanswered-focus.png` | — |
| キーボード | PC | Tab・矢印キー選択・Enterで次へ・フォーカス3px | PASS | `flow/state-answer-focus.png` | — |
| 履歴・中断 | PC | ブラウザの戻る、回答を見直す、中断→回答に戻る、診断を終了する→LP | PASS | `check-flow.json` | — |
| フォーム | PC / SP | 空送信の検証、送信中（二重送信防止）、未接続→通信エラー、再送信、mock成功→完了/受付、入力内容の保持 | PASS | `check-flow.json` | 送信先未接続（B-007） |
| a11y自動検査 | PC / SP × 9画面 | axe（WCAG 2.x A/AA） | PASS（違反0） | `check-flow.json` axe | 自動検査のみ |
| 中間幅 | 320 / 375 / 767 / 768 / 1023 / 1024 / 1280 / 1920 | 横はみ出し検出・撮影 | PASS（はみ出し0） | `flow/widths/` | D-036（320pxのブランド縮小） |
| reduced-motion・コンソール | PC | 動き0・エラー0・4xx/5xx 0 | PASS | `check-flow.json` | — |
| JS無効 | — | — | 未対応（D-031） | — | 診断はJS必須 |

## 余白と見た目
- 採用した変更と監査ID：S-001（Audience strip PC 左padding 79→80、スナップ）のみ。
- 維持した例外と理由：Why Ascend の 96/48（強調）、Hero 64/72、SP CTA 32、Preview見出し内12・FAQ見出し間0（保留：S-006/S-007）、Service pillars gap 32（保留：S-010）、SPヒーロー実効下余白19（S-014）。詳細は docs/spacing-audit.md。
- 差分A/B/C/Dの残件：
  - A：S-001（audience、差なし）。
  - B：文字枠の丸めによる縦の累積（PC −6px / SP −31px）、アンチエイリアス。※Round 2で行送りの丸め違い（C）と判明し修正（qa-round2.md R2-01、D-005）。
  - C（修正済み）：FAQ枠線の高さ加算（+5px）、フッター右列のずれ（11〜15px）、SP CTAのgap（−39px）、SP Benefitsの本文幅と改行、SPフッターロゴの縮小、日本語の禁則・約物詰め（改行違い）、768pxの横はみ出し、中間幅のヒーローCTAとロゴの重なり、中間幅の代表名の重なり。
  - D（未解決）：B-001〜B-005、D-019（中間幅のヒーロー構図）。
- 全ページの高さ・累積ずれ：PC 7260/7266（−0.08%）、SP 10152/10183（−0.30%）。全セクション±1%以内。
- 印象チェック：密度感・情報の強弱・整列軸・色面積・写真と装飾の重なり（シンボルとAudience stripの重なり含む）・CTAの目立ち方に変化なし（目視、2026-10-17）。

## 未解決
| ID | 内容 | 影響 | 必要な情報・判断 | 独立して完了した作業 |
|---|---|---|---|---|
| B-001 | （解消）LPのCTAは診断フローへ接続済み | — | 本番のベースパスのみ確認 | LP→診断・相談 |
| B-006 | 診断結果の項目文言・判定ルールが一部未確定（税理士監修待ち） | 該当回答で「【未確定】…」表示 | 全設問の結果文言・優先順位 | 判定ロジック・確定文言の表示 |
| B-007 | フォームの送信先未接続 | 送信は通信エラー画面になる | 送信先・方式 | フォームUIと全状態 |
| B-002 | FAQ Q2〜Q5の回答文なし | 4問を開けない | 回答文 | 開閉機能 |
| B-003 | title・meta・OGP・favicon・canonical 未提供 | 公開不可 | 正式文言・素材 | 仮title |
| B-004 | 素材の利用権限未確認（TAX CHECKロゴは生成画像の可能性） | 公開判定不可 | 権利の根拠 | 素材配置・最適化 |
| B-005 | 承認バージョン・承認者未記録 | 参照固定が日時のみ | バージョン名・承認者 | manifestで日時固定 |
| D-007 / D-013 / D-019 | 参照なし幅（768〜1279px）の表現 | 中間幅のみ | 承認または中間幅の参照フレーム | はみ出し・欠落なしで実装 |
| D-008 / D-009 / D-022 | Figma内の不揃い・誤字の疑い | なし（Figmaどおり） | 修正可否 | Figmaどおり実装 |

## 次のRound / 納品
- 再確認事項：診断フロー D-026〜D-036、D-007/D-013/D-019（中間幅）、D-008/D-009/D-022（Figmaの不揃い・コピー）、S-006/S-007/S-010（保留余白）、D-016（Safariでの改行）、D-025（画像上の文字のコントラスト）、比較画像の再撮影。
- 起動・再現方法：README「起動と検証」参照（`npm install` → `npm run assets` → `npm run serve` → `npm run shoot` → `npm run compare` → `npm run check` → `npm run shoot:flow` → `npm run check:flow`）。
- 公開可否（Round 3）：未判定（現状はBLOCKERにより不可）
