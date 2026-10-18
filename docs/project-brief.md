# 案件情報

## 基本情報
- 案件名：Acend_LP
- 作業ディレクトリ：Users>mwds>Desktop>Acend_LP
- 言語 / HTML lang：UNKNOWN（コピーが日本語のため実装は`ja`を仮設定。D-024）
- LPの目的：リード獲得
- 承認済みFigmaファイルURL：https://www.figma.com/design/QPJTeaII3U88AUVFGV6Qhs/（Ascend｜STARTUP-TAX-CHECK-LP-Wireframe。2026-10-17 チャットで指定）
- 承認対象のページ / バージョン / 確認日：ページ「v3.0｜ブランド・LP・スマホ診断」（58:2459）、「v3.0｜PC診断フロー」（63:382）／バージョンID：UNKNOWN（MCPで取得不可）／取得日 2026-10-17
- 追加の承認済み仕様書：NONE
- 実装対象 / 対象外：LP本体（Frame 4 / Frame 7）＋診断フロー（Q01〜Q12、分岐、結果A/B/C、メール受取・30分相談フォームと各状態）。2026-10-18 チャットで指示。送信先は未接続のまま（D-001 / D-030）
- デザイン差分を承認できる担当者：UNKNOWN

## 参照フレーム
| 用途 | 選択ノードへのURL / node-id | 幅×高さ（CSS px） | 備考 |
|---|---|---|---|
| PC | Frame 4 `116:2338`（LP本体 `58:4366` + Header `58:4367`） | 1440×7266 | ページ 58:2459。Figma上の名称は「Frame 4」 |
| SP | Frame 7 `134:5068`（LP本体 `58:4593` + Header `58:4594`） | 390×10183 | ページ 58:2459。Figma上の名称は「Frame 7」 |
| 診断フロー PC | ページ 63:382「v3.0｜PC診断フロー」01〜26（例：01 / Q01 64:3244） | 1440×1024〜1291 | 2026-10-18 実装対象に追加。参照画像は references/figma/flow/ |
| 診断フロー SP | ページ 58:2459 内 03〜06（例：03 / Q01 64:382） | 390×448〜1469 | 同上 |

## 公開・動作条件
- 公開先 / ベースパス：UNKNOWN
- ローカル確認URL：http://localhost:3000/
- 対応ブラウザ / 端末：UNKNOWN
- 最小サポート幅：UNKNOWN
- a11y目標：WCAG 2.2 AAを検証目標とする（案件指定があれば更新）
- フォーム・外部サービス・計測の仕様：UNKNOWN（フォームはロリポップ（PHP）の送信処理まで実装済み・送信元/通知先アドレスとメール文面が未確定：B-007 / D-064 / docs/form-lolipop.md。計測なし）
- 公開作業の範囲：ローカル実装と検証まで。公開は別途指示による

## リンク・アクション
| ID | 表示文言（Figmaどおり） | 動作 | 正式な遷移先 / 接続先 | 根拠 | 状態 |
|---|---|---|---|---|---|
| LINK-001 | 無料診断を始める（ヘッダー・ヒーロー・CTAの3箇所＋SPメニュー） | 診断の開始 | `diagnosis/`（診断フロー Q01） | Figmaプロトタイプリンク（→ 64:3244 Q01） | 実装済み（2026-10-18） |
| LINK-002 | 診断について（PCヘッダー） | ページ内リンク | `#benefits`（03 / Benefits）※推定 | 文言からの推定 | 要確認（D-017） |
| LINK-003 | 事務所紹介（PCヘッダー） | ページ内リンク | `#why`（07 / Why Ascend）※推定 | 文言からの推定 | 要確認（D-017） |
| LINK-004 | FAQ（PCヘッダー） | ページ内リンク | `#faq`（09 / FAQ） | 見出し「FAQ」と一致 | 実装済み（遷移先は推定を含むため要確認） |
| LINK-005 | 30分無料相談を希望する（CTA＋SPメニュー） | 相談申込フォーム | `diagnosis/#consult` | Figmaプロトタイプリンク（→ 64:5820 30分相談） | 実装済み（2026-10-18） |
| LINK-006 | 事務所・代表プロフィールを見る ↗ | 外部URL（新しいタブ） | https://ascend-tax.jp/about/ | Figmaのリンク設定（81:6691 / 62:478） | 実装済み |
| LINK-007 | 運営事務所 ↗ | 外部URL（新しいタブ） | https://ascend-tax.jp/ | Figmaのリンク設定（62:369 / 62:562） | 実装済み |
| LINK-008 | プライバシーポリシー ↗ | 外部URL（新しいタブ） | https://ascend-tax.jp/privacypolicy/ | Figmaのリンク設定（62:370 / 62:563） | 実装済み |
| LINK-009 | プライバシーポリシーを確認する ↗（診断のフォーム） | 外部URL（新しいタブ） | https://ascend-tax.jp/privacypolicy/ | Figmaのリンク設定（64:5980 ほか） | 実装済み |
| LINK-010 | 戻る（Q01）／診断を終了する | LPへ | `../`（LPトップ） | Figmaプロトタイプリンク（Back → 58-4366 / 58-4593） | 実装済み |
| LINK-011 | 03-3591-0144（SPメニュー） | 電話をかける | `tel:03-3591-0144` | ascend-tax.jp に掲載の代表番号（2026-10-18 確認）・ご依頼 | 実装済み（D-056） |
| LINK-012 | 診断画面のロゴ（STARTUP TAX CHECK / Produce by / 事務所ロゴ） | LPへ | `../`（LPトップ） | ご依頼（2026-10-18） | 実装済み（D-062） |
| FORM-001 | 診断結果を受け取る（メール受取） | フォーム送信 | `api/send.php`（ロリポップ / PHP） | 2026-10-18 ご指定「ロリポップ」 | 実装済み・アドレス未設定（B-007 / D-064）。設定までは通信エラー画面 |
| FORM-002 | 相談希望を送信する（30分相談） | フォーム送信 | `api/send.php`（ロリポップ / PHP） | 2026-10-18 ご指定「ロリポップ」 | 実装済み・アドレス未設定（B-007 / D-064）。設定までは通信エラー画面 |

※同じ文言でも行き先が違う場合は別行にする。
※内部アンカー、外部URL、ファイル、メール、電話、フォーム送信を区別する。

## 素材・メタ情報
- 正式ロゴ / 写真 / 図版の配布場所：Users>mwds>Desktop>Acend_LP>assets
- 利用権限・ライセンスの根拠：UNKNOWN
- title / meta descriptionの正式文言：UNKNOWN
- OGP：UNKNOWN
- favicon：ascend-tax.jp と同じ画像（2026-10-18 ご依頼。D-057）
- canonical URL：UNKNOWN

## フォント（FONT SPEC）
| 役割 | Figma指定ファミリー | 採用ファミリー | ウェイト / 可変軸 | 配信元・ファイル | 使用許諾の確認 |
|---|---|---|---|---|---|
| --font-heading | FIGMA（Noto Serif JP） | Noto Serif JP | 500 / 600 / 700（可変 wght） | セルフホスト `site/assets/fonts/noto-serif-jp`（@fontsource-variable 5.3.1） | OFL-1.1（パッケージ同梱LICENSE） |
| --font-body | FIGMA（Noto Sans JP） | Noto Sans JP | 400 / 500 / 600 / 700 / 900（可変 wght） | セルフホスト `site/assets/fonts/noto-sans-jp`（同 5.3.1） | OFL-1.1 |
| --font-label | FIGMA（EB Garamond。和文はフォールバック） | EB Garamond | 500 / 600 / 700（可変 wght） | セルフホスト `site/assets/fonts/eb-garamond`（同 5.3.0） | OFL-1.1 |
| --font-num | FIGMA（EB Garamond） | EB Garamond（--font-labelと同一） | 500 / 600 / 700 | 同上 | OFL-1.1 |
| --font-faq-q | FIGMA（Inter。PC FAQの開いた質問のみ） | Inter | 700 | セルフホスト `site/assets/fonts/inter`（同 5.3.0） | OFL-1.1 |
| --font-produce | FIGMA（Lexend Deca。診断ヘッダーPCの「Produce by」） | Lexend Deca | 300（可変 wght） | セルフホスト `site/assets/fonts/lexend-deca`（同 5.3.x） | OFL-1.1 |

- 使わない役割はNONE、足りない役割は追加する。
- Webフォント未取得時の暫定フォールバック：UNKNOWN（実装は各スタック末尾に sans-serif / serif。全フォント取得済みのため暫定運用なし）
- 納品物（`dist/`）では Noto Sans JP / Noto Serif JP を使用文字だけの派生ファイルにして配信（書体・グリフは同一。D-039）
- Figmaと異なるフォントへの変更承認・日付：NONE

## 動き・状態
- Figmaプロトタイプ / 承認済み動作仕様：FAQ部品（69:2244）の説明「button＋aria-expanded、Enter/Spaceで開閉」、Brand CTA（60:291）の状態バリアント。その他の動きの指定なし（docs/animations.md）
- 指定のない装飾アニメーション：追加しない
- 必要な操作状態：Figmaと実際の機能から抽出してdocs/animations.mdに記録

## 記入ルール

`UNKNOWN`は未確認、`NONE`は不要と確認済み、`FIGMA`はFigmaの値を採用する指定です。値は推測せず、不明な欄を残してください。フォント実装の詳細は[font-rules.md](font-rules.md)を参照してください。
