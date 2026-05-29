const express = require("express");
const axios = require("axios");
const pool = require("../src/db/database");

const router = express.Router();

const PIPE_ID = 304131962;


function converterData(data) {

  if (!data) return null;

  const [dia, mes, resto] = data.split("/");
  const [ano, hora] = resto.split(" ");

  return `${ano}-${mes}-${dia} ${hora}:00`;
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

while (hasNextPage) {

  const query = `
    query {
      allCards(
        pipeId: ${PIPE_ID},
        first: 200,
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

  const data = response.data?.data?.allCards;

  if (!data) {
    console.log("SEM DADOS DO PIPEFY");
    break;
  }

  hasNextPage = data.pageInfo.hasNextPage;

  cursor = data.pageInfo.endCursor;

  console.log("LOTE RECEBIDO:", data.edges.length);

  for (const item of data.edges) {

  const card = item.node;

  if (
    dataUltimaSync &&
    new Date(card.updated_at) <=
    new Date(dataUltimaSync)
  ) {
    continue;
  }

  console.log({
  titulo: card.title,
  phase: card.current_phase
});

  const fase = (
  card.current_phase?.name || ""
)
.toLowerCase()
.trim();

console.log("FASE:", fase);

const fasesIgnoradas = [
  "cancel",
  "fatur",
  "encerr",
  "conclu",
  "arquiv",
  "pago"
];

const ignorarFase = fasesIgnoradas.some(f =>
  fase.includes(f)
);

if (ignorarFase) {

  console.log("IGNORADO FASE:", fase);

  continue;
}

  const fields = {};

  card.fields.forEach(f => {
    fields[f.name.trim()] = f.value || "";
  });

  // etiquetas
  const etiquetasRaw =
    fields["Etiquetas"] ||
    fields["etiquetas"] ||
    fields["Etiqueta"] ||
    fields["ETIQUETAS"] ||
    "";

  console.log("ETIQUETA BANCO:", etiquetasRaw);

  const possuiSemana2026 = /2026\/\d+/.test(etiquetasRaw);

  if (!possuiSemana2026) {
    continue;
  }

  console.log("IMPORTANDO:", {
  card: card.title,
  etiquetas: etiquetasRaw,
  fase
  });

  // NFs
  const nfCompr = fields["NF Taxa Compr."] || "";
  const nfFornec = fields["NF Taxa Fornec."] || "";

  // ignora apenas quando os DOIS estiverem preenchidos
  if (
    nfCompr.trim() !== "" &&
    nfFornec.trim() !== ""
  ) {
    continue;
  }

  console.log("IMPORTANDO:", {
    card: card.title,
    etiquetasRaw,
    nfCompr,
    nfFornec
  });

  try {

    await pool.query(
`
INSERT INTO controle_cargas (
  pipefy_card_id,
  titulo,
  fase,
  created_at_pipefy,
  updated_at_pipefy,
  raw_data,

  comprador,
  fornecedor,
  tipo_suino,
  quantidade,
  preco_kg,

  embarque,
  desembarque,

  peso,
  peso_quebra,
  peso_medio,

  valor_total_bruto,
  valor_mortos,
  valor_condenacoes,
  outros_descontos,
  valor_total_liquido,

  nf_taxa_compr,
  nf_taxa_fornec,
  nota_fiscal_venda,

  etiquetas,
  transportadora,
  motorista,
  placa,

  pagamento_realizado
)

VALUES (
  $1,$2,$3,$4,$5,$6,
  $7,$8,$9,$10,$11,
  $12,$13,
  $14,$15,$16,
  $17,$18,$19,$20,$21,
  $22,$23,$24,
  $25,$26,$27,$28,
  $29
)

ON CONFLICT (pipefy_card_id)
DO UPDATE SET

  titulo = EXCLUDED.titulo,
  fase = EXCLUDED.fase,
  updated_at_pipefy =
  EXCLUDED.updated_at_pipefy,
  raw_data = EXCLUDED.raw_data,

  comprador = EXCLUDED.comprador,
  fornecedor = EXCLUDED.fornecedor,
  tipo_suino = EXCLUDED.tipo_suino,
  quantidade = EXCLUDED.quantidade,
  preco_kg = EXCLUDED.preco_kg,

  embarque = EXCLUDED.embarque,
  desembarque = EXCLUDED.desembarque,

  peso = EXCLUDED.peso,
  peso_quebra = EXCLUDED.peso_quebra,
  peso_medio = EXCLUDED.peso_medio,

  valor_total_bruto = EXCLUDED.valor_total_bruto,
  valor_mortos = EXCLUDED.valor_mortos,
  valor_condenacoes = EXCLUDED.valor_condenacoes,
  outros_descontos = EXCLUDED.outros_descontos,
  valor_total_liquido = EXCLUDED.valor_total_liquido,

  nf_taxa_compr = EXCLUDED.nf_taxa_compr,
  nf_taxa_fornec = EXCLUDED.nf_taxa_fornec,
  nota_fiscal_venda = EXCLUDED.nota_fiscal_venda,

  etiquetas = EXCLUDED.etiquetas,

  transportadora = EXCLUDED.transportadora,
  motorista = EXCLUDED.motorista,
  placa = EXCLUDED.placa,

  pagamento_realizado = EXCLUDED.pagamento_realizado
`,
[
  card.id,
  card.title,
  card.current_phase?.name || "",
  card.created_at,
  card.updated_at,
  JSON.stringify(fields),

  limparTexto(fields.Comprador),
  limparTexto(fields.Fornecedor),
  fields["Tipo Suíno"] || "",
  converterNumero(fields.Quantidade),
  converterNumero(fields["Preço / kg"]),

  converterData(fields.Embarque),
  converterData(fields.Descarga),

  converterNumero(fields["Peso"]),
  converterNumero(fields["Peso Quebra"]),
  converterNumero(fields["Peso Médio"]),

  converterNumero(fields["Valor Total Bruto"]),
  converterNumero(fields["Valor Mortos"]),
  converterNumero(fields["Valor Condenações"]),
  converterNumero(fields["Outros Descontos"]),
  converterNumero(fields["Valor Total Liquido"]),

  nfCompr,
  nfFornec,

  fields["N Nota de Venda"] || "",

  etiquetasRaw,

  limparTexto(fields.Transportadora),
  fields.Motorista || "",
  fields.Placa || "",

  fields["Pagamento Realizado"] || ""
]
);

    totalImportados++;

      console.log(
         "CARD SALVO:",
         totalImportados,
         "-",
        card.title
      );



  } catch (err) {

    console.log("ERRO AO SALVAR CARD:", card.title);
    console.log(err.message);

  }

}
}
   res.json({
      success: true,
      total_salvo: totalImportados
   });

  } catch (error) {

    console.error("ERRO COMPLETO:");
    console.error(JSON.stringify(error.response?.data, null, 2));
    console.error(error.message);

    res.status(500).json({
      error: "Erro ao importar cards"
    });

  }
});

module.exports = router;