// 送信アダプタ。送信先はサイト内の api/send.php（ロリポップ等のPHPで受け取り、メールを送る。D-064）。
// 診断ページ（/diagnosis/）からの相対位置で決めるため、ルート直下でもサブディレクトリでも動く。
// send.php の設定（送信元・通知先）が済むまでは 503 が返り、Figmaの「通信エラー」画面になる（成功を装わない）。
const API = new URL('../api/send.php', location.href).href;
export const ENDPOINTS = {
  email: API, // 診断結果のメール受取
  consult: API, // 30分無料相談の希望送信
};

export class SubmitError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

// ローカル確認専用：localhost / 127.0.0.1 で ?mock=success|error を付けると状態を再現できる（本番ホストでは無効）
function devMock() {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (!local) return null;
  const mock = new URLSearchParams(location.search).get('mock');
  return ['success', 'error', 'pending'].includes(mock) ? mock : null;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function submitForm(kind, payload) {
  const mock = devMock();
  if (mock === 'pending') return new Promise(() => {}); // 送信中の表示確認用（完了しない）
  if (mock) {
    await wait(600);
    if (mock === 'error') throw new SubmitError('mock-error');
    return;
  }
  const url = ENDPOINTS[kind];
  if (!url) throw new SubmitError('not-connected');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new SubmitError(`http-${res.status}`);
  // PHPが動かないサーバーでは send.php の中身がそのまま返ることがあるため、応答の内容まで確認する
  const body = await res.json().catch(() => null);
  if (!body || body.ok !== true) throw new SubmitError('invalid-response');
}
