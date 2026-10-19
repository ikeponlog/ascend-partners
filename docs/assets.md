# 素材一覧・取得方針

- 状態：Round 1 取得・配置済み、Round 3 で納品用に最適化（権利確認は未完了：B-004）
- 生成手順：`npm run assets`（`scripts/prepare-assets.mjs`）。元素材は上書きしない。
  - 提供素材（正式）：`assets/`（project-brief記載の配布場所）
  - Figma取得原本：`references/figma/assets-raw/`（MCPの一時URLからダウンロード。配信しない）
  - 配信用：`site/assets/`（使用カテゴリのみ：images / backgrounds / logos / icons / fonts）

- 正式素材またはFigmaの該当ノードを使用する。画像の内容・色・透過・輪郭・比率を維持する。
- ベクターはSVG、写真は用途に合うラスター形式を選ぶ。AVIF/WebP等への変換は画質と透過を実画像で確認し、元画像を保存する。
- 必要解像度は実表示サイズと対象DPRから決める。2x固定や固定品質値を全素材へ適用しない。元より大きく拡大して情報量が増えた扱いにしない。
- ロゴ・多色アイコンの色を変えない。`currentColor`化は単色で状態追従が意図されたアイコンに限る。
- MCPの一時的なURLを本番の恒久参照にしない。

| ID | ローカルファイル | 元ノード / 提供元 | 用途 | 元寸法 / 表示寸法PC・SP | crop・透過 | alt | 読込方針 | 権利確認 | 取得状態 |
|---|---|---|---|---|---|---|---|---|---|
| A-001 | `site/assets/images/hero-bg-pc.webp` | 提供 `assets/images/都市を背景にした企業インタビュー.png`（＝Figma 58:4373 の画像塗り 224e9.png と画素一致：平均差0） | PCヒーロー背景（代表写真＋都市） | 2113×878 / PC 1583×658相当（cover、左右各72px切取） | object-fit: cover・中央。透過なし | `""`（キャプションで人物名を併記。D-018） | 初期表示内。`<link rel=preload media>`＋fetchpriority=high | UNKNOWN | 取得済み（WebP q82, 135KB） |
| A-002 | `site/assets/images/hero-bg-sp-780.webp` / `-825.webp` | 2026-10-18 ご依頼で差し替え：提供 `assets/images/hero-sp-20261018.webp`（825×1906）。旧：Figma 58:4598 の画像塗り e5394（1560×3600） | SPヒーロー背景 | 825×1906 / SP 390×900相当（cover） | cover・中央。透過なし | `""` | 初期表示内。preload（SPのみ）＋srcset 780w/825w | UNKNOWN | 取得済み（81KB / 102KB）。D-058 |
| A-003 | `site/assets/images/why-profile.webp` | 提供 `assets/images/about_img_02.jpg`（1400×537。Figma塗り f03f1 1200×460 と同内容） | 代表写真 | 1400×537 / PC 492×348、SP 342×230（cover） | cover・中央 | 「アセンドパートナーズ会計事務所 代表 鶴田高志の写真」 | lazy | UNKNOWN | 取得済み（77KB） |
| A-004 | `site/assets/images/why-brand.webp` | 提供 `assets/images/about_img_01.jpg.png`（1120×618。Figma塗り d5723 と平均差0.2） | ブランド画像（シンボル＋「ともに羽ばたく」） | 1120×618 / PC 560×309、SP 342×189（contain） | contain。元PNGは全面不透明 | 画像内の文言「ともに羽ばたく スタートアップの良きパートナーとして、共に成長していく」 | lazy | UNKNOWN | 取得済み（WebP q90, 16KB） |
| A-005 | `site/assets/backgrounds/cta-texture.webp` | Figma 58:4530 画像塗り 9cc9c（4096×2867 JPEG 13.9MB） | CTA背景テクスチャ | 2880×2016 / PC 1440×1008相当（cover）、SP 1040×728相当 | PC hard-light 40%、SP overlay 40% | `""`（装飾） | lazy | UNKNOWN | 取得済み（824KB。Round 3で再圧縮検討 D-023） |
| A-006 | `site/assets/backgrounds/footer-texture.webp` | Figma 58:4563 画像塗り a71ac（4096×2048 JPEG 6.6MB） | フッター背景テクスチャ（PCのみ） | 2880×1440 / PC 1440×720相当（cover） | multiply 100% | `""`（装飾） | lazy（SPは非表示のため読込なし） | UNKNOWN | 取得済み（653KB。D-023） |
| A-007 | `site/assets/logos/logo.svg` | 提供 `assets/logos/logo.svg`（＝STC v3 / Logo / logo 59:1523 と同形） | ヘッダーロゴ | 342×35（右22px空白）→ viewBoxのみ320×35に切詰め / PC 365.714×40、SP 320×35 | 透過SVG。色・形は不変 | 「アセンドパートナーズ会計事務所 ASCEND PARTNERS ACCOUNTING FIRM」 | eager | UNKNOWN | 取得済み（派生：viewBox変更のみ。D-020） |
| A-008 | `site/assets/logos/logo-reverse.svg` | 提供 `assets/logos/logo_yoko_color_nega.svg`（＝STC v3 / Logo / reverse 59:1582） | フッターロゴ（白抜き） | viewBox 171.57×18.74 / PC 320×34.95、SP 320×34.95（枠300） | 透過SVG | 同上 | lazy | UNKNOWN | 取得済み（無変更コピー） |
| A-009 | `site/assets/logos/acend-symbol.svg` | 提供 `assets/logos/acendsymbol.svg`（＝Figma 61:5468 / 134:6560 と同形） | Problems上部の装飾シンボル | viewBox 23.72×17.93 / PC 544.8×410.85、SP 173.63×131.05 | 透過SVG。右端は局所的に裁ち落とし | `""`（装飾） | eager（初期表示付近） | UNKNOWN | 取得済み（無変更コピー） |
| A-010 | `site/assets/logos/taxcheck-fill.webp` | Figma画像塗り f1f25（1024×346 RGBA）。ヘッダー 116:2336 / ヒーロー 104:6177・134:4999 | 「STARTUP TAX CHECK」ロゴ（CTA内） | 1024×346 → 520×176 / 129×34（Figmaどおり枠いっぱいに伸縮） | 透過あり（WebP alphaで維持） | 「STARTUP TAX CHECK」 | eager | UNKNOWN（ファイル名「ChatGPT 画像…」：生成画像の可能性。権利確認要） | 取得済み（17KB） |
| A-011 | `site/assets/logos/taxcheck-crop.webp` | Figma画像塗り a5bff（2160×728 RGBA。提供 `ChatGPT 画像 2026年10月13日 19_38_52 1.svg` 内蔵PNGと同寸） | 同上（CTAセクション） | 2160×728 → 540×182 / 129×34枠にFigmaのトリミング値（w101.73% h130.43% x−1.92% y−21.74%） | 透過あり | 「STARTUP TAX CHECK」 | lazy相当（画面外） | 同上 | 取得済み（15KB） |
| A-012 | `site/assets/icons/arrow-capsule-brand.svg` / `arrow-capsule-white.svg` | Figma 60:204 / 60:234（2c76f / 6af95） | CTAの矢印カプセル内アイコン | 16×16 | 線のみ。2026-10-19 からHTMLにインラインSVG（currentColor）で埋め込み、色はCSSで切り替え（D-070。ファイルは素材として保持） | `""`（親spanが aria-hidden） | eager | Figma部品 | 取得済み |
| A-013 | `site/assets/icons/arrow-right.svg` | Figma 81:7487 ほか（bfd9e。SP 23302 と同一内容） | Benefits / Steps のコネクタ矢印（SPは90°回転） | 24×24 | 単色 #AF1717 | `""`（装飾） | eager | Figma部品 | 取得済み |
| A-014 | `site/assets/fonts/{noto-sans-jp,noto-serif-jp,eb-garamond,inter,lexend-deca}/`（lexend-decaは2026-10-18追加：診断ヘッダーPCの「Produce by」） | npm `@fontsource-variable/*`（5.3.x） | Webフォント（unicode-range分割woff2） | 計約20MB（実際の読込は使用文字の分割ファイルのみ） | — | — | font-display: swap | OFL-1.1（各フォルダにLICENSE同梱） | 取得済み |
| A-015 | `site/assets/backgrounds/preview-bg-pc.webp` / `preview-bg-sp.webp` | Figma 58:4466 画像塗り 0f238（4096×2048 JPEG）。SP 58:4693 の 4ebf2 は同じ画像（平均差0.17） | YOUR NEXT ACTION の背景（ドットの波） | 4096×2048 / PC 1724×862相当（cover）、SP 元画像の x2221〜3621 を切り出し（Figmaの表示範囲 x2685〜3157 を中心） | cover・中央 | `""`（装飾） | lazy | UNKNOWN（2026-10-18 追加） | 取得済み（WebP 2880幅 q72 32KB / 1000幅 13KB） |
| A-016 | `site/assets/images/preview-people.webp` | Figma 154:7024 / 154:7036 画像塗り 1b576（3205×3072 PNG 透過） | YOUR NEXT ACTION の人物（男女2名の切り抜き） | 3205×3072 → 1050×1006 / PC 501×510.776、SP 341×347（cover） | 透過を維持（WebP alpha 90） | `""`（装飾。内容を伝える役割はない） | lazy | UNKNOWN（モデル・撮影素材か生成画像かを含め要確認） | 取得済み（6.2MB → 88KB） |

診断フロー（2026-10-18）での使用：A-007（ヘッダーの事務所ロゴ 194.919幅）、A-011（TAX CHECK：Figma 91:6114 のトリミング値 w101.73% h157.89% x−4.77% y−26.32%）、A-012（矢印カプセル）。新規の画像素材なし。

未使用の提供素材：`assets/logos/Brand.svg`（ロゴ＋TAX CHECK合成。Figma上に該当配置なし）、`assets/images/about_img_02.jpg.png`（984×696、別トリミング。Figmaの代表写真と不一致：平均差約45）。

## 取得失敗 / 手動書き出し / 権利未確認

| ID | 区分 | 対象 | 実装への影響 | 必要な対応 | 判断ログID |
|---|---|---|---|---|---|
| A-001〜A-011 | 権利未確認 | 写真・ロゴ・テクスチャ全般 | 実装・ローカル確認は可能。公開判定は不可 | 利用権限・ライセンスの根拠（project-brief「利用権限」UNKNOWN）の提供 | B-004 |
| A-010 / A-011 | 権利未確認（要注意） | TAX CHECKロゴ（Figma上のレイヤー名「ChatGPT 画像 2026年10月13日」） | 同上 | 正式ロゴとして承認済みか、商標・生成物の扱いを確認 | B-004 |
| A-005 / A-006 | 最適化保留 | テクスチャ（824KB / 653KB） | 表示は同等。転送量が大きい | Round 3でサイズ・品質を比較し再圧縮 | D-023 |
| — | 取得不要 | ロゴのFigma SVG書き出し（`references/figma/assets-raw/logo-*.svg`） | 書き出しにキャンバス背景 #3E3F3F が含まれるため不採用。提供SVGを使用 | なし | D-020 |

## Round 3：納品用の最適化（2026-10-18）

| 対象 | 変更 | 結果 | 品質の確認 | 判断ログ |
|---|---|---|---|---|
| A-014 Noto Sans JP / Noto Serif JP | `npm run build` で、使用中の分割ファイル（各45件）をサイト内の使用文字（712字）だけの派生ファイルに。可変軸（wght）は保持。元ファイルは別名「… Full」の代替として `dist/` に残す | Sans 945KB→268KB、Serif 1264KB→347KB（使用分割の合計）。LPモバイルの総転送量 1388KB→690KB | 全ページ・診断の全画面の全テキスト（927要素）がWebフォントで描画されることをCDPで確認（`check:glyphs`）。R2との画像比較で全51枚が画素一致。入力欄の範囲外の文字（例：髙・﨑）は「… Full」で描画されることを確認 | D-039 |
| A-005 / A-006 テクスチャ | 変更なし（再圧縮案を比較のみ） | — | 2880幅 q50：粒状感がわずかに弱まる。1920幅以下：2倍表示で粒状感が失われる（比較：`artifacts/qa/round3/texture/`） | D-023（NEEDS_APPROVAL） |
| その他の画像 | 変更なし | ヒーロー PC 135KB（preload・fetchpriority=high）、SP 74KB / 117KB（srcset）。他は遅延読込 | — | — |
| CSS | `dist/` では `main.css`（19件）・`diagnosis.css`（9件）を記述順に結合 | リクエスト 24→5（LP） | R2との画像比較で画素一致 | D-039 |
| A-017 | `site/assets/favicon/favicon-{32x32,180x180,192x192}.png` | ascend-tax.jp の favicon（cropped-favicon-*.png）を取得（原本 `assets/favicon/`） | favicon / apple-touch-icon | 32 / 180 / 192 | 透過あり | — | head の link | 公式サイトの画像（ご依頼） | 取得済み。D-057 |
| A-018 | `site/assets/images/cta-people.webp` | 2026-10-18 ご依頼の添付（原本 `assets/images/cta-people-20261018.webp`、2000×1091 透過） | CTA（START HERE）の人物（3名の切り抜き） | 2000×1091 → 1146×625 / PC 573幅、SP 369幅 | 透過を維持 | `""`（装飾） | lazy | UNKNOWN | 取得済み（53KB）。D-063 |
