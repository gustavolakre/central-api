const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const pool = require("../src/db/database");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("ROTA IMPORTAR CARGAS OK");
});

const upload = multer({
  storage: multer.memoryStorage()
});


function numero(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) return null;

  const n = Number(
    String(valor)
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return Number.isNaN(n)
    ? null
    : n;
}

function texto(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) return null;

  return String(valor).trim();
}

router.post(
  "/",
  upload.single("arquivo"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          erro: "Nenhum arquivo enviado"
        });
      }

      const workbook = XLSX.read(
        req.file.buffer,
        { type: "buffer" }
      );

      const sheetName =
        workbook.SheetNames[0];

      const worksheet =
        workbook.Sheets[sheetName];

      const dados = XLSX.utils.sheet_to_json(
        worksheet,
       {
         defval: null,
         raw: false
        }
      );

        console.log(dados[0]);


    let importados = 0;

for (const carga of dados) {

  const sql = `
INSERT INTO controle_cargas (

  pipefy_card_id,
  titulo,
  fase,
  comprador,
  fornecedor,
  quantidade,
  peso,
  peso_quebra,
  tipo_suino,
  valor_total_bruto,
  valor_total_liquido,
  mortos_transporte,
  condenacoes_totais,
  condenacoes_parciais,
  nf_taxa_fornec,
  nf_taxa_compr,
  nota_fiscal_venda,
  pagamento_realizado,
  embarque,
  descarga,
  data_vencimento_financeiro,
  etiquetas,
  preco_kg,
  peso_medio,
  valor_mortos,
  valor_condenacoes,
  outros_descontos,
  transportadora,
  motorista,
  placa,
  responsaveis,
  observacoes_negociacao,
  frete,
  prazo_negociado,
  vendedor_comprador,
  vendedor_fornecedor,
  finalidade_gta,
  local_abate,
  numero_gta,
  embutido_cozido,
  senar_funrural,
  verificacao,
  crm,
  nota_fiscal,
  cnpj,
  documentacao,
  observacao_pagamento,
  motivo_cancelamento,
  raw_data

)
VALUES (

  $1,$2,$3,$4,$5,
  $6,$7,$8,$9,$10,
  $11,$12,$13,$14,$15,
  $16,$17,$18,$19,$20,
  $21,$22,$23,$24,$25,
  $26,$27,$28,$29,$30,
  $31,$32,$33,$34,$35,
  $36,$37,$38,$39,$40,
  $41,$42,$43,$44,$45,
  $46,$47,$48,$49,$50

)

ON CONFLICT (pipefy_card_id)
DO UPDATE SET

  titulo = EXCLUDED.titulo,
  fase = EXCLUDED.fase,
  comprador = EXCLUDED.comprador,
  fornecedor = EXCLUDED.fornecedor,
  quantidade = EXCLUDED.quantidade,
  peso = EXCLUDED.peso,
  peso_quebra = EXCLUDED.peso_quebra,
  tipo_suino = EXCLUDED.tipo_suino,
  valor_total_bruto = EXCLUDED.valor_total_bruto,
  valor_total_liquido = EXCLUDED.valor_total_liquido,
  mortos_transporte = EXCLUDED.mortos_transporte,
  condenacoes_totais = EXCLUDED.condenacoes_totais,
  condenacoes_parciais = EXCLUDED.condenacoes_parciais,
  nf_taxa_fornec = EXCLUDED.nf_taxa_fornec,
  nf_taxa_compr = EXCLUDED.nf_taxa_compr,
  nota_fiscal_venda = EXCLUDED.nota_fiscal_venda,
  pagamento_realizado = EXCLUDED.pagamento_realizado,
  embarque = EXCLUDED.embarque,
  descarga = EXCLUDED.descarga,
  data_vencimento_financeiro = EXCLUDED.data_vencimento_financeiro,
  etiquetas = EXCLUDED.etiquetas,
  preco_kg = EXCLUDED.preco_kg,
  peso_medio = EXCLUDED.peso_medio,
  valor_mortos = EXCLUDED.valor_mortos,
  valor_condenacoes = EXCLUDED.valor_condenacoes,
  outros_descontos = EXCLUDED.outros_descontos,
  transportadora = EXCLUDED.transportadora,
  motorista = EXCLUDED.motorista,
  placa = EXCLUDED.placa,
  responsaveis = EXCLUDED.responsaveis,
  observacoes_negociacao = EXCLUDED.observacoes_negociacao,
  frete = EXCLUDED.frete,
  prazo_negociado = EXCLUDED.prazo_negociado,
  vendedor_comprador = EXCLUDED.vendedor_comprador,
  vendedor_fornecedor = EXCLUDED.vendedor_fornecedor,
  finalidade_gta = EXCLUDED.finalidade_gta,
  local_abate = EXCLUDED.local_abate,
  numero_gta = EXCLUDED.numero_gta,
  embutido_cozido = EXCLUDED.embutido_cozido,
  senar_funrural = EXCLUDED.senar_funrural,
  verificacao = EXCLUDED.verificacao,
  crm = EXCLUDED.crm,
  nota_fiscal = EXCLUDED.nota_fiscal,
  cnpj = EXCLUDED.cnpj,
  documentacao = EXCLUDED.documentacao,
  observacao_pagamento = EXCLUDED.observacao_pagamento,
  motivo_cancelamento = EXCLUDED.motivo_cancelamento,
  raw_data = EXCLUDED.raw_data
`;

 const valores = [

  Number(carga["Código"]),

  texto(carga["Título"]),
  texto(carga["Fase atual"]),
  texto(carga["Comprador"]),
  texto(carga["Fornecedor"]),

  numero(carga["Quantidade"]),
  numero(carga["Peso"]),
  numero(carga["Peso Quebra"]),
  texto(carga["Tipo Suíno"]),

  numero(carga["Valor Total Bruto"]),
  numero(carga["Valor Total Líquido"]),

  numero(carga["Mortos em transporte"]),
  numero(carga["Condenações Totais"]),
  numero(carga["Condenações Parciais"]),

  texto(carga["NF Taxa Fornec."]),
  texto(carga["NF Taxa Compr."]),

  texto(carga["N Nota de Venda"]),
  texto(carga["Pagamento realizado?"]),

  carga["Embarque"],
  carga["Descarga"],
  carga["Data Vencimento Financeiro"],

  texto(carga["Etiquetas"]),

  numero(carga["Preço / kg"]),
  numero(carga["Peso Médio"]),

  numero(carga["Valor dos Mortos"]),
  numero(carga["Valor das Condenações"]),
  numero(carga["Outros Descontos"]),

  texto(carga["Transportadora"]),
  texto(carga["Motorista"]),
  texto(carga["Placa"]),

  texto(carga["Responsáveis"]),
  texto(carga["Observações da Negociação"]),

  texto(carga["Frete"]),
  texto(carga["Prazo Negociado"]),

  texto(carga["Vend. Comprador"]),
  texto(carga["Vend. Fornecedor"]),

  texto(carga["Finalidade da GTA"]),
  texto(carga["Local de Abate"]),
  texto(carga["Numero da GTA"]),

  texto(carga["Embutido / Cozido"]),

  numero(carga["Senar / Funrural"]),

  texto(carga["Verificação"]),
  texto(carga["CRM"]),

  texto(carga["Nota Fiscal"]),
  texto(carga["CNPJ"]),

  texto(carga["Documentação"]),

  texto(carga["Observação pagamento"]),
  texto(carga["Motivo do Cancelamento"]),

  JSON.stringify(carga)

];

    console.log("TOTAL VALORES:", valores.length);

    await pool.query(sql, valores);

  importados++;
}

res.json({
  sucesso: true,
  importados
});



    } catch (err) {

      console.error(err);

      res.status(500).json({
        erro: err.message
      });

    }

  }
);

module.exports = router;