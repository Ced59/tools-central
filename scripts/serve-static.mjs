import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/tools-central/browser');
const port = Number(process.argv[3] ?? 4173);

if (!existsSync(root)) {
  console.error(`[static] Build directory not found: ${root}`);
  process.exit(1);
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = normalize(decoded).replace(/^[/\\]+/, '');
  const absolute = resolve(root, relative);
  return absolute === root || absolute.startsWith(`${root}${sep}`) ? absolute : null;
}

function localeNotFound(pathname) {
  const locale = pathname.split('/').filter(Boolean)[0] || 'fr';
  const localizedNotFound = join(root, locale, '404', 'index.html');
  return existsSync(localizedNotFound)
    ? localizedNotFound
    : join(root, 'fr', '404', 'index.html');
}

const server = createServer((request, response) => {
  const pathname = request.url ?? '/';

  if (pathname === '/') {
    response.writeHead(302, { Location: '/fr/' });
    response.end();
    return;
  }

  let filePath = safePath(pathname);
  if (!filePath) {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  let statusCode = 200;
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = localeNotFound(pathname);
    statusCode = 404;
  }

  response.writeHead(statusCode, {
    'Content-Type': contentTypes.get(extname(filePath)) ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[static] Serving ${root} on http://127.0.0.1:${port}`);
});
