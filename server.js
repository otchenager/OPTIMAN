/**
 * OPTIMAN Landing — Minimal Node.js Static Server
 * Локальный запуск: node server.js → http://localhost:3000
 * POST /api/order вызывает ту же логику, что и Vercel-функция api/order.js.
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

// Подхватываем .env, если он есть (без зависимостей).
try {
    fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach((line) => {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
} catch (e) { /* .env не обязателен */ }

const orderHandler = require('./api/order');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.ico':  'image/x-icon',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.webp': 'image/webp',
    '.svg':  'image/svg+xml',
    '.woff2':'font/woff2',
    '.txt':  'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);

    if (urlPath === '/api/order') return orderHandler(req, res);

    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.normalize(path.join(ROOT, urlPath));
    const rel = path.relative(ROOT, filePath);
    const blocked = rel.startsWith('..') || rel.split(path.sep).some((p) => p.startsWith('.')) || rel.startsWith('api' + path.sep);
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    const notFound = () => {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
    };
    if (blocked) return notFound();

    fs.readFile(filePath, (err, data) => {
        if (err) return notFound();
        res.writeHead(200, {
            'Content-Type':  mime,
            'Cache-Control': ext === '.html'
                ? 'no-cache, must-revalidate'
                : 'public, max-age=86400',
        });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n  OPTIMAN server running → http://localhost:${PORT}\n`);
});
