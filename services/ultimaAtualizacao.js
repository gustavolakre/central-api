// Serviço central de "última atualização".
// Persiste no banco (sobrevive a reinícios do servidor) e
// transmite via socket.io para todos os clientes conectados.
//
// Chaves:
//   cargas    -> evento "ultimaAtualizacaoPipefy"    (mesma info do dashboard/painéis)
//   parceiros -> evento "ultimaAtualizacaoParceiros"
//   fretes    -> evento "ultimaAtualizacaoFretes"

const pool = require("../src/db/database");

const EVENTOS = {
  cargas: "ultimaAtualizacaoPipefy",
  parceiros: "ultimaAtualizacaoParceiros",
  fretes: "ultimaAtualizacaoFretes"
};

let tabelaPronta = false;

async function garantirTabela() {

  if (tabelaPronta) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ultimas_atualizacoes (
      chave TEXT PRIMARY KEY,
      data_hora TEXT NOT NULL
    )
  `);

  tabelaPronta = true;
}

function gerarDataHora() {

  const agora = new Date();

  return (
    agora.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo"
    }) +
    " " +
    agora.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo"
    })
  );
}

// Registra o horário atual para a chave, salva no banco e emite via socket.
async function registrar(req, chave) {

  const evento = EVENTOS[chave];

  if (!evento) {
    throw new Error(`Chave de atualização inválida: ${chave}`);
  }

  const dataHora = gerarDataHora();

  try {

    await garantirTabela();

    await pool.query(
      `
      INSERT INTO ultimas_atualizacoes (chave, data_hora)
      VALUES ($1, $2)
      ON CONFLICT (chave)
      DO UPDATE SET data_hora = EXCLUDED.data_hora
      `,
      [chave, dataHora]
    );

  } catch (err) {
    console.error("Erro ao salvar última atualização:", err);
  }

  const io = req.app.get("io");

  if (io) {
    io.emit(evento, { data: dataHora });
  }

  return dataHora;
}

// Envia para um socket recém-conectado todos os horários já salvos.
async function enviarTodas(socket) {

  try {

    await garantirTabela();

    const resultado = await pool.query(
      `SELECT chave, data_hora FROM ultimas_atualizacoes`
    );

    resultado.rows.forEach(row => {

      const evento = EVENTOS[row.chave];

      if (evento) {
        socket.emit(evento, { data: row.data_hora });
      }

    });

  } catch (err) {
    console.error("Erro ao enviar últimas atualizações:", err);
  }

}

module.exports = {
  registrar,
  enviarTodas,
  garantirTabela,
  EVENTOS
};
