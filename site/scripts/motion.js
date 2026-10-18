// スクロールに合わせたフェードアップ（2026-10-18 ご依頼。D-047）。
// ・読込時に画面より下にある要素だけを隠して待機させ、画面に入ったら表示する（最初に見えている要素は隠さない＝ちらつかない）。
// ・同じ親の中の兄弟は 80ms ずつ遅らせて順に表示する（最大 4 段）。
// ・動きを減らす設定、または IntersectionObserver がない環境では何もしない（すべて最初から表示）。
// ・JSが読み込めない場合も、何も隠されないため内容はすべて表示される。
// ・ページ末尾付近の要素は判定線（下8%）を越えられないことがあるため、フッターは対象外にし、
//   さらにページの最後までスクロールしたら待機中の要素をすべて表示する（2026-10-18：フッター下段が出ない不具合の修正）。
const TARGETS = [
  '.c-eyebrow:not(.hero *)',
  '.c-heading',
  '.c-lead',
  '.c-numcard',
  '.preview__text',
  '.preview__checklist',
  '.preview__checklist-sp',
  '.preview__note',
  '.preview__card',
  '.preview__people',
  '.preview__result',
  '.why__divider',
  '.why__photo',
  '.why__message',
  '.why__brand-image',
  '.why__brand-message',
  '.cta__message',
  '.cta__start',
  '.cta__divider',
  '.cta__consult-title',
  '.cta__consult-text',
  '.cta__consult',
  '.cta__people',
  '.faq__item',
].join(',');

// 羽のシンボル：PCでカーソルの左右位置（-1〜1）を --tilt-x に渡し、羽を傾ける（D-061。描画は CSS の rotate）
function initSymbolTilt(root) {
  const section = root.querySelector('.problems');
  const symbol = root.querySelector('.problems__symbol');
  if (!section || !symbol || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let frame = 0;
  section.addEventListener('pointermove', (event) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      symbol.style.setProperty('--tilt-x', x.toFixed(3));
    });
  });
  section.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    symbol.style.setProperty('--tilt-x', '0');
  });
}

export function initMotion(root = document) {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  initSymbolTilt(root);

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });

  // ページの最後に置いた目印が見えたら、残っている要素をすべて表示する
  const end = document.createElement('div');
  end.setAttribute('aria-hidden', 'true');
  document.body.append(end);
  new IntersectionObserver(([entry], self) => {
    if (!entry.isIntersecting) return;
    for (const el of root.querySelectorAll('.reveal:not(.is-revealed)')) {
      el.classList.add('is-revealed');
      observer.unobserve(el);
    }
    self.disconnect();
  }).observe(end);

  const fold = window.innerHeight;
  for (const el of root.querySelectorAll(TARGETS)) {
    if (el.getBoundingClientRect().top < fold) continue;
    const siblings = [...el.parentElement.children].filter((c) => c.matches(TARGETS));
    el.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(el), 4) * 80}ms`);
    el.classList.add('reveal');
    observer.observe(el);
  }
}
