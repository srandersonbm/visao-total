-- Armazenamento genérico em documentos: cada "coleção" (vistorias, evolucao,
-- agendamentos, transferencias, conciliacao, config) vive nesta única tabela,
-- no mesmo formato usado pelo app (id + campos em JSON). Isso evita migrações
-- de schema toda vez que um campo novo é adicionado no front-end.
CREATE TABLE IF NOT EXISTS docs (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (collection, id)
);

CREATE INDEX IF NOT EXISTS idx_docs_collection ON docs (collection);
