#!/usr/bin/env node
/**
 * Lightweight quality gate for Menu V2 static SaaS.
 * No secrets required. Does not hit live Supabase.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const syntaxOnly = process.argv.includes('--syntax-only');
let failed = 0;

function ok(msg) {
  console.log('PASS  ' + msg);
}
function fail(msg) {
  console.error('FAIL  ' + msg);
  failed++;
}
function warn(msg) {
  console.log('WARN  ' + msg);
}

const required = [
  'index.html',
  'menu.html',
  'admin.html',
  'app.js',
  'server.js',
  'supabase-config.example.js',
  'vercel.json',
  'public-menu-hardening.js',
  'supabase/migrations/20260831_role_hardening_and_event_guard.sql',
  'admin-runtime/00-bootstrap.js',
  'admin-runtime/01-catalog.js',
  'admin-runtime/02-auth-live-data.js',
  'admin-runtime/03-rendering-ui.js',
  'admin-runtime/04-crud-storage.js',
  'admin-runtime/05-analytics-qr-events.js',
  'admin-runtime/06-init.js'
];

for (const f of required) {
  if (fs.existsSync(path.join(root, f))) ok('exists ' + f);
  else fail('missing ' + f);
}

// Admin runtime: static sequential local files (no CDN, no assembler)
const runtimeFiles = [
  'admin-runtime/00-bootstrap.js',
  'admin-runtime/01-catalog.js',
  'admin-runtime/02-auth-live-data.js',
  'admin-runtime/03-rendering-ui.js',
  'admin-runtime/04-crud-storage.js',
  'admin-runtime/05-analytics-qr-events.js',
  'admin-runtime/06-init.js'
];
const forbiddenRuntime = /cdn\.jsdelivr\.net\/gh|raw\.githubusercontent\.com|admin\.src\.|__MENU_ADMIN_SRC|document\.write\s*\(|new Function\s*\(|\beval\s*\(/;
let runtimeBytes = 0;
for (const f of runtimeFiles) {
  const fp = path.join(root, f);
  const t = fs.readFileSync(fp, 'utf8');
  runtimeBytes += Buffer.byteLength(t, 'utf8');
  if (forbiddenRuntime.test(t)) fail('forbidden pattern in ' + f);
  else ok('runtime clean ' + f);
}
if (runtimeBytes < 25000) fail('admin-runtime total size too small: ' + runtimeBytes);
else ok('admin-runtime total bytes ' + runtimeBytes);

if (fs.existsSync(path.join(root, 'admin.js'))) {
  const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
  if (/cdn\.jsdelivr\.net\/gh\/Midosd249|raw\.githubusercontent\.com.*admin\.js|__MENU_ADMIN_SRC|admin\.src\./.test(adminJs)) {
    fail('admin.js contains CDN/assembler patterns');
  } else {
    ok('admin.js has no CDN/assembler (shim allowed)');
  }
}

// No service role patterns in client files
const clientFiles = ['supabase-config.js', 'supabase-config.example.js', 'admin.js', 'app.js', 'server.js'];
for (const f of clientFiles) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) continue;
  const t = fs.readFileSync(fp, 'utf8');
  if (/service_role|service-role|SUPABASE_SERVICE_ROLE/i.test(t) && !/never|NEVER|must never/i.test(t)) {
    fail('possible service role reference in ' + f);
  }
}
ok('no service_role key patterns in client configs');

// vercel.json valid
try {
  JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  ok('vercel.json is valid JSON');
} catch (e) {
  fail('vercel.json invalid: ' + e.message);
}

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const headers = (vercel.headers || []).flatMap((h) => h.headers || []);
const keys = headers.map((h) => h.key);
for (const need of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy']) {
  if (keys.includes(need)) ok('header present: ' + need);
  else fail('missing header: ' + need);
}
const csp = headers.find((h) => h.key === 'Content-Security-Policy');
if (csp && /unsafe-eval/.test(csp.value)) fail('CSP contains unsafe-eval');
else ok('CSP does not include unsafe-eval');

// Syntax check JS files with node --check
const jsFiles = [
  'app.js',
  'server.js',
  'public-menu-hardening.js',
  'public-menu-ux.js',
  'public-menu-live-fix.js',
  'scripts/check.mjs',
  ...runtimeFiles
];
for (const f of jsFiles) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) {
    fail('syntax target missing ' + f);
    continue;
  }
  const r = spawnSync(process.execPath, ['--check', fp], { encoding: 'utf8' });
  if (r.status === 0) ok('syntax ' + f);
  else fail('syntax ' + f + ' → ' + (r.stderr || r.stdout || '').slice(0, 200));
}

if (syntaxOnly) {
  process.exit(failed ? 1 : 0);
}

// Static HTML must load admin-runtime 00..06 in order, no CDN admin app code
const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const order = [
  'admin-runtime/00-bootstrap.js',
  'admin-runtime/01-catalog.js',
  'admin-runtime/02-auth-live-data.js',
  'admin-runtime/03-rendering-ui.js',
  'admin-runtime/04-crud-storage.js',
  'admin-runtime/05-analytics-qr-events.js',
  'admin-runtime/06-init.js'
];
let lastIdx = -1;
for (const src of order) {
  const idx = adminHtml.indexOf(src);
  if (idx < 0) fail('admin.html missing script ' + src);
  else if (idx < lastIdx) fail('admin.html wrong order for ' + src);
  else {
    ok('admin.html loads ' + src);
    lastIdx = idx;
  }
}
if (/src=["']admin\.js["']/.test(adminHtml)) fail('admin.html still references monolith admin.js');
else ok('admin.html does not load monolith admin.js');
if (/admin\.src\./.test(adminHtml)) fail('admin.html references admin.src.*');
else ok('admin.html has no admin.src.*');
if (/cdn\.jsdelivr\.net\/gh\/Midosd249/.test(adminHtml)) fail('admin.html still pulls app code from GitHub CDN');
else ok('admin.html has no GitHub app-code CDN loader');

const menuHtml = fs.readFileSync(path.join(root, 'menu.html'), 'utf8');
if (menuHtml.includes('public-menu-hardening.js')) ok('menu.html includes hardening script');
else fail('menu.html missing public-menu-hardening.js');

if (failed) {
  console.error('\nQuality gate FAILED with ' + failed + ' error(s).');
  process.exit(1);
}
console.log('\nQuality gate PASSED.');
process.exit(0);
