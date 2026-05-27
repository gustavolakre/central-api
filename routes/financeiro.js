const express = require("express")
const router = express.Router()

const pool = require("../src/db/database")



/* =========================================
   BUSCAR LANÇAMENTOS
========================================= */

router.get("/", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM financeiro
      ORDER BY vencimento ASC, id DESC
    `)

    res.json(result.rows)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      erro: err.message
    })

  }

})


/* =========================================
   NOVO LANÇAMENTO
========================================= */



router.post("/", async (req, res) => {

  try {

    const {

      tipo,
      parceiro,
      discriminacao_periodo,
      produto_servico,
      valor,
      data_emissao,
      vencimento,
      nota_fiscal,
      observacao

    } = req.body


    const result = await pool.query(`

      INSERT INTO financeiro (

        tipo,
        parceiro,
        discriminacao_periodo,
        produto_servico,
        valor,
        data_emissao,
        vencimento,
        nota_fiscal,
        observacao,
        status,
        valor_pago

      )

      VALUES (

        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,
        $10,$11

      )

      RETURNING *

    `, [

      tipo,
      parceiro,
      discriminacao_periodo,
      produto_servico,
      valor,
      data_emissao,
      vencimento,
      nota_fiscal,
      observacao,
      "PENDENTE",
      0

    ])


    res.json(result.rows[0])

  }

  catch (err) {

    console.error(err)

    res.status(500).json({
      erro: err.message
    })

  }

})



/* =========================================
   BAIXA FINANCEIRA
========================================= */

router.put("/:id/baixa", async (req, res) => {

  try {

    const { id } = req.params

    const {

      valor_pago,
      banco_pagamento,
      data_pagamento

    } = req.body


    const atual = await pool.query(`

      SELECT *
      FROM financeiro
      WHERE id = $1

    `, [id])


    if (!atual.rows.length) {

      return res.status(404).json({
        erro: "Lançamento não encontrado"
      })

    }


    const lanc = atual.rows[0]


    const valorAtualPago =
      Number(lanc.valor_pago || 0)

    const valorDocumento =
      Number(lanc.valor || 0)

    const novoValorPago =
      valorAtualPago + Number(valor_pago)


    if (novoValorPago > valorDocumento) {

      return res.status(400).json({
        erro: "Valor maior que documento"
      })

    }


    let status = "PARCIAL"

    if (novoValorPago >= valorDocumento) {

      status = "PAGO"

    }


    const result = await pool.query(`

      UPDATE financeiro

      SET

        valor_pago = $1,
        banco_pagamento = $2,
        data_pagamento = $3,
        status = $4

      WHERE id = $5

      RETURNING *

    `, [

      novoValorPago,
      banco_pagamento,
      data_pagamento,
      status,
      id

    ])


    res.json(result.rows[0])

  }

  catch (err) {

    console.error(err)

    res.status(500).json({
      erro: err.message
    })

  }

})



/* =========================================
   EDITAR LANÇAMENTO
========================================= */

router.put("/:id", async (req, res) => {

  try {

    const { id } = req.params

    const {

      tipo,
      parceiro,
      discriminacao_periodo,
      produto_servico,
      valor,
      data_emissao,
      vencimento,
      nota_fiscal,
      observacao

    } = req.body


    const result = await pool.query(`

      UPDATE financeiro

      SET

        tipo = $1,
        parceiro = $2,
        discriminacao_periodo = $3,
        produto_servico = $4,
        valor = $5,
        data_emissao = $6,
        vencimento = $7,
        nota_fiscal = $8,
        observacao = $9

      WHERE id = $10

      RETURNING *

    `,[

      tipo,
      parceiro,
      discriminacao_periodo,
      produto_servico,
      valor,
      data_emissao,
      vencimento,
      nota_fiscal,
      observacao,
      id

    ])


    res.json(result.rows[0])

  }

  catch(err){

    console.error(err)

    res.status(500).json({
      erro: err.message
    })

  }

})




/* =========================================
   EXCLUIR
========================================= */

router.delete("/:id", async (req, res) => {

  try {

    const { id } = req.params

    await pool.query(`
      DELETE FROM financeiro
      WHERE id = $1
    `, [id])

    res.json({
      sucesso: true
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      erro: err.message
    })

  }

})





module.exports = router

