// 正式素材・Figma書き出しから、site/assets 配下の配信用素材を生成する。
// 元ファイルは assets/（提供素材）と references/figma/assets-raw/（Figma取得）に残し、ここでは上書きしない。
// 使い方: npm run assets
import { mkdir, copyFile, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = join(root, 'references/figma/assets-raw');
const provided = join(root, 'assets');
const out = join(root, 'site/assets');

const jobs = [
  // [出力, 入力, 幅, 形式, 品質]
  ['images/hero-bg-pc.webp', join(provided, 'images/都市を背景にした企業インタビュー.png'), 2113, 'webp', 82],
  // SPヒーロー：2026-10-18 ご依頼で差し替え（assets/images/hero-sp-20261018.webp 825×1906。旧：Figma e5394）。D-058
  ['images/hero-bg-sp-780.webp', join(provided, 'images/hero-sp-20261018.webp'), 780, 'webp', 82],
  ['images/hero-bg-sp-825.webp', join(provided, 'images/hero-sp-20261018.webp'), 825, 'webp', 82],
  // CTAの人物（2026-10-18 ご依頼。切り抜き・透過 2000×1091。表示はPC 573幅・SP 369幅 → 2倍表示に足りる1146幅）。D-063
  ['images/cta-people.webp', join(provided, 'images/cta-people-20261018.webp'), 1146, 'webp', 84],
  ['images/why-profile.webp', join(provided, 'images/about_img_02.jpg'), 1400, 'webp', 82],
  ['images/why-brand.webp', join(provided, 'images/about_img_01.jpg.png'), 1120, 'webp', 90],
  ['backgrounds/cta-texture.webp', join(raw, 'cta-bg-9cc9c.png'), 2880, 'webp', 70],
  ['backgrounds/footer-texture.webp', join(raw, 'footer-bg-a71ac.png'), 2880, 'webp', 70],
  // TAX CHECKロゴ（Figmaの画像塗り2種。ヘッダー/ヒーロー用と、CTA用のトリミング違い）
  ['logos/taxcheck-fill.webp', join(raw, 'taxcheck-f1f25.png'), 520, 'webp', 92],
  ['logos/taxcheck-crop.webp', join(raw, 'taxcheck-a5bff.png'), 540, 'webp', 92],
];

for (const [dest, src, width, format, quality] of jobs) {
  const file = join(out, dest);
  await mkdir(dirname(file), { recursive: true });
  const info = await sharp(src).resize({ width, withoutEnlargement: true })[format]({ quality, effort: 6 }).toFile(file);
  console.log(`${dest}\t${info.width}x${info.height}\t${(info.size / 1024).toFixed(0)}KB`);
}

// 2026-10-18 Figma更新：YOUR NEXT ACTION（58:4466 / 58:4693）の背景と人物写真（D-051）
// 背景：PC（0f238）とSP（4ebf2）は同じ画像（平均差0.17）。SPはFigmaの表示範囲（元画像 x 2685〜3157、高さ全体）を中心に
// 1400px幅で切り出し、object-position 50% で同じ位置になるようにする（767px幅まで表示範囲に収まる）
{
  const v2 = join(raw, 'v2-20261018');
  const jobsV2 = [
    ['backgrounds/preview-bg-pc.webp', sharp(join(v2, 'preview-bg-pc-0f238.png')).resize({ width: 2880 }), 72],
    ['backgrounds/preview-bg-sp.webp', sharp(join(v2, 'preview-bg-pc-0f238.png')).extract({ left: 2221, top: 0, width: 1400, height: 2048 }).resize({ width: 1000 }), 72],
    // 人物（切り抜き・透過PNG 3205×3072）：表示はPC 501×511 / SP 341×347。2倍表示に足りる1050幅
    ['images/preview-people.webp', sharp(join(v2, 'preview-people-1b576.png')).resize({ width: 1050 }), 82],
  ];
  for (const [dest, pipeline, quality] of jobsV2) {
    const file = join(out, dest);
    await mkdir(dirname(file), { recursive: true });
    const info = await pipeline.webp({ quality, alphaQuality: 90, effort: 6 }).toFile(file);
    console.log(`${dest}\t${info.width}x${info.height}\t${(info.size / 1024).toFixed(0)}KB`);
  }
}

// favicon（2026-10-18 ご依頼：公式サイト ascend-tax.jp の favicon をコピー。assets/favicon に原本。D-057）
for (const name of ['favicon-32x32.png', 'favicon-180x180.png', 'favicon-192x192.png']) {
  await mkdir(join(out, 'favicon'), { recursive: true });
  await copyFile(join(provided, 'favicon', name), join(out, 'favicon', name));
  console.log(`favicon/${name}\tcopied`);
}

// SVG（正式ロゴ・シンボル・Figmaアイコン）は内容を変えずにコピー
const svgs = [
  ['logos/logo-reverse.svg', join(provided, 'logos/logo_yoko_color_nega.svg')],
  ['logos/acend-symbol.svg', join(provided, 'logos/acendsymbol.svg')],
  ['icons/arrow-capsule-brand.svg', join(raw, 'arrow-capsule-2c76f.svg')],
  ['icons/arrow-capsule-white.svg', join(raw, 'arrow-capsule-6af95.svg')],
  ['icons/arrow-right.svg', join(raw, 'arrow-right-pc-bfd9e.svg')],
];
for (const [dest, src] of svgs) {
  await mkdir(dirname(join(out, dest)), { recursive: true });
  await copyFile(src, join(out, dest));
  console.log(`${dest}\tcopied`);
}

// logo.svg は342幅の書き出しで右側22pxが空白。ロゴ本体（320×35）に合わせてviewBoxのみ切り詰める
const logo = await readFile(join(provided, 'logos/logo.svg'), 'utf8');
const trimmed = logo.replace('width="342" height="35" viewBox="0 0 342 35"', 'width="320" height="35" viewBox="0 0 320 35"');
if (trimmed === logo) throw new Error('logo.svg のviewBoxが想定と異なります');
await writeFile(join(out, 'logos/logo.svg'), trimmed);
console.log('logos/logo.svg\tviewBox trimmed to 320x35');

// フォント（OFL-1.1, @fontsource-variable）をセルフホスト用にコピー
const fonts = ['noto-sans-jp', 'noto-serif-jp', 'eb-garamond', 'inter', 'lexend-deca'];
for (const name of fonts) {
  const pkg = join(root, 'node_modules/@fontsource-variable', name);
  const dest = join(out, 'fonts', name);
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  await cp(join(pkg, 'files'), join(dest, 'files'), { recursive: true, filter: (f) => !f.endsWith('.woff') });
  await copyFile(join(pkg, 'index.css'), join(dest, 'index.css'));
  await copyFile(join(pkg, 'LICENSE'), join(dest, 'LICENSE'));
  console.log(`fonts/${name}\tcopied`);
}
