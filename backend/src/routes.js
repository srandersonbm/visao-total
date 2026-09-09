const express = require('express');
const crypto = require('crypto');
const { db } = require('./db');

// Toda a área operacional do app vive nestas "coleções" — o front-end usa
// exatamente esses nomes.
const ALLOWED_COLLECTIONS = new Set([
  'vistorias',
  'evolucao',
  'agendamentos',
  'transferencias',
  'caixa',
  'config',
]);

function checkCollection(req, res, next) {
  if (!ALLOWED_COLLECTIONS.has(req.params.name)) {
    return res.status(404).json({ error: `coleção desconhecida: ${req.params.name}` });
  }
  next();
}

function rowToDoc(row) {
  return { id: row.id, ...JSON.parse(row.data) };
}

function makeRouter(broadcast) {
  const router = express.Router();

  // Lista todos os documentos de uma coleção.
  router.get('/collections/:name', checkCollection, async (req, res, next) => {
    try {
      const rows = await db.all('SELECT id, data FROM docs WHERE collection = ? ORDER BY id', [req.params.name]);
      res.json(rows.map(rowToDoc));
    } catch (err) { next(err); }
  });

  // Lê um documento específico.
  router.get('/collections/:name/:id', checkCollection, async (req, res, next) => {
    try {
      const row = await db.get('SELECT id, data FROM docs WHERE collection = ? AND id = ?', [req.params.name, req.params.id]);
      if (!row) return res.status(404).json({ error: 'documento não encontrado' });
      res.json(rowToDoc(row));
    } catch (err) { next(err); }
  });

  // Cria um documento novo (id opcional — gerado automaticamente se ausente).
  router.post('/collections/:name', checkCollection, async (req, res, next) => {
    try {
      const id = req.body.id || crypto.randomUUID();
      const data = { ...req.body };
      delete data.id;
      await db.run(
        "INSERT INTO docs (collection, id, data, updated_at) VALUES (?, ?, ?, datetime('now'))",
        [req.params.name, id, JSON.stringify(data)]
      );
      broadcast(req.params.name);
      res.status(201).json({ id, ...data });
    } catch (err) { next(err); }
  });

  // Substitui um documento inteiro, criando-o se ainda não existir.
  router.put('/collections/:name/:id', checkCollection, async (req, res, next) => {
    try {
      const data = { ...req.body };
      delete data.id;
      await db.run(
        `INSERT INTO docs (collection, id, data, updated_at) VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT (collection, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
        [req.params.name, req.params.id, JSON.stringify(data)]
      );
      broadcast(req.params.name);
      res.json({ id: req.params.id, ...data });
    } catch (err) { next(err); }
  });

  // Mescla campos num documento existente.
  router.patch('/collections/:name/:id', checkCollection, async (req, res, next) => {
    try {
      const row = await db.get('SELECT data FROM docs WHERE collection = ? AND id = ?', [req.params.name, req.params.id]);
      if (!row) return res.status(404).json({ error: 'documento não encontrado' });
      const merged = { ...JSON.parse(row.data), ...req.body };
      delete merged.id;
      await db.run(
        "UPDATE docs SET data = ?, updated_at = datetime('now') WHERE collection = ? AND id = ?",
        [JSON.stringify(merged), req.params.name, req.params.id]
      );
      broadcast(req.params.name);
      res.json({ id: req.params.id, ...merged });
    } catch (err) { next(err); }
  });

  // Remove um documento.
  router.delete('/collections/:name/:id', checkCollection, async (req, res, next) => {
    try {
      await db.run('DELETE FROM docs WHERE collection = ? AND id = ?', [req.params.name, req.params.id]);
      broadcast(req.params.name);
      res.status(204).end();
    } catch (err) { next(err); }
  });

  return router;
}

module.exports = { makeRouter, ALLOWED_COLLECTIONS };
