// 納品用ビルド：site/ を dist/ へ複製し、表示を変えずに読込を軽くする。
// 使い方: node scripts/build.mjs
// 1. CSS結合：styles/main.css と styles/diagnosis.css の @import を記述順のまま展開して1ファイルにする。
//    @layer の宣言順・各ファイル内の @layer ブロックはそのまま（展開のみ）。url() は使っていない（使った場合は停止する）。
// 2. 和文フォントのサブセット：Noto Sans JP / Noto Serif JP の分割ファイルのうち、サイト内の文字（HTML・JS・CSSの全文字）を
//    含むものだけを、使用文字に絞った派生ファイルにする。元の @font-face はすべて残し（使用文字以外＝入力文字などの代替）、
//    派生ファイルの @font-face を後ろに追加する（同じファミリーで unicode-range が重なる場合、後に定義した方が先に使われる）。
//    可変軸（wght）は保持する。グリフは元ファイルと同一（再撮影で比較して確認する）。
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'site');
const dist = join(root, 'dist');
const log = [];

// フォーム送信（api/send.php）が使う結果の文言を、診断のJSから書き出してから複製する（D-064）
await import('./build-api-copy.mjs');

await rm(dist, { recursive: true, force: true });
await cp(src, dist, { recursive: true });

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}

// 1. CSS結合
async function inline(file, seen = new Set()) {
  if (seen.has(file)) throw new Error(`circular @import: ${file}`);
  seen.add(file);
  const css = await readFile(file, 'utf8');
  if (/url\((?!['"]?[\w/.-]+\.css)/.test(css.replace(/@import url\([^)]*\);/g, ''))) throw new Error(`url() in ${file}: パスの書き換えが必要`);
  let outCss = '';
  let last = 0;
  for (const m of css.matchAll(/@import url\(['"]?([^'")]+)['"]?\);\n?/g)) {
    outCss += css.slice(last, m.index);
    const child = join(dirname(file), m[1]);
    outCss += `/* ---- ${relative(join(src, 'styles'), join(src, relative(dist, child)))} ---- */\n${await inline(child, seen)}\n`;
    last = m.index + m[0].length;
  }
  return outCss + css.slice(last);
}
const bundled = new Set();
for (const entry of ['styles/main.css', 'styles/diagnosis.css']) {
  const file = join(dist, entry);
  const before = (await readFile(file, 'utf8'));
  for (const m of before.matchAll(/@import url\(['"]?([^'")]+)['"]?\)/g)) bundled.add(join(dirname(file), m[1]));
  const css = `/* 生成物（scripts/build.mjs）：${entry} の @import を記述順に展開。編集は site/ 側で行う */\n${await inline(file)}`;
  await writeFile(file, css);
  log.push(`css ${entry}: ${(css.length / 1024).toFixed(1)}KB（${before.match(/@import/g).length}ファイルを結合）`);
}
// 結合済みの部品CSSは配信しない（どこからも参照されない）
for (const f of bundled) await rm(f, { force: true });
for (const d of ['styles/components', 'styles/sections']) {
  const left = await readdir(join(dist, d)).catch(() => []);
  if (!left.length) await rm(join(dist, d), { recursive: true, force: true });
}

// 2. 和文フォントのサブセット
const textFiles = (await walk(src)).filter((f) => /\.(html|js|css)$/.test(f) && !f.includes('/assets/fonts/'));
const used = new Set();
for (const f of textFiles) {
  const text = await readFile(f, 'utf8');
  for (const ch of text) used.add(ch.codePointAt(0));
  // エスケープで書かれた文字（CSS content: '\\2212'、JS '\\u2212'）も含める
  for (const m of text.matchAll(/\\u\{?([0-9a-fA-F]{4,6})\}?|\\([0-9a-fA-F]{1,6})(?![0-9a-fA-F])/g)) used.add(parseInt(m[1] ?? m[2], 16));
}
for (let c = 0x20; c <= 0x7e; c++) used.add(c);

function parseRange(range) {
  const set = new Set();
  for (const part of range.split(',').map((s) => s.trim().replace(/^U\+/i, ''))) {
    const [a, b] = part.split('-').map((h) => parseInt(h.replace(/\?/g, '0'), 16));
    const end = b ?? (part.includes('?') ? parseInt(part.replace(/\?/g, 'f'), 16) : a);
    for (let c = a; c <= end; c++) set.add(c);
  }
  return set;
}
function toRange(codes) {
  const s = [...codes].sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < s.length; i++) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    parts.push(i === j ? `U+${s[i].toString(16)}` : `U+${s[i].toString(16)}-${s[j].toString(16)}`);
    i = j;
  }
  return parts.join(',');
}

for (const family of ['noto-sans-jp', 'noto-serif-jp']) {
  const dir = join(dist, 'assets/fonts', family);
  const cssFile = join(dir, 'index.css');
  const css = await readFile(cssFile, 'utf8');
  const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]);
  let added = '';
  let origBytes = 0;
  let subBytes = 0;
  let count = 0;
  for (const body of faces) {
    const url = body.match(/url\(\.\/files\/([^)]+)\)/)[1];
    const range = parseRange(body.match(/unicode-range:\s*([^;]+);/)[1]);
    const chars = [...range].filter((c) => used.has(c));
    if (!chars.length) continue;
    const input = await readFile(join(dir, 'files', url));
    const text = String.fromCodePoint(...chars);
    const output = await subsetFont(input, text, { targetFormat: 'woff2' });
    const name = url.replace(/\.woff2$/, '-site.woff2');
    await writeFile(join(dir, 'files', name), output);
    origBytes += input.length;
    subBytes += output.length;
    count++;
    const decl = body
      .replace(/src:[^;]+;/, `src: url(./files/${name}) format('woff2-variations');`)
      .replace(/unicode-range:[^;]+;/, `unicode-range: ${toRange(chars)};`);
    added += `@font-face {${decl}}\n`;
  }
  // index.css（描画を止めるCSS）は派生ファイルだけにして軽くする。元の全分割は別名ファミリー「… Full」として full.css へ移し、
  // 入力欄のある診断ページだけが描画を止めない位置で読み込む（トークンのフォント指定で 'Noto … Variable' の次に置いている）
  const fullName = css.match(/font-family:\s*'([^']+)'/)[1];
  await writeFile(join(dir, 'full.css'), `/* 生成物（scripts/build.mjs）：元の全分割（使用文字以外の代替）。ファミリー名「${fullName} Full」 */\n${css.replaceAll(`'${fullName}'`, `'${fullName} Full'`)}`);
  await writeFile(cssFile, `/* 生成物（scripts/build.mjs）：サイト内の使用文字だけの派生ファイル（元：@fontsource-variable/${family}） */\n${added}`);
  log.push(`font ${family}: 使用中の分割 ${count}件 ${(origBytes / 1024).toFixed(0)}KB → ${(subBytes / 1024).toFixed(0)}KB`);
}

// 入力欄のある診断ページだけ、全文字の代替CSSを描画を止めない方法で読み込む
{
  const file = join(dist, 'diagnosis/index.html');
  const html = await readFile(file, 'utf8');
  // media="print" で読み込み、読込後に all へ切り替える：描画とモジュールの実行を待たせない（本文末尾の通常のCSSはスクリプト実行を止める）
  const links = ['noto-sans-jp', 'noto-serif-jp'].map((f) => `  <link rel="stylesheet" href="../assets/fonts/${f}/full.css" media="print" onload="this.media='all'">`).join('\n');
  await writeFile(file, html.replace('</body>', `  <!-- 生成物（scripts/build.mjs）：入力文字など使用文字以外の代替フォント -->\n${links}\n</body>`));
}

log.push(`使用文字 ${used.size}字（${textFiles.length}ファイルから収集）`);
await writeFile(join(dist, 'BUILD.txt'), `Built ${new Date().toISOString()} from site/ by scripts/build.mjs\n${log.join('\n')}\n`);
console.log(log.join('\n'));
