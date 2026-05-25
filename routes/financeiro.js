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
      origem,
      parceiro,
      parceiro_id,
      banco,
      semana,
      produto_servico,
      descricao,
      nota_fiscal,
      valor,
      vencimento,
      pagamento,
      status,
      observacao

    } = req.body

    const result = await pool.query(`

      INSERT INTO financeiro (

        tipo,
        origem,
        parceiro,
        parceiro_id,
        banco,
        semana,
        produto_servico,
        descricao,
        nota_fiscal,
        valor,
        vencimento,
        pagamento,
        status,
        observacao

      )

      VALUES (

        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14

      )

      RETURNING *

    `, [

      tipo,
      origem,
      parceiro,
      parceiro_id,
      banco,
      semana,
      produto_servico,
      descricao,
      nota_fiscal,
      valor,
      vencimento,
      pagamento,
      status,
      observacao

    ])

    res.json(result.rows[0])

  } catch (err) {

    console.error(err)

    res.status(500).json({
      erro: err.message
    })

  }

})



/* =========================================
   BAIXAR LANÇAMENTO
========================================= */

router.put("/:id/pagar", async (req, res) => {

  try {

    const { id } = req.params

    const result = await pool.query(`

      UPDATE financeiro
      SET
        status = 'PAGO',
        pagamento = NOW()
      WHERE id = $1
      RETURNING *

    `, [id])

    res.json(result.rows[0])

  } catch (err) {

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