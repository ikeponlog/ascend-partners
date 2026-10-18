// フォーム送信（api/send.php）の受け付け・拒否の確認（D-064）。実際のメールは送らない前提で使う。
// 使い方：
//   1. npm run build のあと、dist/api/config.php だけを確認用に書き換える
//      （mail_from: no-reply@example.com、notify_to: office@example.com、dry_run: true）
//   2. npm run serve:php（別ターミナル）
//   3. node scripts/check-api.mjs [--base http://localhost:3200/]
//   → 送信内容は dist/api/data/outbox/ に保存される。終わったら npm run build で config.php を空欄に戻す。
// 連続送信の制限を確かめるため、最後は 429 になるまで送る（data/rate/ を消すと制限が解ける）。
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const base = new URL(args.base ?? 'http://localhost:3200/');
const endpoint = new URL('api/send.php', base).href;

const post = async (body, headers = {}) => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base.origin, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const result = { type: 'A', checks: ['q02', 'q05', 'unknown-id'], ready: ['q01', 'q03'] };
const cases = [
  ['GET は受け付けない', null, 405, 'method-not-allowed'],
  ['別サイトからの送信', [{ form: 'email' }, { Origin: 'https://other.example.net' }], 403, 'forbidden-origin'],
  ['JSON以外', [{ form: 'email' }, { 'Content-Type': 'text/plain' }], 415, 'unsupported-media-type'],
  ['壊れたJSON', ['{x'], 400, 'invalid-json'],
  ['フォーム種別が不正', [{ form: 'x', email: 'a@example.com', consent: true }], 400, 'invalid-form'],
  ['メール形式が不正', [{ form: 'email', email: 'a@b', consent: true, result }], 400, 'invalid-email'],
  ['ヘッダーへの改行の混入', [{ form: 'email', email: 'a@example.com\r\nBcc: x@example.com', consent: true, result }], 400, 'invalid-email'],
  ['同意なし', [{ form: 'email', email: 'a@example.com', consent: false, result }], 400, 'consent-required'],
  ['メール受取で結果なし', [{ form: 'email', email: 'a@example.com', consent: true }], 400, 'result-required'],
  ['相談で名前なし', [{ form: 'consult', email: 'a@example.com', consent: true }], 400, 'name-required'],
  ['見えない欄に入力（ロボット）', [{ form: 'email', email: 'a@example.com', consent: true, result, website: 'http://spam.example' }], 200, null],
  ['メール受取（お役立ち情報あり）', [{ form: 'email', email: 'user@example.com', consent: true, newsletter: true, result }], 200, null],
  ['30分相談', [{ form: 'consult', name: '山田 太郎', company: '株式会社テスト', email: 'user2@example.com', consent: true, message: '創業前の届出について\n相談したいです', result: { type: 'C', checks: [], ready: ['q01'] } }], 200, null],
];

let failed = 0;
const report = (name, ok, detail) => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}\t${name}\t${detail}`);
};

for (const [name, req, status, error] of cases) {
  const r = req === null ? await fetch(endpoint).then(async (res) => ({ status: res.status, body: await res.json().catch(() => null) })) : await post(...req);
  if (r.status === 503 && r.body?.error === 'not-configured') {
    console.log('FAIL\tconfig.php の送信元・通知先が空です（使い方の 1 を参照）');
    process.exit(1);
  }
  const ok = r.status === status && (error === null ? r.body?.ok === true : r.body?.error === error);
  report(name, ok, `${r.status} ${JSON.stringify(r.body)}`);
}

let limited = null;
for (let i = 0; i < 10 && !limited; i += 1) {
  const r = await post({ form: 'email', email: 'rate@example.com', consent: true, result });
  if (r.status === 429) limited = i;
}
report('連続送信の制限', limited !== null, limited !== null ? `制限まで追加で ${limited} 回成功 → 429` : '10回送っても制限されない');

console.log(`\n${cases.length + 1 - failed}/${cases.length + 1} PASS`);
process.exit(failed ? 1 : 0);
