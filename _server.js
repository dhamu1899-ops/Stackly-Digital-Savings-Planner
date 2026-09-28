const http = require('http');
const fs = require('fs');
const path = require('path');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(__dirname, p);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404, {'Content-Type': 'text/plain'}); res.end('not found'); return; }
    res.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'});
    res.end(d);
  });
}).listen(8123, () => console.log('server up on 8123'));
