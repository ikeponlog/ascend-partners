// ローカル確認用：dist/ を配信し、.php だけは Node 上の PHP（@php-wasm/node、PHP 8.3）で実行するサーバー（D-064）。
// ロリポップに置く前に、フォーム送信（api/send.php）の動きを確かめるためのもの。PHP のインストールは不要。
// 使い方: npm run serve:php  → http://localhost:3200/
// 注意：この環境ではメールを実際には送れないため、api/config.php の dry_run を true にして確認する
//       （送信内容は dist/api/data/outbox/ に保存される）。config の値は dist 側を編集する（site 側は本番用の空欄のまま）。
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadNodeRuntime, createNodeFsMountHandler } from '@php-wasm/node';
import { PHP, PHPRequestHandler } from '@php-wasm/universal';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT ?? 3200);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

const handler = new PHPRequestHandler({
  phpFactory: async () => {
    const php = new PHP(await loadNodeRuntime('8.3'));
    php.mkdir('/www');
    await php.mount('/www', createNodeFsMountHandler(root));
    return php;
  },
  documentRoot: '/www',
  absoluteUrl: `http://localhost:${port}`,
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    if (path.endsWith('.php')) {
      // .htaccess の代わり：send.php 以外の PHP は直接実行させない
      if (!path.endsWith('/api/send.php')) { res.writeHead(403).end(); return; }
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const r = await handler.request({ url: url.pathname + url.search, method: req.method, headers: req.headers, body: Buffer.concat(chunks) });
      res.writeHead(r.httpStatusCode, Object.fromEntries(Object.entries(r.headers).map(([k, v]) => [k, v.join(', ')])));
      res.end(Buffer.from(r.bytes));
      return;
    }
    // .htaccess の代わり：api/ の中の PHP 以外は見せない
    if (path.includes('/api/')) { res.writeHead(403).end(); return; }
    let file = join(root, path);
    let info = await stat(file).catch(() => null);
    if (info?.isDirectory()) {
      if (!url.pathname.endsWith('/')) { res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end(); return; }
      file = join(file, 'index.html');
      info = await stat(file).catch(() => null);
    }
    if (!info) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch (error) {
    console.error(error);
    res.writeHead(500).end();
  }
});
server.listen(port, () => console.log(`dist + PHP 8.3 (php-wasm): http://localhost:${port}/`));
