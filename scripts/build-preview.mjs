// クライアント確認用（GitHub Pages）：dist/ をパスワード入力画面つきの preview/ にする（2026-10-18 ご依頼。D-065）。
// GitHub Pages には Basic 認証がないため、StatiCrypt で各ページの HTML を暗号化し、パスワードを入れると表示する。
// ・保護されるのはページ（HTML）の中身だけ。画像・CSS・JS は URL を知っていれば開ける簡易的な保護。
// ・フォーム送信（api/ の PHP）は GitHub Pages では動かないため含めない（送信すると「送信できませんでした」画面）。
// 使い方: npm run build のあと PREVIEW_PASSWORD=<パスワード> node scripts/build-preview.mjs
//   （GitHub Actions では、リポジトリのシークレット PREVIEW_PASSWORD を使う。.github/workflows/preview.yml）
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { cp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const out = join(root, 'preview');
const password = process.env.PREVIEW_PASSWORD ?? '';

// パスワードがないときは、保護されていないページを作らないよう中止する
if (password.length < 8) {
  console.error('PREVIEW_PASSWORD（8文字以上）が設定されていません。保護なしでは作りません。');
  process.exit(1);
}
if (!(await stat(join(dist, 'index.html')).catch(() => null))) {
  console.error('dist/ がありません。先に npm run build を実行してください。');
  process.exit(1);
}

// 作業用の preview/ へ dist/ を写し（api/ は除く）、StatiCrypt で暗号化しながら本来の preview/ へ書き出す
// （StatiCrypt は入力フォルダ名ごと出力先に作り、HTML 以外はそのまま写す）
const stage = join(tmpdir(), `acend-preview-${process.pid}`);
const stageDir = join(stage, 'preview');
await rm(out, { recursive: true, force: true });
await rm(stage, { recursive: true, force: true });
await cp(dist, stageDir, { recursive: true, filter: (src) => !src.startsWith(join(dist, 'api')) });

// 入力画面：検索エンジンに載せない指定を加える
const templatePath = join(root, 'node_modules/staticrypt/lib/password_template.html');
const template = (await readFile(templatePath, 'utf8')).replace('<head>', '<head>\n        <meta name="robots" content="noindex, nofollow">');
const customTemplate = join(tmpdir(), `staticrypt-template-${process.pid}.html`);
await writeFile(customTemplate, template);

const args = [
  join(root, 'node_modules/staticrypt/cli/index.js'),
  stageDir, '-r', '-d', root,
  '-c', 'false',
  '-s', randomBytes(16).toString('hex'), // ビルドごとに作り直す（同じビルド内の全ページで共通なので、1回入力すれば他のページも開ける）
  '--remember', '30',
  '--short',
  '-t', customTemplate,
  '--template-title', 'STARTUP TAX CHECK（確認用）',
  '--template-instructions', '確認用のページです。お知らせしたパスワードを入力してください。',
  '--template-placeholder', 'パスワード',
  '--template-button', '表示する',
  '--template-error', 'パスワードが違います。',
  '--template-remember', 'この端末で30日間入力を省略する',
  '--template-toggle-show', 'パスワードを表示',
  '--template-toggle-hide', 'パスワードを隠す',
  '--template-color-primary', '#af1717', // --stc-brand
  '--template-color-secondary', '#f5f4f1', // --stc-canvas
];
const result = spawnSync(process.execPath, args, { stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, STATICRYPT_PASSWORD: password } });
await rm(customTemplate, { force: true });
await rm(stage, { recursive: true, force: true });
if (result.status !== 0) process.exit(result.status ?? 1);

// 確認：すべての HTML が暗号化されていること（平文のページが残っていれば失敗）
const pages = ['index.html', 'diagnosis/index.html'];
for (const page of pages) {
  const html = await readFile(join(out, page), 'utf8');
  if (!html.includes('staticryptConfig') || html.includes('<main')) {
    console.error(`暗号化されていません：${page}`);
    process.exit(1);
  }
}
await writeFile(join(out, '.nojekyll'), '');
console.log(`preview/ を作成（${pages.length}ページを暗号化、api/ は除外）`);
