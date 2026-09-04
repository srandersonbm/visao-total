const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Banco local em arquivo — este PC é o próprio servidor, então não depende de
// nenhum serviço externo (Turso etc.) para persistir os dados.
const url = `file:${path.join(dataDir, 'visao-total.db')}`;

const client = createClient({ url });

const db = {
  async get(sql, params = []) {
    const res = await client.execute({ sql, args: params });
    return res.rows[0];
  },
  async all(sql, params = []) {
    const res = await client.execute({ sql, args: params });
    return res.rows;
  },
  async run(sql, params = []) {
    const res = await client.execute({ sql, args: params });
    return { changes: res.rowsAffected };
  },
};

async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await client.executeMultiple(schema);
}

module.exports = { db, client, initDb };
