const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 5500;
const ROOT = __dirname;
const MIME = {
    '.html': 'text/html; charset=UTF-8',
    '.css':  'text/css; charset=UTF-8',
    '.js':   'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.png':  'image/png',
};
http.createServer((req, res) => {
    let safePath = req.url.split('?')[0].split('#')[0];
    if (safePath === '/' || safePath === '') safePath = '/index.html';
    const filePath = path.normalize(path.join(ROOT, safePath));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('404: ' + safePath); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
    });
}).listen(PORT, () => console.log('WMS Frontend listening at http://localhost:' + PORT));