const pool = require("../src/db/database");

let tabelaPronta = false;

async function garantirTabela() {

  if (tabelaPronta) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS faturamento_sessoes (
      id SERIAL PRIMARY KEY,
      processo TEXT NOT NULL,
      iniciado_por TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
      dados_json JSONB NOT NULL,
      criado_em TIMESTAMPTZ DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS faturamento_sessoes_processo_ativo
    ON faturamento_sessoes (processo)
    WHERE status = 'EM_ANDAMENTO'
  `);

  tabelaPronta = true;
}

async function buscarAtiva(processo) {

  await garantirTabela();

  const result = await pool.query(`
    SELECT *
    FROM faturamento_sessoes
    WHERE processo = $1
      AND status = 'EM_ANDAMENTO'
    ORDER BY id DESC
    LIMIT 1
  `, [processo]);

  return result.rows[0] || null;
}

async function listarAtivas() {

  await garantirTabela();

  const result = await pool.query(`
    SELECT id, processo, iniciado_por, status, criado_em, atualizado_em
    FROM faturamento_sessoes
    WHERE status = 'EM_ANDAMENTO'
    ORDER BY atualizado_em DESC
  `);

  return result.rows;
}

async function criar(processo, email, dados) {

  await garantirTabela();

  const existente = await buscarAtiva(processo);

  if (existente) {

    if (existente.iniciado_por === email) {
      return {
        retomada: true,
        sessao: existente
      };
    }

    const erro = new Error(
      `Faturamento em andamento por ${existente.iniciado_por}`
    );
    erro.status = 409;
    throw erro;
  }

  const result = await pool.query(`
    INSERT INTO faturamento_sessoes (
      processo,
      iniciado_por,
      status,
      dados_json
    )
    VALUES ($1, $2, 'EM_ANDAMENTO', $3)
    RETURNING *
  `, [
    processo,
    email,
    JSON.stringify(dados)
  ]);

  return {
    retomada: false,
    sessao: result.rows[0]
  };
}

async function salvar(processo, email, dados) {

  await garantirTabela();

  const existente = await buscarAtiva(processo);

  if (!existente) {
    const erro = new Error("Nenhuma sessão ativa encontrada");
    erro.status = 404;
    throw erro;
  }

  if (existente.iniciado_por !== email) {
    const erro = new Error(
      `Sessão iniciada por ${existente.iniciado_por}`
    );
    erro.status = 403;
    throw erro;
  }

  const result = await pool.query(`
    UPDATE faturamento_sessoes
    SET
      dados_json = $1,
      atualizado_em = NOW()
    WHERE id = $2
    RETURNING *
  `, [
    JSON.stringify(dados),
    existente.id
  ]);

  return result.rows[0];
}

async function concluir(processo, email) {

  await garantirTabela();

  const existente = await buscarAtiva(processo);

  if (!existente) {
    return null;
  }

  if (existente.iniciado_por !== email) {
    const erro = new Error(
      `Sessão iniciada por ${existente.iniciado_por}`
    );
    erro.status = 403;
    throw erro;
  }

  const result = await pool.query(`
    UPDATE faturamento_sessoes
    SET
      status = 'CONCLUIDO',
      atualizado_em = NOW()
    WHERE id = $1
    RETURNING *
  `, [existente.id]);

  return result.rows[0];
}

module.exports = {
  garantirTabela,
  buscarAtiva,
  listarAtivas,
  criar,
  salvar,
  concluir
};
