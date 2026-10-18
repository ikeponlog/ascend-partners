# ROUND 3 結果 — Production QA

- 実装範囲：LP本体（PC Frame 4 / SP Frame 7）、診断フロー（Q01〜Q12・分岐・結果A/B/C・メール受取・30分相談と各状態）。送信先は未接続（指示どおり）
- 参照Figma・バージョン：`QPJTeaII3U88AUVFGV6Qhs`。R1/R2と同じ参照画像（REF-001 / REF-002 / REF-F01〜F19）。バージョンID UNKNOWN（B-005）
- 確認URL・コードの状態：納品物 `dist/`（`npm run build`、2026-10-18 07:18 UTC 生成。`dist/BUILD.txt`）を `npm run serve:dist`（http://localhost:3100/）で確認。開発用 `site/` は http://localhost:3000/。サブディレクトリ配信は `/lp/` に配置して確認。gitリポジトリではないためコミットなし
- 実装状況：部分完了（R3の変更範囲内の修正は完了。コピー・素材権利・送信先・メタ情報などのBLOCKERと承認待ちが残る）
- 検証状況：一部未実施（Chromium 156 のみ。Safari / Firefox・実機・スクリーンリーダー実機・実ユーザー計測は未実施）

## 1. 配信・基本品質

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠・画像パス | 未解決事項 |
|---|---|---|---|---|---|
| 納品ファイル構成 | — | `dist/` の一覧・参照の確認 | PASS | HTML 2・CSS 2（結合済み）+ フォントCSS・JS 8・画像 13・フォント。未参照の部品CSSは配信しない。空の重複フォルダ（`files 2`）4件を削除 | — |
| 読込・404・コンソール | ルート配信 / LP＋診断15画面 | `scripts/check-delivery.mjs`（全リクエストの4xx/5xx・失敗、console error/warning） | PASS（16/16） | `artifacts/qa/round3/delivery-dist/delivery.json`（dist）、`delivery-root/`（site） | ブラウザの `/favicon.ico` 要求は404（favicon未提供：B-003） |
| サブディレクトリ配信 | `/lp/` 配下 | 同上（`--base http://localhost:3001/lp/`）＋末尾スラッシュなしのURL | PASS（16/16） | `delivery-subdir/`（`dist/` を `/lp/` に配置）。`/lp`・`/lp/diagnosis`・`index.html` 直指定とも素材404なし | 本番サーバーにディレクトリURLの末尾スラッシュ補完が必要（D-041）。初回確認で `serve` の既定動作による404と、一覧表示を誤って合格扱いした確認手順の誤りを検出し、設定とスクリプト（titleで実ページを確認）を修正 |
| HTML検証 | 静的HTML＋描画後の全16画面 | html-validate 9.7（standard プリセット） | PASS（エラー0） | `delivery-dist/html/*.html` | recommended プリセットの指摘は表記の好み2件（DOCTYPEの大文字、FAQ回答の `role="region"`＝ARIAアコーディオンの定型）で不正ではない |
| ID重複・ARIA参照・label | 同上 | check-delivery | PASS | ID重複0、`aria-*`/`for` の参照切れ0、label なし入力0、名前なしボタン0 | — |
| リンク属性 | 同上 | check-delivery | PASS | `href` なし0、`href="#"`0、`target=_blank` は全て `rel=noopener`＋「新しいタブで開きます」 | — |
| CSS結合 | dist | `scripts/build.mjs`、R2画像との比較 | PASS | `@import` を記述順に展開、`@layer` 順序不変、url() なし。結合後も R2 と画素一致 | — |
| README | — | セットアップ・ビルド・配信・検証手順を記載 | PASS | `README.md`「起動と検証」 | — |

## 2. レスポンシブ・操作

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠・画像パス | 未解決事項 |
|---|---|---|---|---|---|
| 参照幅・中間幅 | LP：320 / 375 / 393 / 767 / 768 / 1023 / 1024 / 1199 / 1200 / 1279 / 1280 / 1439 / 1440 / 1920、SP 390 | 全ページ撮影・横はみ出し | PASS（はみ出し0） | `artifacts/qa/round3/w<幅>/full.png`、`pc/` `sp/` | 参照なし幅の表現は承認待ち（D-007 / D-013 / D-019） |
| BP前後1px | LP 767/768・1023/1024・1199/1200・1279/1280、診断 359/360・767/768・1023/1024 | `scripts/check-robustness.mjs` | PASS（修正後） | `robustness-dist/bp-*.png` | **FAIL→修正**：診断SPヘッダーが360〜365pxで最大6px横にはみ出し → 0.96倍に縮小（D-036）。320〜390pxを1px刻みで再確認し0 |
| 200%拡大・リフロー | 720 / 640px（1440・1280の200%相当）、320px（1280の400%相当） | 同上 | PASS | `robustness-dist/zoom200-*.png`、`w320/` | ブラウザ本体のズーム操作は未実施（等価なビューポートで確認） |
| 文字間隔（WCAG 1.4.12） | LP・診断 PC / SP | 行高1.5・段落後2em・字間0.12em・語間0.16em を適用 | PASS | `robustness-dist/spacing-*.png`。PCヒーロー本文が3行になり固定枠（56px）を超えるが、CTAとの間隔内で重なり・欠落なし | — |
| 長い入力 | 相談フォーム PC / 320px | 120字の氏名・区切りなしの長いメール | PASS | `robustness-dist/long-input-*.png`（はみ出し0） | — |
| 固定要素 | — | — | N/A | 固定・追従要素なし（ヘッダーも通常配置） | — |
| ページ内アンカー | PC ヘッダー3件 | Enterで移動 → 見出し位置・次のTab | PASS | `a11y/a11y.json`（移動先が画面上端、次のTabは移動先以降） | 移動先は推定を含む（D-017） |
| 開閉UI・フォーム | FAQ、診断の回答・次へ・戻る・中断・送信 | check.mjs / check-flow.mjs（マウス・キーボード） | PASS | `check.json`、`flow/check-flow.json`（41/41） | — |
| JS無効・JS読込失敗 | LP / 診断 | javaScriptEnabled:false、scriptsへの通信遮断 | LP PASS / 診断 FAIL（既知） | `robustness-dist/nojs-*.png`、`fail-js-*.png` | 診断はJS必須で本文が空（代替文言がFigmaにない：D-031） |
| 画像の読込失敗 | LP PC / SP | 画像への通信遮断 | PASS | `robustness-dist/fail-images-*.png`。代替テキストが表示され、本文・CTAは操作可能 | — |
| フォントの読込失敗 | LP・診断 PC / SP | woff2 への通信遮断 | PASS | `robustness-dist/fail-fonts-*.png`。端末フォントで崩れ・はみ出しなし | — |

## 3. a11y

自動：axe-core 4.x（WCAG 2.0/2.1/2.2 A・AA タグ）。手動補助：`scripts/check-a11y.mjs`（アクセシビリティツリー・Tab往復の記録）、`scripts/contrast.mjs`。スクリーンリーダー実機（VoiceOver / NVDA）は未実施。

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠・画像パス | 未解決事項 |
|---|---|---|---|---|---|
| lang・title | LP / 診断 | DOM確認 | PASS | `lang="ja"`、title あり | title は仮（D-012）、lang は仮設定（D-024） |
| ランドマーク・見出し階層 | LP / 診断10画面 × PC / SP | check-a11y | PASS | header / nav（ページ内メニュー）/ main / section（見出しで命名）/ footer。h1 は各1、段飛ばしなし | — |
| 読み上げ順 | LP PC / SP、診断10画面 | アクセシビリティツリー（`a11y/*-aria.yaml`）を目視 | PASS | 表示順と一致。リンク名「無料診断を始める STARTUP TAX CHECK」など意味が通る | — |
| リンク・ボタン名、alt | 全画面 | check-a11y / check-delivery | PASS | 名前なし0。装飾画像は `alt=""`、ロゴ・写真は内容を記述 | — |
| フォームのlabel・エラー通知 | メール受取 / 相談 | check-a11y、check-flow | PASS（修正後） | label 関連付け・`role="alert"` の要約へフォーカス・`aria-invalid` | **修正**：同意チェックがエラー理由と関連付いていなかった → `aria-describedby` で要約に関連付け（D-040、見た目の変化なし） |
| Tab / Shift+Tab | LP PC（15件）/ SP（11件）、診断10画面 × PC / SP | 実キー操作で往復し順序一致を確認 | PASS（38/38） | `a11y/a11y.json` | — |
| Enter / Space | FAQ、回答、ボタン | 実キー操作 | PASS | 開閉・選択・フォーカス維持 | Q2〜Q5は回答がなく開かない（B-002） |
| Escape・フォーカストラップ | — | dialog / aria-modal の有無 | N/A | モーダル・ドロップダウンなし（中断確認は独立画面） | — |
| 画面切替時のフォーカス | 診断10画面 | 描画後の activeElement | PASS | 見出し（`#dx-title`）、エラー時は要約（`#dx-error`） | — |
| フォーカス表示 | 全操作要素 | computed style | PASS | 3px #005fcc（入力欄は3pxの枠） | — |
| 操作対象サイズ（2.5.8） | LP / 診断 × PC / SP | 寸法と間隔の計測 | PASS | 24px未満はフッターのリンク2件（高さ20px）のみ。周囲24pxに他の操作対象がなく間隔の例外に該当 | — |
| コントラスト（単色背景） | LP / 診断 | axe | PASS | 違反0 | — |
| コントラスト（画像・テクスチャ上） | LP PC / SP | `scripts/contrast.mjs`（背景画素の実測） | **FAIL（承認待ち）** | `artifacts/qa/round3/contrast.json`。PCヒーロー本文（5パーセンタイル4.14）・PCヒーロータグ（2.70）・PC相談本文（4.37）・SPヒーロー下部の3行（約1.96〜3.14）が4.5:1未満 | Figmaの配色どおり。色・不透明度の変更が必要なため NEEDS_APPROVAL（D-025、修正案あり） |
| reduced-motion | LP / 診断 | アニメーション・トランジション数 | PASS | 0 / 0 | — |
| メディア代替 | — | — | N/A | 動画・音声なし | — |

## 4. 表示性能

| 対象 | 検証方法 | 結果 | 根拠 | 未解決事項 |
|---|---|---|---|---|
| LCP候補 | Lighthouse の LCP 要素 | LP：ヒーロー背景画像（PC `hero-bg-pc.webp` 135KB / SP `hero-bg-sp-780.webp` 74KB、preload・fetchpriority=high）、診断：見出し `#dx-title` | `artifacts/qa/round3/perf*/` | — |
| 改善（D-039） | 修正前後を同条件で比較 | LPモバイル総転送量 1388KB→690KB、CSSリクエスト 24→5、描画を止める和文フォントCSS 105KB→14KB（各） | `perf-before*/` と `perf*/` | — |
| 画像容量・解像度 | ファイル一覧・表示寸法 | ヒーローは表示寸法に対して適正（SPは srcset 780w/1170w）。テクスチャ 824KB / 653KB は遅延読込（LCP外） | docs/assets.md | テクスチャ再圧縮は見た目が変わるため承認待ち（D-023） |
| フォント | 読込ファイルの確認 | LPは使用文字の派生ファイルのみ（元ファイル0件）。font-display: swap | `check:glyphs`（全927要素がWebフォント） | — |
| レイアウトシフト | Lighthouse CLS | 0.000〜0.002 | 下表 | — |
| JS処理 | Lighthouse TBT、操作の応答時間 | TBT 0〜10ms。LPのJSはFAQのみ | 下表 | — |
| 残る課題 | — | 診断モバイルのLCPと、simulate 推定でのLPモバイル。和文フォントが分割単位（各45件）のため、リクエスト数が多い | — | 分割を1ファイルにまとめるには元フォント（Noto JP の可変フォント本体）の取得が必要（D-044、承認待ち） |

## 性能計測

ラボ計測のみ（実ユーザーデータは未取得）。実ユーザーの Core Web Vitals（75パーセンタイル）達成とは判断しない。

共通条件：Lighthouse 12.8.2（`scripts/perf.mjs`）、Chromium 156（Playwright 同梱・headless）、Apple Silicon Mac 上のローカル配信（http://localhost:3100/ ＝ `dist/`、HTTP/1.1・gzip）、毎回新規プロファイル（キャッシュなし）。
mobile＝Lighthouse 既定（Moto G Power 相当の画面・CPU 4倍低速化・Slow 4G 相当）、desktop＝`--preset=desktop`。
スロットリングは2方式で計測：simulate（Lighthouse 既定。通信を推定する方式で、描画前に始まる全リクエストを悲観的に数える）と devtools（実際に回線とCPUを絞る方式）。値は中央値（範囲）。

| 指標 | 測定値（R3 納品物 dist、5回） | 修正前（site、3回） | 環境・ツール・URL | 試行数・キャッシュ | ラボ / 実ユーザー | 判定・制約 |
|---|---|---|---|---|---|---|
| LCP LP mobile | devtools **1.69秒**（1.68〜2.74）／ simulate 5.71秒（4.36〜5.71） | devtools 4.17秒／simulate 10.08秒 | 上記・`/` | 5回・キャッシュなし | ラボ | devtools では目標2.5秒以下（5回中4回）。simulate の推定では未達。**部分達成** |
| LCP LP desktop | devtools 0.09秒／simulate 1.23秒 | 0.12秒／2.05秒 | 上記・`/` | 同上 | ラボ | 目標以下 |
| LCP 診断 mobile | devtools **2.71秒**（1.85〜2.74、二峰性）／ simulate 3.39秒 | 3.90秒／4.51秒 | 上記・`/diagnosis/` | 同上 | ラボ | **未達**（改善はしたが2.5秒を超える回がある。見出しはJS描画のため、JSと和文フォントの到着待ち） |
| LCP 診断 desktop | devtools 0.07秒／simulate 0.73秒 | 0.07秒／0.89秒 | 上記 | 同上 | ラボ | 目標以下 |
| CLS | 全ケース 0.000〜0.002 | 0.000〜0.002 | 上記 | 同上 | ラボ（読込時のみ） | 目標0.1以下。操作中・スクロール中のシフトは実ユーザー計測が必要 |
| INP | **未計測** | — | — | — | — | 実ユーザーデータなし。Lighthouse のナビゲーション計測では測れない。TBT（0〜10ms）で代替合格にしない |
| 操作の応答（参考） | 最大56ms、中央値16ms（FAQ開閉・回答選択・次へ・戻る・結果描画・フォーム空送信、各5回、PC / SP） | — | `scripts/interaction-lab.mjs`（Event Timing API、CPU 4倍低速化） | 5回 | ラボ参考値 | INPの代わりにはしない（`artifacts/qa/round3/perf/interaction-lab.json`） |
| 総転送量 | LP mobile 690KB / desktop 827KB、診断 362KB | 1388KB / 1577KB / 508KB | 上記 | — | ラボ | テクスチャ（desktopのみ・遅延読込）が残りの大半 |

根拠：`artifacts/qa/round3/perf/`（simulate）、`perf-devtools/`（devtools）、修正前 `perf-before/` `perf-before-devtools/`。各回の Lighthouse JSON と `perf-summary.json`。
実ユーザーの Core Web Vitals は公開後に CrUX / RUM で確認する（計測の実装は指示範囲外のため未実装）。

## 5. リンク・コンテンツ・メタ情報

| 対象 | 検証方法 | 結果 | 根拠 | 未解決事項 |
|---|---|---|---|---|
| リンク表との照合 | project-brief LINK-001〜010 と実装の href | PASS | LP：`diagnosis/`×3、`diagnosis/#consult`、`#benefits` `#why` `#faq`、外部3件。診断：`../`、プライバシーポリシー | LINK-002/003 の遷移先は推定（D-017） |
| 内部アンカーの存在 | check-delivery / check-a11y | PASS | 移動先IDが存在し、移動後に見出しが上端 | — |
| 外部リンクの到達性 | HTTPS GET（2026-10-18） | PASS | https://ascend-tax.jp/ ・/about/ ・/privacypolicy/ すべて 200（リダイレクトなし） | 内容が正しいページかは未確認（文言とURLはFigmaのリンク設定どおり） |
| ファイル・mailto・tel | href の確認 | N/A | 該当なし | — |
| フォーム | ローカル（localhost）のみで確認。本番送信なし | BLOCKED | 送信先未接続。送信すると通信エラー画面（成功を装わない）。localhost 限定の mock で成功・失敗・送信中を確認 | 送信先・方式（B-007） |
| title | — | BLOCKED | 仮title（Figmaのコピーから構成） | 正式文言（B-003 / D-012） |
| description・OGP・favicon・canonical | — | BLOCKED | 未設定（推測で設定しない） | 正式情報（B-003） |
| 構造化データ | — | N/A | 根拠のそろう対象がない（FAQは回答文がQ1のみ）ため追加しない（D-042） | — |
| 仮・未確定の一覧 | — | BLOCKED | 下の「未解決」参照 | — |

## 6. 見た目の回帰確認

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠・画像パス | 未解決事項 |
|---|---|---|---|---|---|
| R2との比較 | LP PC / SP・13の中間幅、診断36画面 | `scripts/regress.mjs`（R2と同条件で撮影） | PASS（全51枚が画素一致） | `artifacts/qa/round3/regress/` | 360〜365px（R3で修正した幅）はR2の撮影対象外。個別に確認しはみ出し0 |
| Figma参照との比較 | PC 1440 / SP 390、診断36画面 | compare.mjs / shoot-flow.mjs | PASS（R2と同値） | PC 7266/7266（0.47%）、SP 10183/10183（0.94%）、診断 34/36（`round3/pc|sp/compare/`、`round3/flow/`） | 未回答エラー2画面（D-029） |
| 文字・色・画像・寸法・余白・操作状態 | 同上 | 画素一致により変化なし。状態画像 `round3/states/` | PASS | — | — |
| 許可されていない見た目の変更 | — | — | なし | テクスチャ再圧縮は見た目が変わるため適用せず（D-023） | — |

## 余白と見た目
- 採用した変更と監査ID：S-001 のみ（R1〜R3で変更なし）。R3 の修正は余白に影響しない。
- 維持した例外と理由：docs/spacing-audit.md「保留・例外と再確認」のとおり（R2から変更なし）。
- 差分A/B/C/Dの残件：A（S-001）、B（写真の半ピクセル再標本化・グリフ1px・アンチエイリアス：D-038）、C なし、D（D-029、D-025 ほか下表）。
- 全ページの高さ・累積ずれ：PC 7266 / 7266、SP 10183 / 10183（差0）。

## 未解決
| ID | 内容 | 影響 | 必要な情報・判断 | 独立して完了した作業 |
|---|---|---|---|---|
| B-002 | FAQ Q2〜Q5 の回答文なし | 4問が開けない | 正式な回答文 | 開閉機能 |
| B-003 | title・description・OGP・favicon・canonical | 公開不可 | 正式文言・画像・URL | 仮title |
| B-004 | 写真・ロゴ・TAX CHECKロゴ（生成画像の可能性）・テクスチャの利用権限 | 公開判定不可 | 権利の根拠 | 配置・最適化 |
| B-005 | 承認バージョン・承認者 | 参照の固定が日時のみ | バージョン名・承認者 | manifest で日時固定 |
| B-006 | 診断結果の文言・判定ルール（税理士監修待ち） | 「【未確定】」表示 | 全設問の文言・優先順位 | 判定ロジック・確定文言 |
| B-007 | フォーム送信先 | 送信できない | 送信先・方式・送信後の運用 | フォームの全状態 |
| D-025 | 画像上の文字のコントラスト不足（7か所） | WCAG 1.4.3 未達 | 修正案の承認 | 実測・案 |
| D-031 | 診断のJS無効時の表示 | JS無効では使えない | 代替文言の要否・文言 | — |
| D-041 | 本番サーバーの末尾スラッシュ補完 | 未設定だと素材404 | 公開先（UNKNOWN） | ローカル設定・README |
| D-007 / D-013 / D-019 / D-036 | 参照なし幅の表現 | 中間幅 | 承認または参照フレーム | はみ出し・欠落なし |
| D-009 / D-017 / D-022 / D-023 / D-024 / D-026〜D-029 / D-032 / D-033 / D-042 / D-043 | Figmaの誤字の疑い、推定リンク、テクスチャ圧縮、lang、診断の仕様補完ほか | 公開前の確認 | 確認・承認 | Figmaどおり、または記録済みの補完で実装 |

## 次のRound / 納品
- 再確認事項：Safari / Firefox（`round()` の行送り・`text-spacing-trim`・`zoom`・`:has()`）、実機（iOS / Android）、スクリーンリーダー実機、本番環境での実ユーザー計測（CrUX / RUM）、BLOCKER解消後の再ビルドと全検証。
- 起動・再現方法：README「起動と検証」。`npm run build` → `npm run serve:dist` → 各スクリプトに `--base` / `--url http://localhost:3100/`、出力 `--out artifacts/qa/round3`。
- 回帰比較の基準：`artifacts/qa/round3/`（R2と画素一致）。
- 公開可否（Round 3）：**不可**（下記）

## 納品判定

- 実装完了：**部分完了**。Figma参照のある範囲の実装・R3の修正は完了。FAQ回答・診断結果文言・送信先・メタ情報は情報待ちで未完了。
- 検証完了：**部分完了**。Chromium でのラボ検証（配信・HTML・レスポンシブ・操作・a11y自動＋手動補助・性能・回帰）は完了。他ブラウザ・実機・スクリーンリーダー実機・実ユーザー計測は未実施。
- 公開可能：**不可**。必須の未解決：B-002・B-003・B-004・B-006・B-007、D-025（コントラスト）、公開先とサーバー設定（D-041）。品質目標のうち診断モバイルのLCPがラボで未達（D-044）、INPは未計測。公開作業は本Roundでは行っていない。
- 必須の未解決事項：上表「未解決」。

## 追加対応（2026-10-18 ご依頼：変更承認として実施。D-045〜D-049）

ご依頼：動き（アニメーション・ギミック・フェードアップ・ホバー）、追従ヘッダー、FAQの開閉式（回答を入れられる構造）、ヒーローで顔にキャプションが重なる問題の修正、羽のシンボルのインラインSVG化。
確認は再ビルドした `dist/`（http://localhost:3100/）で実施。撮影・比較は「動きを減らす設定」で静止状態を撮る（`shoot*.mjs` を変更）。結果は `artifacts/qa/round3-motion/`。

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠・画像パス | 未解決事項 |
|---|---|---|---|---|---|
| 顔とキャプションの重なり | 768〜3200px | 頭部（元画像座標）を cover の計算で画面座標へ変換し、キャプション・コピーとの重なりを判定 | PASS（重なり0） | 1200px以上は写真を頭部基準で配置、768〜1199px はキャプションを左下（白文字＋左下だけ暗く）。`regress/w*-full-*.png` | — |
| 左下キャプションのコントラスト | 768 / 1024 / 1199 | `contrast.mjs --widths` | PASS（全画素で基準以上） | 標語 最小4.59（大きな文字 3:1）、事務所名・氏名 最小6.53（4.5:1）。`contrast-mid.json` | — |
| 参照幅の見た目 | PC 1440 / SP 390 | R3 との画像比較・Figma比較 | PASS | SP は画素一致。PC は写真の再標本化差 0.04%（B）。Figma比較 PC 7266/7266（0.49%）、SP 10183/10183（0.94%）、高さ差0 | — |
| その他の幅・診断 | 13幅・診断36画面 | 同上 | PASS | 変化はヒーローを直した幅（768〜1199、1200〜1439、1920）のみ。他41枚は画素一致。はみ出し0 | — |
| 追従ヘッダー | PC / SP | スクロール・Tab / Shift+Tab・ページ内リンク | PASS | 最上部はFigmaどおり、スクロールで 80 / 60px。フォーカスがヘッダーの下に隠れない（2.4.11）、移動先の見出しはヘッダーの16px下 | — |
| FAQ | PC | Enter / Space / クリック、回答を入れた場合 | PASS | Q1 開閉・フォーカス維持。回答欄に文を入れた項目は自動で開閉可能（配信HTMLを書き換えて確認）。Q2〜Q5 は回答なしのため開閉不可のまま | 回答文（B-002） |
| 動きを減らす設定 | LP | `reducedMotion: 'reduce'` で動き・遷移の数 | PASS | 0 / 0 / 0（フェードアップも最初から表示） | — |
| JS無効・JS読込失敗 | LP | robustness | PASS | 何も隠れない（フェードアップは JS が画面外の要素にだけ付与） | — |
| a11y | LP・診断 × PC / SP | axe（動きの終了後）・check-a11y | PASS | 違反0、38/38 | 画像上のコントラスト（D-025）は従来どおり承認待ち |
| 配信・HTML・文字 | 16画面 | check-delivery・check-glyphs | PASS | 16/16、全927要素がWebフォント | — |
| 性能（ラボ） | mobile / desktop | Lighthouse devtools 5回・simulate 3回、Event Timing | 動き追加による悪化なし | LP mobile LCP 1.71秒（1.71〜2.10）、診断 mobile 1.86秒（1.84〜2.72）、CLS 0.000（全ケース）、操作の応答 最大64ms。simulate は LP 5.79秒・診断 3.46秒（従来と同程度） | INP 未計測、診断の二峰性は D-044 |

公開可否：変更なし（**不可**。BLOCKER・承認事項は上記「未解決」のとおり）。

## 追加対応（2026-10-18 Figma更新・フッター・FAQ）

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠・画像パス | 未解決事項 |
|---|---|---|---|---|---|
| Figma更新後との比較 | PC 1440 / SP 390 | compare.mjs（参照を REF-001v2 / REF-002v2 に更新） | PASS | PC 7266/7266（0.51%）、SP 10077/10077（0.81%）、全セクション高さ差0。YOUR NEXT ACTION PC 0.43% / SP 0.55%、人物写真の位置ずれ0（シフト探索） | — |
| YOUR NEXT ACTION 参照なし幅 | 320〜1920 | 撮影・はみ出し検出 | PASS（はみ出し0） | 768〜1279 は人物写真をコピーの下に配置（半透明カードの下に透けない）、390未満は写真を縮小 | 中間幅の表現（D-051） |
| フッター | 1280 / 1440 / 1600 / 390、最下部までスクロール | 動きあり（通常設定）で表示状態を確認 | PASS（修正後） | 修正前は下段（リンク・©）が透明のまま（D-052） | — |
| FAQ | PC | 開閉（Enter / Space / クリック） | PASS | Q2〜Q5 にダミー回答（D-053）、全問開閉可能 | 正式回答（B-002） |
| 配信・文字・a11y・動作 | dist | check-delivery / check-glyphs / check / check-a11y / check-flow | PASS | 16/16、全文字Webフォント、axe 違反0、38/38、41/41、reduced-motion 動き0、13幅はみ出し0 | — |
| 確認用URL | 27画面 | `?demo=` で各画面を開き、表示画面・見出しを確認 | PASS | ページエラー0 | 結果Aの「10つ」表記（D-054） |

## 追加対応（2026-10-18 SPメニュー・favicon）

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠・画像パス | 未解決事項 |
|---|---|---|---|---|---|
| SPメニュー | SP 390 / 375 | check-a11y（開く・Tab巡回・Escape・項目選択・開いた状態のaxe・PCで非表示） | PASS（6項目） | `artifacts/qa/sp-menu/sp-375-{closed,open}.png` | — |
| ページ全体 | dist | check-a11y / check-delivery / check-glyphs / check-flow / check-robustness / 確認用URL | PASS | 44/44、16/16、全文字Webフォント、41/41、41ケースはみ出し0、27画面エラー0 | — |
| Figma比較 | PC / SP | compare.mjs | PASS（SPヘッダーはご依頼の変更） | PC 7266/7266、SP 10077/10077。SPヘッダーはボタン追加・ロゴ縮小で差（16%）、高さは79で一致 | — |
| favicon | — | 読込確認（404なし） | PASS | `assets/favicon/` | — |

## 追加対応（2026-10-18 SPヒーロー画像・三本線・回答のホバー・ロゴ・羽のギミック）

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠 | 未解決事項 |
|---|---|---|---|---|---|
| SPヒーロー画像 | 320 / 390 / 600 | 撮影・Figma比較 | 差し替え済み（Figmaとの差 22%：ご依頼の画像） | 高さ879で一致 | 390以下で人物の頭部上端にタグがかかる（D-058） |
| 三本線ボタン | SP | 撮影・SPメニュー試験 | PASS | 閉：三本線、開：× | — |
| 回答のホバー・選択中 | PC | ホバー時の撮影、Figma比較 | PASS | 診断36画面中35画面が高さ一致（残りは D-029）、選択中の差は1%以下 | — |
| ロゴの鮮明さ | PC / SP / 診断 | 位置・高さの実測、等倍の拡大比較 | PASS | すべて整数px（PC 40、SP 25・上27、診断 21） | — |
| 羽のギミック | PC | スクロール位置ごとの撮影、カーソル位置での傾き | PASS | 入る前：羽は右寄り・半透明 → 画面内：Figmaの位置。傾き −1.9°（右寄りのカーソル） | — |
| 全体 | dist | check / check-a11y / check-delivery / check-glyphs / check-flow / check-robustness | PASS | axe 0、44/44、16/16、全文字Webフォント、41/41、はみ出し0。PC 7266/7266、SP 10077/10077 | — |

## 追加対応（2026-10-18 SPヒーローの写真位置・診断ロゴのリンク）

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠 | 未解決事項 |
|---|---|---|---|---|---|
| SPヒーロー：タグと頭 | 320〜767 | 頭髪の上端とタグ下端の位置を計測 | PASS | 間隔 16〜46px、あごはキャプションより上 | — |
| SPヒーロー：キャプションのコントラスト | 320 / 375 / 390 / 600 / 767 | contrast.mjs | PASS | 全行 最小6.2:1以上 | — |
| 診断ロゴのリンク | PC / SP / 320 | クリックでLPへ、最初のTab、axe（label-in-name） | PASS | 342×60（320pxでは縮小）、遷移先 `/`、axe 違反0 | — |
| 全体 | dist | check-flow / check-a11y / check-delivery / check-glyphs | PASS | 41/41、44/44、16/16、全文字Webフォント | — |

## 追加対応（2026-10-18 CTAの人物写真）

| 対象 | viewport / 状態 | 検証方法 | 結果 | 根拠 | 未解決事項 |
|---|---|---|---|---|---|
| CTAの人物写真 | 1440 / 1280 / 1024 / 768 / 390 / 320 | 撮影・はみ出し検出 | PASS | 添付のレイアウトどおり。本文・ボタンに重ならない。PCの高さ628は不変、SP 707→881 | — |
| ボタン内のTAX CHECKロゴ | 320〜390 | 重なり検出 | PASS（修正後） | 修正前は389px以下で矢印・ラベルに重なっていた | — |
| CTAのコントラスト | 390 / 1024 / 1440 | contrast.mjs | SPはPASS。PCの相談本文は従来どおり（D-025） | — | D-025 |
| 全体 | dist | check / check-a11y / check-delivery / check-glyphs / check-flow | PASS | axe 0、44/44、16/16、全文字Webフォント、41/41、13幅はみ出し0 | — |
