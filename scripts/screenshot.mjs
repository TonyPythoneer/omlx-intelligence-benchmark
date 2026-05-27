import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 8080;
const ROOT = resolve('app');
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/' || urlPath === '/app/') urlPath = '/app/index.html';
      if (urlPath.startsWith('/app/')) urlPath = urlPath.slice('/app'.length);
      const filePath = join(ROOT, urlPath);
      const data = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolveServer) => server.listen(PORT, '127.0.0.1', () => resolveServer(server)));
}

async function waitReady(url) {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await sleep(500);
  }
  throw new Error(`Server not ready: ${url}`);
}

const server = await startServer();
try {
  await waitReady(`http://localhost:${PORT}/app/`);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/app/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved to ./screenshot.png');
} finally {
  server.close();
}
