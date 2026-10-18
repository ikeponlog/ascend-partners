// 参照画像と実装画像の比較（共通）。原点のみ合わせ、高さ差は灰色(#808080)で埋めて可視化する。
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';

const GRAY = { r: 128, g: 128, b: 128, alpha: 1 };

async function padTo(buf, height) {
  const meta = await sharp(buf).metadata();
  return sharp(buf).extend({ bottom: height - meta.height, background: GRAY }).ensureAlpha().raw().toBuffer();
}

export async function region(file, top, height, width) {
  const { height: H } = await sharp(file).metadata();
  const h = Math.max(1, Math.min(Math.round(height), H - Math.round(top)));
  return sharp(file).extract({ left: 0, top: Math.round(top), width, height: h }).png().toBuffer();
}

// 出力：<outBase>-side.png（参照｜実装｜diff）、-overlay.png（50%重ね）、-diff.png
export async function comparePair(name, refBuf, implBuf, width, outBase) {
  const refH = (await sharp(refBuf).metadata()).height;
  const implH = (await sharp(implBuf).metadata()).height;
  const H = Math.max(refH, implH);
  const a = await padTo(refBuf, H);
  const b = await padTo(implBuf, H);
  const diff = Buffer.alloc(width * H * 4);
  const mismatched = pixelmatch(a, b, diff, width, H, { threshold: 0.1 });
  const raw = { width, height: H, channels: 4 };
  const diffPng = await sharp(diff, { raw }).png().toBuffer();
  const refPng = await sharp(a, { raw }).png().toBuffer();
  const implPng = await sharp(b, { raw }).png().toBuffer();
  const gap = 16;
  await sharp({ create: { width: width * 3 + gap * 2, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: refPng, left: 0, top: 0 }, { input: implPng, left: width + gap, top: 0 }, { input: diffPng, left: (width + gap) * 2, top: 0 }])
    .png().toFile(`${outBase}-side.png`);
  const half = Buffer.from(b);
  for (let i = 3; i < half.length; i += 4) half[i] = 128;
  await sharp(refPng).composite([{ input: half, raw, left: 0, top: 0 }]).png().toFile(`${outBase}-overlay.png`);
  await sharp(diffPng).toFile(`${outBase}-diff.png`);
  return { name, refH, implH, diffPx: implH - refH, diffPct: +(((implH - refH) / refH) * 100).toFixed(2), mismatchPct: +((mismatched / (width * H)) * 100).toFixed(2) };
}
