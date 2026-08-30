import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Specific route handlers for clean SaaS URLs
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

// Dynamic QR code routing: /m/:tenant/:branch?
app.get('/m/:tenant/:branch?', (req, res) => {
  const tenant = req.params.tenant;
  const branch = req.params.branch || 'main';
  res.redirect(`/menu.html?tenant=${encodeURIComponent(tenant)}&branch=${encodeURIComponent(branch)}`);
});

// Serve static assets with .html extension resolution
app.use(express.static(__dirname, {
  extensions: ['html']
}));

// Root handler
app.get('/', (req, res) => {
  if (req.query.tenant) {
    res.sendFile(path.join(__dirname, 'menu.html'));
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Menu V2 SaaS Platform running at http://0.0.0.0:${PORT}`);
});
