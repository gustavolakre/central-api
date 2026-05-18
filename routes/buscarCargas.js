const express = require("express")
const router = express.Router()

const pool = require("../src/db/database")

router.get("/", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM controle_cargas
    
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