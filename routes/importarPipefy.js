const express = require("express");
const axios = require("axios");
const pool = require("../src/db/database");

const router = express.Router();

const PIPE_ID = 304131962;

const BATCH_SIZE = 50;
let batch = [];


function converterData(data) {

  if (!data) return null;

  const [dia, mes, resto] = data.split("/");
  const [ano, hora] = resto.split(" ");

  return `${ano}-${mes}-${dia} ${hora}:00`;
}


function gerarHashCard(card) {
  const campos = {};

  card.fields.forEach(f => {
    const key = f.field?.id || f.name;
    campos[key] = f.value || "";
  });

  return JSON.stringify({
    updated_at: card.updated_at,
    phase: card.current_phase?.name,
    fields: campos
  });
}


function limparTexto(valor) {

  if (!valor) return "";

  return String(valor)
    .replace(/^\["/, "")
    .replace(/"\]$/, "")
    .replace(/\["/g, "")
    .replace(/"\]/g, "")
    .trim();
}



async function salvarBatch(cards) {
  const values = [];
  const params = [];
  let i = 1;

  for (const c of cards) {
    values.push(`(
      $${i++},$${i++},$${i++},$${i++},$${i++},
      $${i++},$${i++},$${i++},$${i++},$${i++},
      $${i++}
    )`);

    params.push(
      c.id,
      c.title,
      c.fase,
      c.created_at,
      c.updated_at,
      JSON.stringify(c.fields),
      c.nfCompr,
      c.nfFornec,
      c.etiquetasRaw,
      c.ativo,
      c.hash
    );
  }

  await pool.query(`
    INSERT INTO controle_cargas (
      pipefy_card_id,
      titulo,
      fase,
      created_at_pipefy,
      updated_at_pipefy,
      raw_data,
      nf_taxa_compr,
      nf_taxa_fornec,
      etiquetas,
      ativo,
      hash_card
    )
    VALUES ${values.join(",")}
    ON CONFLICT (pipefy_card_id)
    DO UPDATE SET
      titulo = EXCLUDED.titulo,
      fase = EXCLUDED.fase,
      updated_at_pipefy = EXCLUDED.updated_at_pipefy,
      raw_data = EXCLUDED.raw_data,
      nf_taxa_compr = EXCLUDED.nf_taxa_compr,
      nf_taxa_fornec = EXCLUDED.nf_taxa_fornec,
      etiquetas = EXCLUDED.etiquetas,
      ativo = EXCLUDED.ativo,
      hash_card = EXCLUDED.hash_card
  `, params);
}


function converterNumero(valor) {

  if (!valor) return 0;

  return Number(
    String(valor)
      .replace(/\./g, "")
      .replace(",", ".")
  ) || 0;
}


router.get("/", async (req, res) => {
  try {

 const syncRow = await pool.query(`
      SELECT last_sync
      FROM sync_state
      WHERE pipe_id = $1
    `, [PIPE_ID]);

    const lastSync = syncRow.rows[0]?.last_sync;

    const lastSyncDate = lastSync
      ? new Date(lastSync)
      : new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

    console.log("ULTIMO SYNC:", lastSyncDate);

const semanaFiltro = req.query.semana || "";

let totalImportados = 0;

let hasNextPage = true;

let cursor = null;

const ultimaSync = await pool.query(`
  SELECT MAX(updated_at_pipefy) as ultima
  FROM controle_cargas
`);

const dataUltimaSync =
  ultimaSync.rows[0].ultima;

console.log(
  "ULTIMA SYNC:",
  dataUltimaSync
);

const registrosBanco = await pool.query(`
  SELECT
    pipefy_card_id,
    hash_card,
    ativo
  FROM controle_cargas
  WHERE updated_at_pipefy > NOW() - INTERVAL '7 days'
`);

const mapaCards = {};

for (const row of registrosBanco.rows) {
  mapaCards[row.pipefy_card_id] = {
  hash: row.hash_card,
  ativo: row.ativo
};
}


while (hasNextPage) {

const afterClause = cursor ? `after: "${cursor}",` : "";

const query = `
query {
  allCards(
    pipeId: ${PIPE_ID},
    first: 50,
    after: ${cursor ? `"${cursor}"` : null}
  ) {

    pageInfo {
      hasNextPage
      endCursor
    }

    edges {

      node {

        id
        title
        created_at
        updated_at

        current_phase {
          name
        }

        fields {
          name
          value

          field {
            id
          }
        }

      }

    }

  }
}
`;

  const response = await axios.post(
    "https://api.pipefy.com/graphql",
    { query },
    {
      headers: {
        Authorization: `Bearer ${process.env.PIPEFY_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );


const cards =
  response.data.data.allCards.edges;

hasNextPage =
  response.data.data.allCards.pageInfo.hasNextPage;

cursor =
  response.data.data.allCards.pageInfo.endCursor;

for (const edge of cards) {

  const card = edge.node;

  console.log("CARD ENCONTRADO:", card.id);

  console.log(
    JSON.stringify(card, null, 2)
  );

  const fields = {};

  card.fields.forEach(f => {
    const nome = f.name?.trim();
    const id = f.field?.id?.trim();

    if (nome) fields[nome] = f.value || "";
    if (id) fields[id] = f.value || "";
  });

console.log("TESTE NF IDs");
console.log({
  nfComprID: fields["nf_taxa_compr"],
  nfFornecID: fields["nfs_de_servi_o"],
  nfComprNome: fields["NF Taxa Compr."],
  nfFornecNome: fields["NF Taxa Fornec."]
});


console.log("TESTE NF IDs");
console.log({
  nfComprID: fields["nf_taxa_compr"],
  nfFornecID: fields["nfs_de_servi_o"]
});

card.fields.forEach(f => {
  console.log(
    "CAMPO:",
    f.name,
    "| ID:",
    f.field?.id,
    "| VALOR:",
    f.value
  );
});

const updatedAt = new Date(card.updated_at);
const lastSyncTime = new Date(lastSyncDate);

const hashNovo = gerarHashCard(card);
const cached = mapaCards[card.id];

console.log("HASH BANCO:", cached?.hash);
console.log("HASH NOVO:", hashNovo);

// TESTE
 if (cached?.hash === hashNovo && cached?.ativo) {
   continue;
 }

const fase =
  (card.current_phase?.name || "")
    .toLowerCase()
    .trim();


 const nfCompr =
  fields["nf_taxa_compr"] ||
  fields["NF Taxa Compr."] ||
  fields["NF Taxa Compr"] ||
  "";

const nfFornec =
  fields["nfs_de_servi_o"] ||
  fields["NF Taxa Fornec."] ||
  fields["NF Taxa Fornec"] ||
  "";

    console.log("NF COMPR:", nfCompr);
console.log("NF FORNEC:", nfFornec);

const teste = await pool.query(`
  SELECT
    pipefy_card_id,
    nf_taxa_compr,
    nf_taxa_fornec,
    ativo
  FROM controle_cargas
  WHERE pipefy_card_id = $1
`, [card.id]);

console.log(
  "REGISTRO BANCO:",
  JSON.stringify(teste.rows, null, 2)
);

    console.log("NF COMPR =", nfCompr);
console.log("NF FORNEC =", nfFornec);

    console.log("CARD", card.id);

console.log("NF COMPR:", JSON.stringify(nfCompr));

console.log("NF FORNEC:", JSON.stringify(nfFornec));

console.log(
  "NF COMPLETO:",
  nfCompr.trim() !== "" &&
  nfFornec.trim() !== ""
);

  const etiquetasRaw =
    fields["Etiquetas"] ||
    fields["etiquetas"] ||
    fields["Etiqueta"] ||
    fields["ETIQUETAS"] ||
    "";

  const nfCompleto =
    nfCompr.trim() !== "" &&
    nfFornec.trim() !== "";

    console.log("TIPO NF COMPR:", typeof nfCompr);
    console.log("TIPO NF FORNEC:", typeof nfFornec);

  console.log("NF COMPR:", nfCompr);
  console.log("NF FORNEC:", nfFornec);
  console.log("NF COMPLETO:", nfCompleto);


  console.log("VALOR NF COMPR:", JSON.stringify(nfCompr));
  console.log("VALOR NF FORNEC:", JSON.stringify(nfFornec));
  console.log(
  "NF COMPLETO?",
  nfCompr.trim() !== "" &&
  nfFornec.trim() !== ""
);

if (nfCompleto) {

  console.log("=== VAI ATUALIZAR ===");
  console.log("CARD:", card.id);
  console.log("COMPR:", nfCompr);
  console.log("FORNEC:", nfFornec);


const conferencia = await pool.query(`
  SELECT
    pipefy_card_id,
    nf_taxa_compr,
    nf_taxa_fornec,
    ativo
  FROM controle_cargas
  WHERE pipefy_card_id = $1
`, [card.id]);

console.log(
  "REGISTRO APÓS UPDATE:",
  JSON.stringify(conferencia.rows, null, 2)
);



  const resultado = await pool.query(`
    UPDATE controle_cargas
    SET
      nf_taxa_compr = $2,
      nf_taxa_fornec = $3,
      ativo = false,
      updated_at_pipefy = $4
    WHERE pipefy_card_id = $1
  `, [
    card.id,
    nfCompr,
    nfFornec,
    card.updated_at
  ]);

  console.log(
    "LINHAS AFETADAS:",
    resultado.rowCount
  );

 continue;
 }

  batch.push({
    id: card.id,
    title: card.title,
    fase,
    created_at: card.created_at,
    updated_at: card.updated_at,
    fields,
    nfCompr,
    nfFornec,
    etiquetasRaw,
    ativo: true,
    hash: hashNovo
  });

  totalImportados++;

  if (batch.length >= BATCH_SIZE) {
    await salvarBatch(batch);
    batch = [];
  }
}
}

if (batch.length > 0) {
  await salvarBatch(batch);
  batch = [];
}

// 🔥 PASSO 5 — ATUALIZAR SYNC
await pool.query(`
  INSERT INTO sync_state (pipe_id, last_sync)
  VALUES ($1, NOW())
  ON CONFLICT (pipe_id)
  DO UPDATE SET last_sync = EXCLUDED.last_sync
`, [PIPE_ID]);


   res.json({
      success: true,
      total_salvo: totalImportados
   });

  } catch (error) {

    console.error("ERRO COMPLETO:");
    console.error(JSON.stringify(error.response?.data, null, 2));
    console.error(error.response?.data);
    console.error(error);

    res.status(500).json({
      error: "Erro ao importar cards"
    });

  }
});

module.exports = router;