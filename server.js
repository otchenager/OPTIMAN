/**
 * OPTIMAN Landing — Minimal Node.js Static Server
 * Deploy on Railway: just push and it runs.
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.ico':  'image/x-icon',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
    // Strip query string
    let urlPath = req.url.split('?')[0];

    // Default to index.html
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(__dirname, urlPath);
    const ext      = path.extname(filePath).toLowerCase();
    const mime     = MIME[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            // Serve index.html for any 404 (SPA fallback)
            fs.readFile(path.join(__dirname, 'index.html'), (err2, fallback) => {
                if (err2) {
                    res.writeHead(500);
                    res.end('Internal Server Error');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(fallback);
            });
            return;
        }

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
    console.log(`\n  ⚔  OPTIMAN server running → http://localhost:${PORT}\n`);
});
