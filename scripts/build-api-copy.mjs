// フォーム送信（site/api/send.php）がメール本文に使う結果の文言を、診断のJS（content.js / questions.js）から書き出す。
// 画面とメールで同じ文言を使うため、文言を変えたら再実行する（npm run assets と npm run build で自動実行）。
// 使い方: node scripts/build-api-copy.mjs [出力先（既定 site/api/result-copy.json）]
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] ?? join(root, 'site/api/result-copy.json');
const mod = (p) => import(pathToFileURL(join(root, 'site/scripts/diagnosis', p)).href);
const { RESULT_COPY, PRIORITY_COPY, READY_COPY, READY_COPY_PRE_FOUNDING, UNCONFIRMED } = await mod('content.js');
const { QUESTIONS } = await mod('questions.js');

const flat = (s) => s.replace(/\n/g, '');
const copy = {
  note: '生成物（scripts/build-api-copy.mjs）。site/scripts/diagnosis/content.js と questions.js から作成。直接編集しない',
  questions: Object.fromEntries(QUESTIONS.map((q) => [q.id, { no: q.no, title: flat(q.title) }])),
  results: Object.fromEntries(Object.entries(RESULT_COPY).map(([type, c]) => [type, {
    chip: c.chip,
    heading: flat(c.heading('{n}')),
    next: c.next ? { title: c.next.title, body: c.next.body } : null,
  }])),
  priority: PRIORITY_COPY,
  ready: READY_COPY,
  readyPreFounding: READY_COPY_PRE_FOUNDING,
  unconfirmed: {
    priorityTitle: UNCONFIRMED.priorityTitle('{no}'),
    priorityBody: UNCONFIRMED.priorityBody,
    ready: UNCONFIRMED.ready('{no}'),
  },
  disclaimer: '回答をもとに、確認事項を整理しました。個別の税務判断や法令違反の判定ではありません。',
};
await writeFile(out, `${JSON.stringify(copy, null, 2)}\n`);
console.log(`result copy → ${out}`);
