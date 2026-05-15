const express = require("express")
const router = express.Router()

const pool = require("../src/db/database")

router.get("/", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM controle_cargas
      ORDER BY embarque DESC
    `)

    const dados = result.rows.map(r => {

  console.log("ETIQUETA BANCO:", r.etiquetas)

  return {

    // 🔹 mantém padrão antigo do frontend
    "Código": r.pipefy_card_id,

    "Comprador": r.comprador,

    "Fornecedor": r.fornecedor,

    "Quantidade": Number(r.quantidade || 0),

    "Tipo Suíno": r.tipo_suino,

    "Mortos em transporte": Number(r.mortos_transporte || 0),

    "Condenações Totais": Number(r.valor_condenacoes || 0),

    "Condenações Parciais": 0,

    "NF Taxa Fornec.": r.nf_taxa_fornec || "",

    "NF Taxa Compr.": r.nf_taxa_compr || "",

    "N Nota de Venda": r.nota_fiscal_venda || "",

    "etiquetas": r.etiquetas || "",

    "Embarque": r.embarque,

    "Desembarque": r.desembarque,

    // 🔹 extras novos
    "Peso": r.peso,

    "Peso Quebra": r.peso_quebra,

    "Valor Total Bruto": r.valor_total_bruto,

    "Valor Total Liquido": r.valor_total_liquido,

    "Valor Mortos": r.valor_mortos,

    "Valor Condenações": r.valor_condenacoes,

    "Preço KG": r.preco_kg,

    "Transportadora": r.transportadora,

    "Motorista": r.motorista,

    "Placa": r.placa

  }

})

    res.json(dados)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      erro: err.message
    })

  }

})

module.exports = router