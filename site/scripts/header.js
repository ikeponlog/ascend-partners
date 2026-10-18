// 追従ヘッダー（2026-10-18 ご依頼。D-046）：少しでもスクロールしたら is-scrolled を付け、ヘッダーを縮めて影を出す。
// 判定は最上部に置いた1pxの目印が画面外に出たかどうか（IntersectionObserver。スクロールのたびの計算をしない）。
export function initHeader(header = document.querySelector('.site-header')) {
  if (!header || !('IntersectionObserver' in window)) return;
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none;';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-scrolled', !entry.isIntersecting);
  }).observe(sentinel);
}
