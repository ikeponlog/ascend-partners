# デザイン棚卸し

- 状態：Round 1 で実施（LP本体、2026-10-18 に診断フローを追加）
- 承認対象 / バージョン：Figma `QPJTeaII3U88AUVFGV6Qhs` ページ 58:2459 の Frame 4（PC, 116:2338）/ Frame 7（SP, 134:5068）。バージョンID UNKNOWN
- 取得日時：2026-10-17 21:43 JST（references/figma/manifest.md REF-001 / REF-002）
- 値の出典：`get_design_context`（各セクション）、`get_variable_defs`（116:2338）、`get_metadata`。座標はLPフレーム（Frame 4 / Frame 7）基準のCSS px

実在するセクションを上から記録する。PCとSPで構成は同じ順序だが、書体・カード形状・コピーの一部が異なる（下表「PC/SP差」）。

| 順番 | Figma名 / node-id（PC / SP） | HTML | PC x/y/幅/高さ | SP x/y/幅/高さ | コピー・タイポ | レイアウト・装飾 | 操作状態 | 未確認事項 |
|---|---|---|---|---|---|---|---|---|
| 0 | Header 58:4367 / 58:4594 | `header.site-header` | 0/0/1440/120 | 0/0/390/79 | ナビ「診断について　　事務所紹介　　FAQ」Noto Sans JP SemiBold 16/1.65, 字間0.48 | PC：ロゴ 370.286×40（本体365.714×39.853）、右にナビ740（テキスト344＋gap28＋CTA 368×64）。SP：ロゴのみ（枠342×31、本体320×34.87がはみ出す） | CTA hover/pressed/focus（60:291） | ナビの遷移先（LINK-002/003 推定） |
| 1 | 01 / Hero 58:4373 / 58:4598 | `section.hero` | 0/120/1440/658 | 0/79/390/879 | 対象帯 Serif SemiBold 20、見出し Serif Bold 48/1.55（SP 34）・3行固定改行、本文 Sans SemiBold 16/1.85（PCは2行固定改行）、タグ SemiBold 18（SP Bold 14・先頭空白あり） | 背景写真 object-cover（PC 2113×878 / SP 1560×3600）。PC：2列 566＋64＋650、左列に人物キャプション（top 128）。SP：縦積み、230pxの写真枠、下部にキャプション（白）＋下端グラデーション。見出し・本文に白の text-shadow 2 2 20（PCのみ） | CTA状態 | SPの下paddingはFigma 48だが固定高879で実効約19px（S-014） |
| 2 | Audience strip 58:4401 / 58:4626 | `section.audience` | 0/778/1440/144 | 0/958/128 | 1行目 EB Garamond Bold 16/24（和文はフォールバック）、2行目 Regular 16/24 muted（SP 14、2行目改行・「／」1つ少ない） | 背景 canvas #f5f4f1。PC左padding 79 | なし | SPコピー差（D-009） |
| 3 | 02 / Problems 58:4404 / 58:4629 | `section.problems` | 0/922/1440/737 | 0/1086/390/1102 | アイブロウ EB Garamond SemiBold 24/20、見出し Serif Bold 36/1.55（SP Sans Bold 24/36）、導入 Sans Medium 20/1.85（SP Regular 16 muted）、カード 番号 EB 40/20・題 Bold 20/30・本文 16/1.85 muted | PC 2×2（628×140、枠1px muted、角丸0、列gap24・行gap32）。SP 縦積み（角丸12、枠#d8dcdf、番号32）。acendsymbol 装飾がAudience stripへ重なる（PC 545×411 at x850 y-108 / SP 174×131 at x210 y-72） | なし | SP番号の太さ：01のみSemiBold（D-022） |
| 4 | 03 / Benefits 58:4426 / 58:4653 | `section.benefits` | 0/1659/1440/496 | 0/2188/390/570 | PC：番号 EB SemiBold 40。SP：番号 EB Medium 28/1.55、本文幅 264/259/255 | PC：3項目＋矢印コネクタ40（項目368×140、枠なし）。SP：背景 tint #faf2ef、縦積み、下向き矢印（項目下端+0.8 / +4.6） | なし | なし |
| 5 | 04 / Diagnostic Axes 58:4442 / 58:4669 | `section.areas` | 0/2155/1440/673 | 0/2758/390/1170 | 見出し1行。SP番号 EB Bold 24/36 | PC 2×2、カード幅 604 / 628（計1256、右端24px余り）、背景 #f3ecee、角丸0。SP：角丸12＋各カード後に区切り線 | なし | 列幅の不揃いが意図か（D-008） |
| 6 | 05 / Diagnostic Preview 58:4466 / 58:4693 | `section.preview` | 0/2828/1440/862 | 0/3928/390/1358 | PC チェックリスト「1. 2. 3.」（DADS Markers、#333 16/1.7 字間0.32）。SP「01　…」テキスト。結果カード 題 Bold 20/30、バッジ 14/24 白 | 背景 canvas。PC：584＋64＋632、結果カード白 p24 gap20。結果項目 角丸16 p24、優先確認 #fff5de/#7a4b00、準備できている #edf6f0/#21634a。SP：カード角丸12・枠#d8dcdf、バッジは上段 | なし | なし |
| 7 | 06 / How It Works 58:4493 / 58:4720 | `section.steps` | 0/3690/1440/450 | 0/5286/390/864 | PC番号「01」、SP「STEP 01」ラベル（EB SemiBold 20/24、tint、角丸8、幅100） | PC：カード 368×150 角丸12 枠muted＋矢印コネクタ。SP：縦積み gap32、枠#d8dcdf | なし | なし |
| 8 | 07 / Why Ascend 58:4512 / 58:4739 | `section.why` | 0/4140/1440/1493 | 0/6150/390/2271 | PCアイブロウ「06 / WHY ASCEND PARTNERS」、SP「 WHY ASCEND PARTNERS」（先頭空白）。見出し PC Serif Bold 36 / SP Serif Medium 28。代表見出し PC Serif SemiBold 36「最も頼りになる」/ SP Serif Medium 28「最も頼りなる」 | PC padding 96/80・gap48。柱カード 405×140 角丸12 #f3ecee gap32。区切り線。代表写真 492×348 cover＋名前行、本文740。ブランド行 canvas：画像560×309 contain＋文言672 p24。SP：柱カード上端にbrand 1px線、写真342×230、ブランド画像342×189 | 外部リンク | コピー差（D-009） |
| 9 | 08 / CTA 58:4530 / 58:4757 | `section.cta` | 0/5633/1440/628 | 0/8421/390/728 | 見出し PC Serif Bold 36 / SP Serif Medium 28、相談見出し PC Serif Bold 24 / SP Sans Bold 16 | 背景 brand＋テクスチャ（PC hard-light 40%、SP overlay 40%）。PC：836＋64＋CTA 380（Inverse）、白1px線、相談CTA 380（Secondary、ラベル SemiBold 18 中央）。SP：縦積み gap32、CTA 342 | CTA状態 | 遷移先 B-001 |
| 10 | 09 / FAQ 58:4540 / 58:4767 | `section.faq` | 0/6261/1440/781 | 0/9149/390/697 | 開：質問 brand（PC Inter Bold / SP EB Garamond Bold）・「−」brand。閉：Noto Sans Bold ink・「+」muted。回答 16/1.85 muted | アイブロウ→見出し→一覧の間隔0、一覧上padding24。項目 py24、内部区切り線＋項目下線（内側線） | 開閉（69:2244） | Q2〜Q5の回答文なし（B-002） |
| 11 | Footer 58:4563 / 58:4790 | `footer.site-footer` | 0/7042/1440/224 | 0/9846/390/336.69 | タグライン Regular 20/1.85 字間1（SP 16・字間0）、リンク 14/1.65、© Medium 12/20（SP Bold） | 背景 #202222＋テクスチャ multiply（PCのみ）。PC：上段 871＋495、下段 1040＋256（内容幅1280を超える）。SP：縦積み gap32、ロゴ枠300×32.69（本体320） | 外部リンク | なし |

## 色・タイポ・寸法等の実測

| 分類 | ノード / 用途 | viewport / 状態 | Figma実測値 | 採用トークン | 根拠 |
|---|---|---|---|---|---|
| 色 | 本文・見出し | 共通 | #222b33 | `--stc-ink` | 変数 stc-ink |
| 色 | 補足文 | 共通 | #5b6168 | `--stc-muted` | 変数 stc-muted |
| 色 | 背景（白） | 共通 | #ffffff | `--stc-paper` | 変数 stc-paper |
| 色 | ブランド赤 | 共通 | #af1717 | `--stc-brand` | 変数 stc-brand |
| 色 | 生成り背景 | 共通 | #f5f4f1 | `--stc-canvas` | 変数 stc-canvas |
| 色 | 線 | 共通 | #d8dcdf | `--stc-border` | 変数 stc-border |
| 色 | 暗色背景 | 共通 | #202222 | `--stc-dark` | 変数 stc-dark |
| 色 | 淡い赤（SP Benefits背景、STEPラベル、Inverse pressed） | 共通 | #faf2ef | `--stc-tint` | 変数 stc-tint（フォールバック値） |
| 色 | 優先確認 | 共通 | #7a4b00 / 背景 #fff5de | `--stc-warning` / `--stc-warning-bg` | 変数 |
| 色 | 準備できている | 共通 | #21634a / 背景 #edf6f0 | `--stc-success` / `--stc-success-bg` | 変数 |
| 色 | CTA hover / pressed / focus | 状態 | #871111 / #640d0d / #005fcc | `--stc-hover` / `--stc-pressed` / `--stc-focus` | 60:291 状態バリアント |
| 色 | 領域・柱カード背景 | 共通 | #f3ecee | `--color-card-rose` | 実測（変数化されていない） |
| 色 | チェックリスト番号 | PC | #333333 | `--color-marker` | color-neutral-solid-gray-800 |
| 色 | ヒーロー帯（タグ） | PC / SP | rgba(255,255,255,.4) / .5 | `--color-hero-tag-pc` / `-sp` | 実測 |
| グラデーション | SPヒーロー下端 | SP | transparent 86.915% → rgba(126,126,126,.1) 91.445% → rgba(0,0,0,.2) 100% | 直接記述 | 58:4598 |
| 合成 | CTAテクスチャ | PC / SP | hard-light 40% / overlay 40% | 直接記述 | 58:4530 / 58:4757 |
| 合成 | フッターテクスチャ | PC | multiply 100% | 直接記述 | 58:4563 |
| 影 | ヒーロー見出し・本文 | PC | text-shadow 2px 2px 20px #fff（effect「wsha」） | 直接記述 | 58:4373 |
| 書体 | 見出し | PC（SPはWhy/CTA/ヒーローのみ） | Noto Serif JP 500/600/700 | `--font-heading` | テキストスタイル STC v3/heading |
| 書体 | 本文・ラベル | 共通 | Noto Sans JP 400/500/600/700/900 | `--font-body` | STC v3/body, label, caption |
| 書体 | 英字アイブロウ・番号 | 共通 | EB Garamond 500/600/700 | `--font-label` / `--font-num` | 各テキスト |
| 書体 | FAQ 開いた質問 | PC | Inter Bold | `--font-faq-q` | 69:2247 |
| 行間 | heading / body / caption / label | 共通 | 1.55 / 1.85 / 1.65 / 1.5（Figmaは文字サイズ×比率を整数pxに丸めて描画：16px本文=30px。R2で実測） | `--lh-*`（`round(<比率>em, 1px)`） | テキストスタイル、D-005 |
| 角丸 | バッジ・STEP / カード / 結果項目 / ボタン | 共通 | 8 / 12 / 16 / 999 | `--radius-*` | 変数 stc-radius-8/16/pill、12は実測 |
| 寸法 | 内容幅 / CTA高 / フォーカス線 | PC | 1280 / 64 / 3 | `--content-max` / `--btn-height` / `--focus-ring` | 実測 |
| 余白 | 変数 | 共通 | 8,12,16,20,24,32,40,64,80 | `--space-*` | 変数 stc-space-* |
| 余白 | 変数外の実測 | 共通 | 4, 28, 48, 56, 72, 96 | `--space-*` | docs/spacing-audit.md |

## PC/SP差（コピー・構成）

PCとSPでコピーが異なる箇所は、出し分け（`.u-pc` / `.u-sp`）でFigmaどおり両方を保持した。修正していない（D-009）。

- ヒーロー タグ：PC「無料 / 約3分 / 登録なしで結果を確認」、SP「    無料  /  約3分  /  登録なしで結果を確認」
- ヒーロー キャプション：PC 2行・全角スペース、SP 1行・半角スペース・文字サイズ混在
- Audience：SPは「最初の決算に向けて」の前の「／」がない
- Preview チェックリスト：PC「1.」形式、SP「01　」形式
- Steps 番号：PC「01」、SP「STEP 01」
- Why アイブロウ：PC「06 / WHY ASCEND PARTNERS」、SP「 WHY ASCEND PARTNERS」
- Why 代表見出し：PC「最も身近で最も頼りになる」、SP「最も身近で最も頼りなる」
- Why 名前：PC「代表  鶴田高志」（半角2）、SP「代表 鶴田高志」

## 参照のない画面幅の方針

- SP参照の有無：あり（390px、Frame 7）
- 実装上の仮定（handoff 58:4814「≥1024px：LPは2〜3列」「768〜1023px：ナビをコンパクト化…左右32px」「<768px：LP 1列、左右24px」に基づく）：
  - 〜767px：SP構成（390参照）。左右24px。
  - 768〜1023px：PC構成、左右32px。
  - 768〜1279px：ヘッダーのテキストリンクを省略しCTAのみ（D-007）。固定高のカード・見出しは高さ自動。
  - 768〜1199px：3列の行（Benefits / Steps / Why柱）は縦積み（D-013）。
  - 1440px超：内容幅1280pxで中央寄せ、背景は全幅（D-006）。
- 表現変更の承認が必要な箇所：D-007（中間幅のナビ省略）、D-013（中間幅の縦積み）、D-019（中間幅でヒーローのキャプションが人物の顔に重なる）

## 診断フロー（2026-10-18 追加）

- 実装：`site/diagnosis/index.html`（1ページ・JSで画面切替）。コピーの全文は `references/figma/flow-copy-*.txt`、設問データは `site/scripts/diagnosis/questions.js`。
- 根拠：handoff 58:4814（分岐・判定方針・キーボード・レスポンシブ）、部品 STC / Answer 58:4289、STC / Text field 58:4310、Brand CTA 60:291。

| 画面 | PC node / 高さ | SP node / 高さ | 構成・タイポ | 状態・操作 |
|---|---|---|---|---|
| ヘッダー | 64:3245 / 108 | 85:2244 / 96 | ブランド表記 342×68（TAX CHECK 175×38 トリミング、Produce by：PC Lexend Deca Light 16 / SP EB Garamond 16 #1e1e1e、事務所ロゴ 194.919×21.241）。PC右に Secondary CTA 280×56（文言は画面ごと） | SPはボタンなし |
| 枠 | Desktop content：canvas・padding 40、カード800（枠1px #d8dcdf・角丸8・padding 32・gap 20） | padding 24・gap 24、カードなし。設問・案内・中断・結果は canvas、フォーム系は白 | — | — |
| 設問 Q01〜Q12（＋Q02設立前） | 64:3244 ほか / 1024〜1070 | 64:382 ほか / 920〜1056 | STEP表記 PC Bold 12/20 brand・SP EB Garamond Bold 20/20、進捗4分割（4px、gap 8）、カテゴリ 14/24 muted、Q番号 Bold 12/20 muted、設問 Bold 24/36（SPは手動改行）、補足 14/24 muted、回答（高さ64・padding 16・枠1px #767d84・角丸8、Bold 16/24、記号 ○/● 幅24・文言幅272）、注記、戻る 140×56（SP 100）＋次へ、中断リンク 14/24 | 選択：tint＋2px brand。Focus：3px #005fcc。選択で遷移しない |
| 対象外の案内 | 64:5019 | 64:2030 | ラベル（tint・幅300）、見出し、本文 16/28、補足、CTA「最後の質問へ」「資金調達の回答を変更」 | 予定なしのみ表示 |
| 未回答エラー | 64:5125 | 64:2124 | 「Q05 / 日々のお金の管理」Bold 12/20 brand、エラー要約（tint・padding 16・gap 8・#b42318）、回答はカードgap（20/24）で並ぶ、次へ | 要約へフォーカス |
| 中断確認 | 64:5241 | 64:2228 | 見出し、本文、「回答に戻る」「診断を終了する」 | ヘッダー「回答に戻る」 |
| 結果A/B/C | 64:5344・5467・5585 | 64:2319・2430・2536 | YOUR CHECK RESULT（PC Bold 12 / SP EB Garamond Bold 20）、ラベル幅180（A・C warning、B success）、見出し、注記、優先確認（warningBg・padding 20・角丸16・gap 12）、次の一歩（B successBg / C 白）、準備できていること（successBg・#21634a）、区切り線、相談CTA・メールCTA・「回答を見直す」Bold 16 brand | ヘッダー「診断をやり直す」 |
| メール受取・入力エラー・送信中 | 64:5703・5964・67:4380 | 64:2642・2879・67:2226 | Text field（ラベル Bold 16/24、入力 padding 16・16/28・枠#767d84・角丸8、補足 14/24）、同意（Bold 16）、プライバシーリンク 14 brand、お役立ち情報（14）、注記、送信・戻る | エラー：枠・補足・同意文が #b42318。送信中：「送信しています…」（カプセルなし） |
| 30分相談 | 64:5820 / 1290 | 64:2747 / 1316 | Text field×4（お名前・会社名・メール・相談したいこと） | — |
| 送信完了・通信エラー・相談受付 | 64:6084・6179・6283 | 64:2987・3070・3162 | ラベル success（幅180 / 320）、見出し、本文、再送信・戻る | — |

追加トークン：`--stc-error #b42318`、`--stc-control #767d84`、`--font-produce`（Lexend Deca）、`--color-produce #1e1e1e`。

## 2026-10-18 Figma更新（D-050・D-051）

上の表のうち、次の値は更新後のFigma（references/figma/v2-20261018）が優先する。

| 対象 | 更新前 | 更新後 |
|---|---|---|
| SPのセクション見出し（Problems・Benefits・Areas・Preview・Steps・FAQ） | Noto Sans JP Bold 24/36 | Noto Serif JP Bold 24/36 |
| SPの Why 見出し・代表メッセージ見出し・CTA 見出し | Noto Serif JP Medium 28/1.55 | Noto Serif JP Bold 24/36 |
| SP Problems カード | 番号（EB 32/20）の下にタイトル | 番号とタイトルを横並び（間隔8・上下中央）、本文は下。カード高 150（2行題は180）、セクション 974 |
| SP Areas カード | 番号（EB 24/36）の下にタイトル | 横並び（間隔16）。カード高 156（04は126）、セクション 1002 |
| SP Why の柱 | 線・番号・タイトル・本文の縦積み | 線、番号（EB 24/20）＋タイトル横並び（間隔16）、本文。柱高 133、セクション 2147 |
| SP CTA | セクション 728 | 見出し 24/36 で 3行、セクション 707 |
| YOUR NEXT ACTION（PC 58:4466 / SP 58:4693） | 背景 canvas、白いカード（SPは角丸12・枠線） | 背景画像（ドットの波）、人物写真（PC 501×510.776 を左191・チェックリスト上端から100、SP 341×347 をカードの12px下・左11）、カード PC 白70%・SP 白、角丸16・枠なし、結果行は上揃え、バッジ PC SemiBold / SP Regular。PC 862（不変）、SP 1358→1693 |
| ページ高 | SP 10183 | SP 10077（Figmaのフレームは10200だが下123pxは空き） |
