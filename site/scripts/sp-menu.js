// SPメニュー（2026-10-18 ご依頼。D-056）：開閉ボタン＋aria-expanded のナビゲーション。
// ・開く：メニューを表示（フェード）、ヘッダーを暗い面用に、背面（本文・フッター）を inert にしてスクロールも止める、最初の項目へフォーカス。
// ・閉じる：開閉ボタン・Escape・項目の選択・PC幅への変更。閉じたらフォーカスを開閉ボタンへ戻す（項目を選んだ場合は移動先に任せる）。
// ・開いている間の Tab / Shift+Tab は、開閉ボタンとメニューの中だけを巡回する。
// ・JSが動かない環境では開閉ボタン自体を表示しない（HTMLで hidden）。
const FOCUSABLE = 'a[href], button:not([disabled])';

export function initSpMenu() {
  const toggle = document.querySelector('.sp-menu-toggle');
  const menu = document.getElementById('sp-menu');
  const header = document.querySelector('.site-header');
  if (!toggle || !menu || !header) return;

  const label = toggle.querySelector('.sp-menu-toggle__label');
  const background = [document.querySelector('main'), document.querySelector('.site-footer')].filter(Boolean);
  const sp = matchMedia('(max-width: 767px)');
  let hideTimer;
  toggle.hidden = false;

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function open() {
    clearTimeout(hideTimer);
    menu.hidden = false;
    // 表示状態（visibility）になってからフォーカスを移す
    requestAnimationFrame(() => {
      menu.classList.add('is-open');
      menu.querySelector(FOCUSABLE)?.focus();
    });
    header.classList.add('is-menu-open');
    document.documentElement.classList.add('is-menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    label.textContent = 'メニューを閉じる';
    for (const el of background) el.inert = true;
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen()) return;
    menu.classList.remove('is-open');
    header.classList.remove('is-menu-open');
    document.documentElement.classList.remove('is-menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    label.textContent = 'メニューを開く';
    for (const el of background) el.inert = false;
    const duration = parseFloat(getComputedStyle(menu).transitionDuration) * 1000 || 0;
    hideTimer = setTimeout(() => { if (!isOpen()) menu.hidden = true; }, duration);
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => (isOpen() ? close() : open()));

  // 項目・ボタンを選んだら閉じる（ページ内リンクはそのまま移動先へスクロール）
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) close({ restoreFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = [toggle, ...menu.querySelectorAll(FOCUSABLE)];
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // PC幅に変わったら閉じる
  sp.addEventListener('change', (event) => { if (!event.matches) close({ restoreFocus: false }); });
}
