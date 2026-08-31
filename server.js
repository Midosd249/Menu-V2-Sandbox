import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers for local/dev and any Node hosting
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // CSP: local scripts only; hosted fonts and Supabase APIs remain explicitly allowed.
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: http:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'"
  );
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  next();
});

// Clean SaaS routes
app.get('/owner', (req, res) => {
  res.sendFile(path.join(__dirname, 'owner.html'));
});
app.get('/client', (req, res) => {
  res.sendFile(path.join(__dirname, 'client.html'));
});
app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, 'menu.html'));
});
app.get('/website', (req, res) => {
  res.sendFile(path.join(__dirname, 'website.html'));
});
app.get('/visibility', (req, res) => {
  res.sendFile(path.join(__dirname, 'visibility.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Dynamic QR routing: /m/:tenant/:branch?
app.get('/m/:tenant/:branch?', (req, res) => {
  const tenant = req.params.tenant;
  const branch = req.params.branch || 'main';
  res.redirect(
    `/menu.html?tenant=${encodeURIComponent(tenant)}&branch=${encodeURIComponent(branch)}`
  );
});

app.use(
  express.static(__dirname, {
    extensions: ['html'],
  })
);

app.get('/', (req, res) => {
  if (req.query.tenant) {
    res.sendFile(path.join(__dirname, 'menu.html'));
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Menu V2 SaaS Platform running at http://0.0.0.0:${PORT}`);
});
