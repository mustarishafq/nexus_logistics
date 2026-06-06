import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distHtaccess = path.join(__dirname, '../dist/.htaccess');
const envFile = path.join(__dirname, '../.env');
const marker = '    # __API_PROXY_RULES__';

function loadEnvFile() {
  try {
    const lines = readFileSync(envFile, 'utf8').split('\n');
    const values = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separator = trimmed.indexOf('=');
      if (separator === -1) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      values[key] = value;
    }

    return values;
  } catch {
    return {};
  }
}

const fileEnv = loadEnvFile();

function envValue(key) {
  return process.env[key]?.trim() || fileEnv[key]?.trim() || '';
}

function resolveProxyTarget() {
  const explicit = envValue('VITE_API_PROXY_TARGET');
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const apiUrl = envValue('VITE_API_URL');
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
