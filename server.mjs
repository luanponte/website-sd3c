/* ==========================================================================
   Sabores em Movimento — Dev Server com API de Inscrições
   Serve os ficheiros estáticos + endpoint POST /api/inscricoes
   Grava em data/inscricoes.json
   ========================================================================== */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '5173', 10);
const HOST = '0.0.0.0';
const DB_PATH = path.join(__dirname, 'data', 'inscricoes.json');

/* ---------- MIME map ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

/* ---------- JSON DB helpers ---------- */
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/* ---------- Server ---------- */
const server = http.createServer(async (req, res) => {
  /* --- CORS headers (for local dev) --- */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://127.0.0.1');
  const pathname = decodeURIComponent(parsedUrl.pathname);

  /* --- API: POST /api/inscricoes --- */
  if (req.method === 'POST' && pathname === '/api/inscricoes') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const entry = JSON.parse(body);
        // Basic validation
        if (!entry.nome || !entry.whatsapp || !entry.empresa || !entry.email || !entry.possui_cnpj) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Campos obrigatórios faltando.' }));
          return;
        }

        const normStr = s => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
        const normDigits = s => (s || '').toString().replace(/\D/g, '');

        const db = readDB();

        // Check for duplicates
        for (const prev of db) {
          if (normStr(prev.nome) === normStr(entry.nome)) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'duplicate', field: 'Nome Completo', message: 'Já existe um cadastro registrado com este Nome Completo.' }));
            return;
          }
          if (normDigits(prev.whatsapp) && normDigits(prev.whatsapp) === normDigits(entry.whatsapp)) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'duplicate', field: 'Contato / WhatsApp', message: 'Já existe um cadastro registrado com este Contato / WhatsApp.' }));
            return;
          }
          if (normStr(prev.empresa) === normStr(entry.empresa)) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'duplicate', field: 'Nome da Empresa', message: 'Já existe um cadastro registrado com este Nome de Empresa.' }));
            return;
          }
          if (normStr(prev.email) === normStr(entry.email)) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'duplicate', field: 'E-mail', message: 'Já existe um cadastro registrado com este E-mail.' }));
            return;
          }
          if (entry.cnpj && prev.cnpj && normDigits(entry.cnpj) && normDigits(prev.cnpj) === normDigits(entry.cnpj)) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'duplicate', field: 'CNPJ', message: 'Já existe um cadastro registrado com este CNPJ.' }));
            return;
          }
        }

        db.push(entry);
        writeDB(db);
        console.log(`✓ Nova inscrição: ${entry.nome} (${entry.empresa})`);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, id: entry.id }));
      } catch (e) {
        console.error('Erro ao processar inscrição:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro interno.' }));
      }
    });
    return;
  }

  /* --- API: GET /api/inscricoes --- */
  if (req.method === 'GET' && pathname === '/api/inscricoes') {
    const db = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db));
    return;
  }

  /* --- Block direct static access to private data directory and hidden files --- */
  if (pathname.startsWith('/data') || pathname.startsWith('/.') || pathname.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acesso negado.');
    return;
  }

  /* --- Static file serving --- */
  let urlPath = pathname;
  if (urlPath === '/') urlPath = '/index.html';

  // Resolve file path (prevent directory traversal)
  let filePath = path.join(__dirname, urlPath);
  // Resolve symlinks / junctions (e.g. img -> assets/img)
  try {
    filePath = fs.realpathSync(filePath);
  } catch {
    // file doesn't exist — will 404 below
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Try with .html extension
      const withHtml = filePath + '.html';
      if (!err && stats?.isDirectory()) {
        const indexFile = path.join(filePath, 'index.html');
        if (fs.existsSync(indexFile)) {
          return serveFile(indexFile, res);
        }
      }
      if (fs.existsSync(withHtml)) {
        return serveFile(withHtml, res);
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 — Não encontrado</h1>');
      return;
    }
    serveFile(filePath, res);
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': 'no-cache',
  });
  stream.pipe(res);
  stream.on('error', () => {
    res.writeHead(500);
    res.end('Erro ao ler ficheiro.');
  });
}

server.listen(PORT, HOST, () => {
  const addr = server.address();
  console.log(`\n  🍽  Sabores em Movimento — Dev Server`);
  console.log(`  ────────────────────────────────────`);
  console.log(`  Local:   http://localhost:${addr.port}/`);
  console.log(`  Rede:    http://${getNetworkIP()}:${addr.port}/`);
  console.log(`  API:     POST http://localhost:${addr.port}/api/inscricoes`);
  console.log(`  DB:      ${DB_PATH}\n`);
});

function getNetworkIP() {
  try {
    const nets = os.networkInterfaces();
    for (const ifaces of Object.values(nets)) {
      for (const iface of ifaces) {
        if (iface.family === 'IPv4' && !iface.internal) return iface.address;
      }
    }
  } catch {}
  return '0.0.0.0';
}
