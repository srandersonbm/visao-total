// Popula o banco local com os dados reais já importados da planilha
// "Controle de Vistorias.xlsx" (últimos meses de vistorias, transferências,
// evolução, agendamentos e conciliação) e as listas padrão de configuração.
// Rodar de novo é seguro: cada documento é gravado por id (substitui, não duplica).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db, initDb } = require('./db');

const SEED_DIR = path.join(__dirname, '..', 'seed-data');

async function seedCollection(name) {
  const dir = path.join(SEED_DIR, name);
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const id = file.replace(/\.json$/, '');
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    await db.run(
      `INSERT INTO docs (collection, id, data, updated_at) VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (collection, id) DO UPDATE SET data = excluded.data`,
      [name, id, JSON.stringify(data)]
    );
  }
  return files.length;
}

async function main() {
  await initDb();
  const collections = ['config', 'conciliacao', 'vistorias', 'evolucao', 'agendamentos', 'transferencias'];
  for (const name of collections) {
    const count = await seedCollection(name);
    console.log(`  ${name}: ${count} documento(s)`);
  }
  console.log('Seed concluído.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Falha ao rodar o seed:', err);
  process.exit(1);
});
