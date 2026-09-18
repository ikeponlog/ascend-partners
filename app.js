const questions = [
  { category: "tax", label: "税務体制", text: "月次決算は、月末からどれくらいで確定していますか？", options: [["翌月10営業日以内", 4], ["翌月末まで", 2], ["2か月以上、または未確定", 0]] },
  { category: "tax", label: "税務体制", text: "税務・会計の重要事項を、専門家と定期的に確認できていますか？", options: [["毎月または四半期ごとに確認", 4], ["必要なときだけ確認", 2], ["相談先が不明確・ほぼ確認していない", 0]] },
  { category: "tax", label: "税務体制", text: "申告・届出・証憑の管理ルールは社内で共有されていますか？", options: [["担当・期限・保管方法が明確", 4], ["一部は決まっている", 2], ["担当者任せ、または未整備", 0]] },
  { category: "runway", label: "資金繰り", text: "今後12か月の資金繰り予測を更新していますか？", options: [["毎月更新している", 4], ["調達や予算策定時のみ更新", 2], ["作成していない", 0]] },
  { category: "runway", label: "資金繰り", text: "現在のバーンレートとランウェイを即答できますか？", options: [["月次で把握し、前提も説明できる", 4], ["概算は把握している", 2], ["正確には把握していない", 0]] },
  { category: "runway", label: "資金繰り", text: "経営判断に必要なKPIと予実差を定期的に確認していますか？", options: [["月次で確認し、打ち手に反映", 4], ["数値はあるが活用が限定的", 2], ["定期確認していない", 0]] },
  { category: "capital", label: "資本政策", text: "株主名簿と完全希薄化後の持株比率を一元管理していますか？", options: [["常に最新で、関係者と共有できる", 4], ["資料はあるが更新が不定期", 2], ["最新状態が分からない", 0]] },
  { category: "capital", label: "資本政策", text: "次回調達後の希薄化と持株比率を複数条件で試算していますか？", options: [["複数シナリオで試算済み", 4], ["概算のみ確認済み", 2], ["まだ試算していない", 0]] },
  { category: "capital", label: "資本政策", text: "資金調達時の税務・会計・契約上の論点を事前に整理していますか？", options: [["専門家を交えて整理済み", 4], ["主要論点のみ把握", 2], ["これから確認する", 0]] },
  { category: "so", label: "SO準備", text: "ストックオプションの導入目的と対象者を明文化していますか？", options: [["採用・報酬戦略と連動して明確", 4], ["対象者のイメージはある", 2], ["まだ検討していない", 0]] },
  { category: "so", label: "SO準備", text: "株価算定と税制適格要件を専門家と確認していますか？", options: [["発行条件と合わせて確認済み", 4], ["概要のみ確認済み", 2], ["未確認、または分からない", 0]] },
  { category: "so", label: "SO準備", text: "発行後の取締役会・株主総会・契約・台帳管理まで運用設計がありますか？", options: [["担当と手順まで決まっている", 4], ["必要書類は把握している", 2], ["運用は未設計", 0]] }
];

const categoryMeta = {
  tax: { label: "税務体制", strength: "月次・税務運用の基盤が整っています。", caution: "申告・届出や月次決算の運用を標準化しましょう。", action: "月次締め日と税務カレンダー、証憑管理ルールを1枚に整理する" },
  runway: { label: "資金繰り", strength: "ランウェイを軸に先を見た判断ができています。", caution: "資金残高だけでなく、将来のランウェイを可視化する余地があります。", action: "12か月資金繰り表を作成し、バーンレートと予実差を毎月更新する" },
  capital: { label: "資本政策", strength: "調達後の持株比率と希薄化を見通せています。", caution: "次回調達前に、完全希薄化後の持株比率と複数シナリオを確認しましょう。", action: "最新のCap Tableを基に次回調達後の希薄化シミュレーションを行う" },
  so: { label: "SO準備", strength: "SOの目的・税務・運用が一貫して整理されています。", caution: "SOは発行直前ではなく、採用計画と株価算定から逆算して準備しましょう。", action: "SOの対象・目的・発行時期を定め、株価算定と税制適格要件を確認する" }
};

const state = { step: 0, answers: Array(questions.length).fill(null) };
const dialog = document.querySelector("[data-diagnostic]");
const questionPanel = document.querySelector("[data-question-panel]");
const questionError = document.querySelector("[data-question-error]");
const prevButton = document.querySelector("[data-prev]");
const nextButton = document.querySelector("[data-next]");
const questionControls = document.querySelector("[data-question-controls]");
const leadStep = document.querySelector("[data-lead-step]");
const resultStep = document.querySelector("[data-result]");
const progress = document.querySelector("[data-progress]");
const progressWrap = document.querySelector("[data-progress-wrap]");
const stepLabel = document.querySelector("[data-step-label]");
const categoryLabel = document.querySelector("[data-category-label]");
const diagnosticBody = document.querySelector("[data-diagnostic-body]");

function renderQuestion() {
  const question = questions[state.step];
  const selected = state.answers[state.step];
  questionPanel.className = "question-panel";
  questionPanel.innerHTML = `
    <fieldset>
      <legend tabindex="-1">${question.text}</legend>
      <div class="option-list">
        ${question.options.map(([label, score], index) => `<label class="option"><input type="radio" name="question-${state.step}" value="${score}" data-option-index="${index}" ${selected?.index === index ? "checked" : ""} required><span>${label}</span></label>`).join("")}
      </div>
    </fieldset>`;
  stepLabel.textContent = `QUESTION ${String(state.step + 1).padStart(2, "0")} / ${questions.length}`;
  categoryLabel.textContent = question.label;
  progress.value = state.step + 1;
  progress.max = questions.length + 1;
  prevButton.disabled = state.step === 0;
  nextButton.textContent = state.step === questions.length - 1 ? "基本情報の入力へ" : "次へ";
  questionError.hidden = true;
  requestAnimationFrame(() => questionPanel.querySelector("legend")?.focus?.());
}

function captureAnswer() {
  const checked = questionPanel.querySelector("input:checked");
  if (!checked) return false;
  state.answers[state.step] = { score: Number(checked.value), index: Number(checked.dataset.optionIndex) };
  return true;
}

function showLeadStep() {
  document.querySelector("#diagnostic-form").hidden = true;
  leadStep.hidden = false;
  progress.value = questions.length + 1;
  stepLabel.textContent = "FINAL STEP";
  categoryLabel.textContent = "基本情報";
  diagnosticBody.scrollTop = 0;
  leadStep.querySelector("input")?.focus();
}

function openDiagnostic() {
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("is-dialog-open");
  document.querySelector("#diagnostic-form").hidden = false;
  leadStep.hidden = true;
  resultStep.hidden = true;
  progressWrap.hidden = false;
  renderQuestion();
}

function closeDiagnostic() {
  dialog.close();
  document.body.classList.remove("is-dialog-open");
}

function resetDiagnostic() {
  state.step = 0;
  state.answers.fill(null);
  document.querySelector("#lead-form").reset();
  openDiagnostic();
}

document.querySelectorAll("[data-start-check]").forEach(button => button.addEventListener("click", openDiagnostic));
document.querySelector("[data-close-diagnostic]").addEventListener("click", closeDiagnostic);
dialog.addEventListener("click", event => { if (event.target === dialog) closeDiagnostic(); });
dialog.addEventListener("close", () => document.body.classList.remove("is-dialog-open"));
nextButton.addEventListener("click", () => {
  if (!captureAnswer()) { questionError.hidden = false; questionPanel.querySelector("input")?.focus(); return; }
  if (state.step === questions.length - 1) showLeadStep();
  else { state.step += 1; renderQuestion(); diagnosticBody.scrollTop = 0; }
});
prevButton.addEventListener("click", () => { captureAnswer(); if (state.step > 0) { state.step -= 1; renderQuestion(); diagnosticBody.scrollTop = 0; } });
document.querySelector("[data-lead-back]").addEventListener("click", () => { leadStep.hidden = true; document.querySelector("#diagnostic-form").hidden = false; renderQuestion(); });
document.querySelector("[data-restart]").addEventListener("click", resetDiagnostic);

function rankFor(score) { return score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D"; }
function rankLabel(rank) { return ({ A: "優良", B: "概ね良好", C: "要改善", D: "要整備" })[rank]; }

function buildResult(lead) {
  const categoryScores = { tax: 0, runway: 0, capital: 0, so: 0 };
  state.answers.forEach((answer, index) => { categoryScores[questions[index].category] += answer.score; });
  const totalRaw = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
  const total = Math.round((totalRaw / 48) * 100);
  const totalRank = rankFor(total);
  const sorted = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 2).map(([key]) => categoryMeta[key].strength);
  const weakCategories = sorted.filter(([, raw]) => (raw / 12) * 100 < 80);
  const cautions = weakCategories.length
    ? weakCategories.slice(-2).reverse().map(([key]) => categoryMeta[key].caution)
    : ["現時点で大きな未整備は見当たりません。調達・組織変更の前後で定期的に再確認してください。"];
  const actions = weakCategories.length
    ? weakCategories.slice(-3).reverse().map(([key]) => categoryMeta[key].action)
    : ["次回調達やSO発行などの重要イベント前に、専門家レビューを実施する", "四半期ごとに4領域の運用状況を再確認する"];
  document.querySelector("[data-total-score]").textContent = total;
  document.querySelector("[data-total-rank]").textContent = `RANK ${totalRank} / ${rankLabel(totalRank)}`;
  document.querySelector("[data-result-stage]").textContent = lead.stage;
  document.querySelector("[data-result-summary]").textContent = totalRank === "A" ? "基盤は全体として良好です。次の成長段階に向けて、制度と数値の精度をさらに高めるフェーズです。" : totalRank === "B" ? "基本的な体制は整いつつあります。評価の低い領域を次回調達前に優先して補強しましょう。" : "成長に先回りして整えたい論点があります。優先順位をつけ、低い領域から小さく仕組み化しましょう。";
  document.querySelector("[data-result-categories]").innerHTML = Object.entries(categoryScores).map(([key, raw]) => {
    const percent = Math.round((raw / 12) * 100); const rank = rankFor(percent);
    return `<div class="result-category"><p><span>${categoryMeta[key].label}（${rank} ${rankLabel(rank)}）</span><b>${percent}%</b></p><i><span style="width:${percent}%"></span></i></div>`;
  }).join("");
  document.querySelector("[data-strength-list]").innerHTML = strengths.map(item => `<li>${item}</li>`).join("");
  document.querySelector("[data-caution-list]").innerHTML = cautions.map(item => `<li>${item}</li>`).join("");
  document.querySelector("[data-action-list]").innerHTML = actions.map(item => `<li>${item}</li>`).join("");
  return { total, totalRank, categoryScores, lead, answers: state.answers.map(item => item.score), completedAt: new Date().toISOString() };
}

// Safe integration boundary: replace this adapter with an approved endpoint implementation.
// No network request is made by the current implementation.
const leadAdapter = {
  async submit(payload) {
    window.dispatchEvent(new CustomEvent("startup-tax-check:completed", { detail: payload }));
    return { ok: true, mode: "local-only" };
  }
};

document.querySelector("#lead-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const error = document.querySelector("[data-lead-error]");
  if (!form.checkValidity()) { error.hidden = false; form.reportValidity(); return; }
  error.hidden = true;
  const lead = Object.fromEntries(new FormData(form).entries());
  const payload = buildResult(lead);
  const response = await leadAdapter.submit(payload);
  leadStep.hidden = true;
  resultStep.hidden = false;
  progressWrap.hidden = true;
  document.querySelector("[data-submission-status]").textContent = response.mode === "local-only" ? "診断結果はこのブラウザ内で生成されました。外部への送信は行っていません。" : "診断結果を保存しました。";
  diagnosticBody.scrollTop = 0;
  document.querySelector("#result-title")?.focus?.();
});

document.querySelectorAll("[data-book-consultation]").forEach(button => button.addEventListener("click", () => {
  const configuredUrl = document.documentElement.dataset.consultationUrl;
  if (configuredUrl) window.location.assign(configuredUrl);
  else {
    document.querySelectorAll("[data-connection-note]").forEach(note => note.hidden = false);
    const status = document.querySelector("[data-submission-status]");
    if (status) status.textContent = "相談予約URLは未接続です。運用開始前に承認済みの予約先を設定してください。";
  }
}));

document.querySelectorAll(".faq-item button").forEach(button => button.addEventListener("click", () => {
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  document.getElementById(button.getAttribute("aria-controls")).hidden = expanded;
}));

const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  menuButton.setAttribute("aria-label", open ? "メニューを開く" : "メニューを閉じる");
  menu.classList.toggle("is-open", !open);
});
menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => { menuButton.setAttribute("aria-expanded", "false"); menu.classList.remove("is-open"); }));

const header = document.querySelector("[data-header]");
const navLinks = [...document.querySelectorAll(".global-nav a")];
const sections = navLinks.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
const mobileCta = document.querySelector("[data-mobile-cta]");
let ticking = false;
function updateScrollState() {
  const y = window.scrollY;
  header.classList.toggle("is-scrolled", y > 24);
  const active = [...sections].reverse().find(section => section.getBoundingClientRect().top <= 140);
  navLinks.forEach(link => link.toggleAttribute("aria-current", active && link.getAttribute("href") === `#${active.id}`));
  const faq = document.querySelector("#faq").getBoundingClientRect();
  const footer = document.querySelector(".site-footer").getBoundingClientRect();
  mobileCta.classList.toggle("is-hidden", faq.top < innerHeight || footer.top < innerHeight || dialog.open);
  ticking = false;
}
window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(updateScrollState); ticking = true; } }, { passive: true });
updateScrollState();

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((node, index) => {
    const group = node.closest(".stagger-group");
    if (group) node.style.transitionDelay = `${[...group.children].indexOf(node) * 60}ms`;
    revealObserver.observe(node);
  });
} else document.querySelectorAll(".reveal").forEach(node => node.classList.add("is-visible"));

if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
renderQuestion();
