const express = require("express")
const router = express.Router()

const pool = require("../src/db/database")
const autenticar = require("../middlewares/autenticar")

router.use(autenticar)


router.get("/", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM parceiros_negocio
      ORDER BY nome_usual
    `)

    res.json(result.rows)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      erro: err.message
    })

  }

})

module.exports = router