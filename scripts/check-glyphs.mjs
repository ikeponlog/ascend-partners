// 文字欠け・意図しない代替フォントの確認：全ページ・診断の全画面で、各要素の描画フォント（CDP CSS.getPlatformFontsForNode）を調べ、
// Webフォント以外（端末のフォント）で描画された文字があれば一覧にする。dist（サブセット後）の確認に使う。
// 使い方: node scripts/check-glyphs.mjs [http://localhost:3100/]
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:3100/';
const A = { q01: 'within3m', q02: 'partial', q03: 'notyet', q04: 'partial', q05: 'partial', q06: 'partial', q07: 'partial', q08: 'partial', q09: 'equity', q10: 'partial', q11: 'partial', q12: 'partial' };
const b = await chromium.launch(); const sys = new Map(); let nodes = 0;
async function scan(p, label) {
  await p.evaluate(() => document.fonts.ready);
  const cdp = await p.context().newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'body *' });
  for (const nodeId of nodeIds) {
    let r; try { r = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }); } catch { continue; }
    if (!r.fonts.length) continue; nodes++;
    for (const f of r.fonts) if (!f.isCustomFont) { const { node } = await cdp.send('DOM.describeNode', { nodeId }); const k = label + ' ' + node.localName + '.' + (node.attributes?.[node.attributes.indexOf('class') + 1] ?? '') + ' → ' + f.familyName; sys.set(k, (sys.get(k) ?? 0) + f.glyphCount); }
  }
}
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(base, { waitUntil: 'networkidle' }); await scan(p, 'lp' + w);
  await p.goto(base + 'diagnosis/', { waitUntil: 'networkidle' });
  for (const s of ['q01', 'q05', 'q09', 'skip', 'abort', 'result', 'email', 'consult', 'sent', 'network', 'received']) {
    await p.evaluate(({ s, A }) => { const { state, go } = window.__dx; state.answers = s === 'skip' ? { ...A, q09: 'none' } : { ...A }; state.abortReturn = 'q01'; state.networkKind = 'email'; go(s); }, { s, A });
    await scan(p, 'dx-' + s + w);
  }
  await p.close();
}
await b.close();
console.log("text nodes scanned", nodes); if (sys.size) process.exitCode = 1; console.log(sys.size ? [...sys].map(([k, v]) => k + ' (' + v + ' glyphs)').join('\n') : 'all glyphs rendered with web fonts');
