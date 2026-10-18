# Figma → vanilla HTML/CSS/JS / Claude Code 3-Pass スターターキット

承認済みデザインの印象・コピー・色・レイアウトを維持し、余白だけを監査して統一するための実装キットです。各テンプレートは分割・配置済みです。

## 使い始める手順

1. ZIPを展開する。新規案件では、このREADMEとCLAUDE.mdがあるフォルダを作業ルートにする。既存案件では必要ファイルを配置し、既存のCLAUDE.mdやdocsを上書きせず内容を統合する。
2. [docs/project-brief.md](docs/project-brief.md)に案件名、承認済みFigma URL、PC/SPノード、フォント、リンク先などを記入する。不明な値はUNKNOWNのまま残す。
3. [docs/setup.md](docs/setup.md)に従い、Claude CodeとFigma MCPの接続を確認する。
4. [Round 1プロンプト](prompts/round1-initial-implementation.md)の全文をClaude Codeに貼る。
5. Round 1の報告後、[Round 2プロンプト](prompts/round2-visual-qa.md)の全文を貼る。
6. Round 2の報告後、[Round 3プロンプト](prompts/round3-production-qa.md)の全文を貼る。

各Round内のPhaseごとに承認待ちで停止する運用ではありません。不明点と判断はログへ残し、独立して進められる作業を継続します。承認済みデザインを変更する必要がある箇所は、その変更だけを保留します。

## 自分で記入するもの / Claude Codeが更新するもの

- 最初に記入：docs/project-brief.md。取得できない仕様や素材があれば、その所在も記入。
- 通常はそのまま利用：CLAUDE.md、spacing.md、font-rules.md、design-preservation.md、visual-qa.md、acceptance-checklist.md。
- Figma取得・実装後に更新：design-inventory.md、spacing-audit.md、assets.md、animations.md、implementation-decisions.md、qa-round1〜3.md、references/figma/manifest.md。
- prompts配下は全文を貼り付け可能なプロンプト。案件情報を毎回プロンプトに転記する必要はありません。

## ファイル一覧

| ファイル | 用途 |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Claude Codeが読む共通実装ルール |
| [汎用版全文](Figma_Vanilla_ClaudeCode_3Pass_Implementation_Kit.md) | 元のキット全文。プロンプト内の節番号の参照先 |
| [docs/project-brief.md](docs/project-brief.md) | 案件情報・Figma・フォント・リンク指定 |
| [docs/setup.md](docs/setup.md) | Figma MCP・環境準備 |
| [docs/design-preservation.md](docs/design-preservation.md) | 優先順位・変更可能範囲 |
| [docs/font-rules.md](docs/font-rules.md) | フォント取得・実装・検証 |
| [docs/design-inventory.md](docs/design-inventory.md) | セクション・デザイン値の棚卸し |
| [docs/spacing.md](docs/spacing.md) | 余白を統一するルール |
| [docs/spacing-audit.md](docs/spacing-audit.md) | 元値・採用値・差・高さの監査 |
| [docs/assets.md](docs/assets.md) | 素材台帳と取得方針 |
| [docs/animations.md](docs/animations.md) | 承認済み動作と必要な操作状態 |
| [docs/implementation-decisions.md](docs/implementation-decisions.md) | 判断・保留・BLOCKERの記録 |
| [docs/visual-qa.md](docs/visual-qa.md) | 撮影・差分分類・レスポンシブ検証 |
| [docs/qa-round1.md](docs/qa-round1.md) | 初回実装の結果記入 |
| [docs/qa-round2.md](docs/qa-round2.md) | Visual QAの結果記入 |
| [docs/qa-round3.md](docs/qa-round3.md) | Production QA・性能・納品判定 |
| [docs/acceptance-checklist.md](docs/acceptance-checklist.md) | a11y・性能・最終納品基準 |
| [docs/troubleshooting.md](docs/troubleshooting.md) | よくある失敗と修正方針 |
| [references/figma/manifest.md](references/figma/manifest.md) | 参照画像の出典・幅・倍率・取得日 |
| [prompts/round1-initial-implementation.md](prompts/round1-initial-implementation.md) | Round 1のコピペプロンプト |
| [prompts/round2-visual-qa.md](prompts/round2-visual-qa.md) | Round 2のコピペプロンプト |
| [prompts/round3-production-qa.md](prompts/round3-production-qa.md) | Round 3のコピペプロンプト |

## 運用上の扱い

汎用版全文は改変せず同梱しています。全文内の「テンプレートを保存する」工程は、このZIPでは完了済みです。実測値・案件情報・採用判断は分割したdocs側へ記入してください。全文の未記入テンプレートで記入済みファイルを上書きしないでください。方針を変更する場合は明示的な指示・承認を根拠として判断ログに残します。

仮行やUNKNOWNは記入用です。検証済みの証拠ではありません。初期状態のQA結果は未実施・未判定です。

このZIPにLP本体や撮影・ビルドスクリプトは含まれていません。対象Figmaを参照してRound 1以降で作成します。公開はこのキットの実行だけでは行いません。

---

## この案件の実装（Ascend STARTUP TAX CHECK LP）

Round 1（2026-10-17）で作成、Round 2・3（2026-10-18）で Visual QA・Production QA を実施。対象はFigma `QPJTeaII3U88AUVFGV6Qhs` のLP本体（PC Frame 4 / SP Frame 7）と診断フロー。最新の状況・公開可否は [docs/qa-round3.md](docs/qa-round3.md)、判断は [docs/implementation-decisions.md](docs/implementation-decisions.md) を参照。

### 起動と検証

必要環境：Node.js 20以上（確認は v23.11.0）。gitリポジトリではないため、作業ツリーの状態が成果物。→ 2026-10-18 から GitHub `ikeponlog/ascend-partners`（Public）の `main` で管理（それ以前のコードは `archive/2026-09-18-initial` ブランチに保管）。

```bash
npm install
npx playwright install chromium
npm run assets      # 素材の最適化・フォントのコピー（site/assets を生成。元素材は上書きしない）
npm run build       # 納品物 dist/ を生成（CSS結合・和文フォントのサブセット。site/ は変更しない）
```

| 用途 | コマンド | URL |
|---|---|---|
| 開発（編集する元ファイル） | `npm run serve` | http://localhost:3000/ （`site/`） |
| 納品物の確認 | `npm run serve:dist` | http://localhost:3100/ （`dist/`） |
| 納品物＋フォーム送信（PHP）の確認 | `npm run serve:php` | http://localhost:3200/ （`dist/`。`api/send.php` を PHP 8.3 で実行） |

- **納品・公開するのは `dist/` の中身**（`site/` を編集したら `npm run build` で作り直す。`dist/` は直接編集しない）。
- 相対パスのみで構成しているため、ルート直下でもサブディレクトリ（例：`/lp/`）でも配信できる（R3で確認）。
  ただし配信サーバーは「`/lp` → `/lp/`」「`/lp/diagnosis` → `/lp/diagnosis/`」のように**ディレクトリURLを末尾スラッシュ付きへリダイレクトする設定**が必要（一般的な静的ホスティングの既定動作。ローカルの `serve` は `serve.json` で同じ動作にしている）。
- ビルドの内容（`scripts/build.mjs`）：
  1. `styles/main.css`・`styles/diagnosis.css` の `@import` を記述順に展開して1ファイルにする（`@layer` の順序は不変）。
  2. Noto Sans JP / Noto Serif JP を、サイト内の文字（HTML・JS・CSSの全文字）だけの派生ファイルにする。元の全文字ファイルは別名（`… Full`）の代替として残し、入力欄のある診断ページだけが描画を止めずに読み込む。
  3. `dist/BUILD.txt` に生成日時と削減量を記録する。
- コピーを変更して新しい文字が増えた場合も、`npm run build` で派生ファイルが作り直される。確認は `npm run check:glyphs`（全文字がWebフォントで描画されるか）。

別ターミナルでサーバーを起動したまま実行する（既定は `site/`。納品物は `--url` / `--base` に `http://localhost:3100/` を指定）：

```bash
npm run shoot                                   # PC 1440 / SP 390 の全ページ撮影とセクション寸法
node scripts/shoot.mjs --viewports "" --widths 320,768,1024,1920   # 任意幅の撮影
npm run compare                                 # Figma参照との比較（全ページ＋セクション）→ *-{side,overlay,diff}.png、compare-report.json
npm run check                                   # コンソール・404・axe・FAQ操作・Tab順・reduced-motion・JS無効
npm run shoot:flow                              # 診断フロー：Figmaの各画面と同状態で撮影・比較
npm run check:flow                              # 診断フロー：分岐・未回答・履歴・フォーム・送信状態・キーボード・axe
npm run measure -- --frame 134:5068 --width 390 # Figmaのテキストノードと実装要素のy・高さの突き合わせ（PCは --frame 116:2338 --width 1440）
npm run contrast                                # 画像・テクスチャ上の文字のコントラスト実測（axeの判定不能分）
npm run check:delivery                          # 全ページ・全画面の読込・HTML検証・ID重複・ARIA参照・リンク属性（--base でサブディレクトリも可）
npm run check:a11y                              # 見出し・ランドマーク・名前・Tab/Shift+Tab・アンカー・FAQ・画面切替のフォーカス・操作対象サイズ
npm run check:robustness                        # BP前後1px・200%相当・文字間隔・長い入力・画像/フォント/JSの読込失敗・JS無効
npm run check:glyphs                            # 全テキストがWebフォントで描画されるか（サブセットの文字欠け確認。既定は dist）
npm run check:api                               # フォーム送信の受け付け・拒否・連続送信制限（serve:php と dry_run 設定が必要。docs/form-lolipop.md）
npm run perf -- --base http://localhost:3100/   # Lighthouse（mobile / desktop、3回の中央値。--throttling devtools で実回線絞り）
node scripts/interaction-lab.mjs                # 操作の応答時間（Event Timing、CPU 4倍低速化。実ユーザーINPではない）
node scripts/regress.mjs --from artifacts/qa/round2 --to artifacts/qa/round3   # Round間の回帰比較
```

**FAQの回答の入れ方**：`site/index.html` の各 `faq__answer-inner` の `<p>` を正式な回答文に置き換え、`npm run build`（Q2〜Q5 は現在ダミーテキスト。2026-10-18 ご依頼）。回答が入った質問は自動で開閉でき、空の質問は開閉できない状態のまま（`site/scripts/faq.js`）。

**動き**（2026-10-18 追加：追従ヘッダー・フェードアップ・ホバー・羽のシンボル）：仕様は [docs/animations.md](docs/animations.md)、CSSは `site/styles/motion.css` ほか、JSは `site/scripts/{header,motion}.js`。OSの「視差効果を減らす」等の設定ではすべて止まる。撮影・比較スクリプトはこの設定で撮影し、静止状態を比べる。

**全画面の確認用URL**（ローカル確認専用。`localhost` / `127.0.0.1` のみ有効）：`/diagnosis/?demo=<画面名>` で、回答の例を入れた状態の各画面を直接開ける。
画面名：`q01`〜`q12`、`q02-pre`（設立前の文言）、`skip`（資金調達の質問を省略）、`unanswered`（未回答エラー）、`abort`（中断確認）、`result-a` / `result-b` / `result-c`、`email`、`input-error`、`sending`、`sent`、`network`（通信エラー）、`consult`、`consult-error`、`received`。

**フォーム送信**（2026-10-18、D-064）：ロリポップ等のPHPが使えるサーバーで `api/send.php` が受け取り、メールを送る。送信元・通知先アドレスとメール文面が未確定のため、`api/config.php` は空欄（空のあいだは送信せず、画面は通信エラー）。設置手順・ローカル確認（`npm run serve:php` → `npm run check:api`）・送られるメールは [docs/form-lolipop.md](docs/form-lolipop.md)。
送信処理なしで画面だけ確かめる場合は `http://localhost:3000/diagnosis/?mock=success`（成功）・`?mock=error`（失敗）・`?mock=pending`（送信中のまま）で各状態を確認できる（localhost / 127.0.0.1 のみ有効。本番ドメインでは無効）。

出力先は `--out` / `--dir` で変更できる（例：Round 3 は `--out artifacts/qa/round3`）。

### クライアント確認用ページ（GitHub Pages・パスワード付き）

- URL：https://ikeponlog.github.io/ascend-partners/ （LP）、`…/diagnosis/`（診断）
- `main` に push すると GitHub Actions（`.github/workflows/preview.yml`）が `npm run build` → `npm run build:preview` を実行し、`preview/` を公開する。
- GitHub Pages には Basic 認証がないため、StatiCrypt で各ページのHTMLを暗号化し、パスワード入力画面を出す（1回入れると他のページも開ける。「30日間省略」あり）。
  **簡易的な保護**：画像・CSS・JS はURLを知っていれば開ける。またリポジトリが Public のため、ソースコード（文言を含む）は誰でも見られる。
- パスワードはリポジトリのシークレット `PREVIEW_PASSWORD`（8文字以上）。変更は `gh secret set PREVIEW_PASSWORD -R ikeponlog/ascend-partners` のあと Actions の「Preview (GitHub Pages)」を再実行。未設定なら公開されない（保護なしのページは作らない）。
- フォーム送信（PHP）は GitHub Pages では動かない（送信すると「送信できませんでした」画面）。
- 手元で作る場合：`npm run build` のあと `PREVIEW_PASSWORD=… npm run build:preview`。

### 構成

| パス | 内容 |
|---|---|
| `site/index.html` | LP本体（セマンティックHTML） |
| `site/diagnosis/index.html` | 診断フロー（設問・結果・フォーム。画面は `site/scripts/diagnosis/` が描画） |
| `site/styles/diagnosis.css` | 診断フローのCSS読込（トークン・ベース・Brand CTAをLPと共有） |
| `site/styles/main.css` | `@layer tokens, base, components, sections, utilities` の順で各CSSを読込 |
| `site/styles/tokens.css` | Figma変数・実測値のトークン（色・書体・行間・余白・角丸） |
| `site/styles/components/` | 共通部品（セクション枠、見出し、Brand CTA、番号付きカード） |
| `site/styles/sections/` | セクション別CSS（PCを既定、`max-width: 767px` でSP） |
| `site/scripts/` | ESモジュール。LPはFAQ開閉のみ。`diagnosis/` は設問データ・分岐判定・画面・送信アダプタ |
| `site/assets/` | 配信用素材（`npm run assets` で生成）。元素材は `assets/` と `references/figma/assets-raw/` |
| `scripts/` | 素材生成・撮影・比較・確認スクリプト（この案件で作成） |
| `references/figma/` | Figma参照画像・メタデータ・manifest |
| `site/api/` | フォーム送信（`send.php`・`config.php`・`.htaccess`。`result-copy.json` はビルド時に生成） |
| `dist/` | **納品物**（`npm run build` の生成物。直接編集しない） |
| `serve.json` | ローカル配信の設定（ディレクトリURLを末尾スラッシュへリダイレクト、一覧表示なし） |
| `artifacts/qa/round{1,2,3}/` | 各Roundの撮影・比較・確認結果（Round 3 の画像が次回の回帰比較基準） |
