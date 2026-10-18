# Figma MCPと作業環境

### 2-1. Figma MCP

既存接続が使える場合は再利用し、重複登録しない。未導入なら公式Figma Pluginを優先する。

```bash
claude plugin install figma@claude-plugins-official
```

起動中のClaude Codeを再起動し、`/plugin`からFigma Pluginを選択して認証する。Pluginを利用できない環境では、組織の利用方針に従い、手動Remote MCPを代替にする。

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

新しいClaude Codeセッションで`/mcp`から認証・接続を確認する。手動登録ではSkillsは同梱されないため、必要に応じて公式案内に従って導入する。

接続後は、現在利用可能なMCP機能とSkillsを確認し、構造・デザイン値・変数・スクリーンショット・素材の取得に適したものを使う。特定ツール名や固定の呼び出し順を前提にしない。

Figmaは参照元として扱い、承認済みファイルを書き換えない。取得できる範囲を小さな対象ノードで試し、大きなLPはセクション単位に分けて取得する。MCPが返すReact等のコードをそのまま採用せず、デザイン情報として読み、vanilla構成へ実装する。

取得不可なら、正式な書き出し素材・仕様書・参照画像で補完し、何を確認できていないかを記録する。スクリーンショットだけでは正確な書体や余白値を確定できないため、実測扱いにしない。

セットアップの確認元：[Figma公式 Remote MCPセットアップ](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)（2026-10-17確認）。仕様が変わった場合は公式案内を優先する。

### 2-2. ディレクトリ構成

新規案件の標準構成。既存案件では動作中の構成を尊重し、対応するパスをREADMEに記録する。

```text
project/
├─ Figma_Vanilla_ClaudeCode_3Pass_Implementation_Kit.md
├─ CLAUDE.md
├─ README.md
├─ package.json / package-lock.json
├─ references/figma/         # 参照PNG・取得日時・倍率・ノードのmanifest
├─ docs/
│  ├─ project-brief.md
│  ├─ design-inventory.md    # セクション・タイポ・色・レイアウトの実測
│  ├─ spacing.md
│  ├─ spacing-audit.md
│  ├─ assets.md
│  ├─ animations.md
│  ├─ implementation-decisions.md
│  ├─ qa-round1.md
│  ├─ qa-round2.md
│  └─ qa-round3.md
├─ scripts/                 # 必要な比較・撮影・ビルド補助をこの案件で作成
├─ artifacts/qa/            # Round・viewport・セクション別の撮影画像と結果
└─ site/                    # 静的配信のルート
   ├─ index.html
   ├─ assets/               # 使用するカテゴリだけ作る
   │  ├─ fonts/
   │  ├─ logos/
   │  ├─ images/
   │  ├─ illustrations/
   │  ├─ icons/
   │  └─ backgrounds/
   ├─ styles/
   │  ├─ tokens.css
   │  ├─ base.css
   │  ├─ main.css
   │  ├─ components/
   │  └─ sections/
   └─ scripts/
      └─ main.js            # 必要な機能だけESモジュールに分割
```

ブラウザに配信するコードにUIフレームワークは使わない。Node.jsなどの開発・検証用ツールは利用可能。

新規案件で必要なら、既存のpackage.jsonを確認したうえで、以下を開発依存に追加する。未作成の場合のみ先に`npm init -y`する。

```bash
npm install --save-dev serve playwright pixelmatch pngjs sharp @axe-core/playwright
npx playwright install chromium
npx serve site -l 3000
```

標準URLは`http://localhost:3000/`。サブディレクトリ配信はそのベースパスでも検証する。相対URLと末尾スラッシュによる解決先は実際に確認し、サーバ固有の不具合を一般則にしない。

**他案件のスクリプトは存在を前提にしない。** 比較用`compare.mjs`、撮影・画像最適化・CSS結合などが必要なら、この案件で作成し、実行方法と依存をREADMEに書く。未作成のコマンドを「実行済み」と報告しない。CSSの分割読込は利用可能とし、本番で結合する場合は順序・`@layer`・相対URLを保持して配信結果を再検証する。

## このZIPに含まれる範囲

このZIPは実装開始用の指示書・記入テンプレートです。上記の構成図にある`site/`、`scripts/`、`package.json`、比較画像は、Round 1以降に対象Figmaを読み取って作成します。既存コードや検証ツールが付属している前提でコマンドを実行しないでください。
