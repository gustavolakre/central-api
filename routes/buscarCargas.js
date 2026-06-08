const express = require("express")
const router = express.Router()

const pool = require("../src/db/database")
const autenticar = require("../middlewares/autenticar")

router.use(autenticar)

router.get("/", async (req, res) => {

  try {

   const result = await pool.query(`
  SELECT
    pipefy_card_id         AS "Código",
    comprador              AS "Comprador",
    fornecedor             AS "Fornecedor",
    quantidade             AS "Quantidade",
    tipo_suino             AS "Tipo Suíno",
    mortos_transporte      AS "Mortos em transporte",
    nf_taxa_compr          AS "NF Taxa Compr.",
    nf_taxa_fornec         AS "NF Taxa Fornec.",
    etiquetas              AS "Etiquetas",
    nota_fiscal_venda      AS "N Nota de Venda"
    FROM controle_cargas
    WHERE fase <> '09-CANCELADA'
    AND NOT (
        COALESCE(TRIM(nf_taxa_compr), '') <> ''
    AND COALESCE(TRIM(nf_taxa_fornec), '') <> ''
  )
`)

    res.json(result.rows)

  } catch (err) {

    console.error("ERRO SQL:", err)

    res.status(500).json({
      erro: err.message
    })

  }

})

module.exports = router