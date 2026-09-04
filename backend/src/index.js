require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const { makeRouter } = require('./routes');
const { authMiddleware } = require('./auth');

const PORT = process.env.PORT || 4400;
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// --- Tempo real: cada escrita avisa todos os clientes conectados via SSE, que
// então recarregam só a coleção afetada. Assim o PC e o celular ficam sempre
// sincronizados sem precisar de WebSocket. ---
const clients = new Set();
function broadcast(collection) {
  const payload = `data: ${JSON.stringify({ collection })}\n\n`;
  for (const res of clients) res.write(payload);
}

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'visao-total-api' }));

app.get('/api/events', authMiddleware, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write(': conectado\n\n');
  clients.add(res);

  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(ping);
    clients.delete(res);
  });
});

app.use('/api', authMiddleware, makeRouter(broadcast));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'erro interno do servidor' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Visão Total API rodando em http://localhost:${PORT}`);
      if (!process.env.ACCESS_TOKEN) {
        console.warn('⚠️  ACCESS_TOKEN não definido no .env — a API está aberta para qualquer um. Configure antes de expor pela internet.');
      }
    });
  })
  .catch((err) => {
    console.error('Falha ao iniciar o banco de dados:', err);
    process.exit(1);
  });
