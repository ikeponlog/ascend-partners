# QA基準と最終納品チェック

結果は`PASS / FAIL / BLOCKED / NOT_TESTED / N/A`で記録します。未実施を合格にせず、N/Aには理由を添えます。

### a11y・性能の基準を混同しない

- WCAG 2.2 AAの操作対象サイズは原則24×24 CSS pxで、間隔等の例外条件がある。44×44pxはより大きな操作領域を目指す場合の値であり、すべてのボタンの見た目を44pxへ変える指示ではない。[W3C：Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- テキストのコントラストは通常4.5:1、大きな文字は3:1を確認する。UIや状態の識別に必要な非テキストのコントラストも該当条件を確認する。ロゴ等の例外は対象を正しく区別する。[W3C：Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)、[W3C：Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- 自動検査の合格だけでWCAG適合を宣言しない。実際の操作と対象要件の確認を組み合わせる。
- Core Web Vitalsの良好な目安はLCP 2.5秒以下、INP 200ms以下、CLS 0.1以下。実ユーザーの75パーセンタイルで評価する指標であり、ローカル1回の数値を本番達成の証拠にしない。[web.dev：Web Vitals](https://web.dev/articles/vitals)

### 最終納品チェック

- [ ] vanilla HTML/CSS/JSで動作し、起動・必要なビルド手順を再現できる。
- [ ] 承認済みコピー・色・書体・画像・情報順序・レイアウトが維持されている。
- [ ] 余白変更が監査表と一致し、意図された例外も残っている。
- [ ] 参照・実装・比較画像と撮影条件が揃い、最終修正後の画像がある。
- [ ] PC/SP・中間幅・BP周辺の実施結果が記録されている。
- [ ] 操作、a11y、エラー、リンク、素材、メタ情報を確認している。
- [ ] 性能結果には測定条件があり、未計測を成功扱いにしていない。
- [ ] 不明リンク、仮素材、未取得フォント、承認事項を明示している。
- [ ] 実装完了と公開可否を分け、公開条件が未解決なら不可と報告している。
