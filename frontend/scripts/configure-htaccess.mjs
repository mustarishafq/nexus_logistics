import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distHtaccess = path.join(__dirname, '../dist/.htaccess');
const marker = '    # __API_PROXY_RULES__';

function resolveProxyTarget() {
  const explicit = process.env.VITE_API_PROXY_TARGET?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const apiUrl = process.env.VITE_API_URL?.trim();
  if (apiUrl?.startsWith('http')) {
    return new URL(apiUrl).origin;
  }

  return null;
}

const proxyTarget = resolveProxyTarget();
let contents;

try {
  contents = readFileSync(distHtaccess, 'utf8');
} catch {
  console.warn('configure-htaccess: dist/.htaccess not found, skipping');
  process.exit(0);
}

if (!contents.includes(marker)) {
  console.warn('configure-htaccess: proxy marker missing from .htaccess, skipping');
  process.exit(0);
}

const proxyRules = proxyTarget
  ? [
      '    RewriteCond %{REQUEST_URI} ^/api/',
      `    RewriteRule ^api/(.*)$ ${proxyTarget}/api/$1 [P,L]`,
    ].join('\n')
  : '    # API proxy not configured (set VITE_API_URL or VITE_API_PROXY_TARGET at build time)';

writeFileSync(distHtaccess, contents.replace(marker, proxyRules));
console.log(
  proxyTarget
    ? `configure-htaccess: proxying /api/* -> ${proxyTarget}/api/*`
    : 'configure-htaccess: no API proxy target configured'
);
