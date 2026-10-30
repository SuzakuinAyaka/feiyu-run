import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

const args = process.argv.slice(2);
const root = resolve(args.includes('--dist') ? 'dist' : '.');
const portAt = args.indexOf('--port');
const port = portAt >= 0 ? Number(args[portAt + 1]) : 4173;
const subpath = args.includes('--subpath') ? '/feiyu-run' : '';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (subpath && path === subpath) { res.writeHead(302, { location: subpath + '/' }); return res.end(); }
    if (subpath && !path.startsWith(subpath + '/')) { res.writeHead(404); return res.end(); }
    path = path.slice(subpath.length);
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(root + sep) || path.split('/').some((p) => p.startsWith('.'))) { res.writeHead(403); return res.end(); }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`本地站点：http://127.0.0.1:${port}${subpath}/`));
