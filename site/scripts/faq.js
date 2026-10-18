// STC v3 / FAQ（69:2244）：button + aria-expanded、Enter/Spaceで開閉（Figmaの部品説明どおり）。
// 2026-10-18 ご依頼で開閉式に（D-048）：全項目に回答欄（.faq__answer-inner）を持たせ、回答が空の項目だけ開閉不可にする。
// 回答文を HTML に入れればそのまま開閉できる。開閉の高さの動きは CSS（faq.css）。
// JSが動かない場合も、初期HTMLで開いている項目（Q1）の回答は表示されたまま。
const hasAnswer = (panel) => panel?.querySelector('.faq__answer-inner')?.textContent.trim().length > 0;

export function initFaq(root = document) {
  for (const list of root.querySelectorAll('[data-faq]')) {
    for (const button of list.querySelectorAll('.faq__button')) {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      if (hasAnswer(panel)) continue;
      // 回答文が未入力の項目（BLOCKER B-002）は開閉しない。読み上げでは「無効」と伝わる
      button.setAttribute('aria-disabled', 'true');
      button.removeAttribute('aria-controls');
      button.closest('.faq__item')?.classList.add('is-empty');
    }

    list.addEventListener('click', (event) => {
      const button = event.target.closest('.faq__button');
      if (!button || !list.contains(button) || button.getAttribute('aria-disabled') === 'true') return;
      const item = button.closest('.faq__item');
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      item?.classList.toggle('is-open', !expanded);
    });
  }
}
