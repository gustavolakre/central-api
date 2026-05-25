const express = require("express")
const router = express.Router()

const pool = require("../src/db/database")



router.get("/", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM bancos
      ORDER BY nome
    `)

    res.json(result.rows)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      erro: err.message
    })

  }

})



router.post("/", async (req, res) => {

  try {

    const { nome, saldo_inicial } = req.body

    const result = await pool.query(`

      INSERT INTO bancos (
        nome,
        saldo_inicial
      )

      VALUES ($1,$2)

      RETURNING *

    `, [

      nome,
      saldo_inicial || 0

    ])

    res.json(result.rows[0])

  } catch (err) {

    console.error(err)

    res.status(500).json({
      erro: err.message
    })

  }

})



module.exports = router