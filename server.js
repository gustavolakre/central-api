require("dotenv").config()

const express = require("express")
const cors = require("cors")

const pool = require("./src/db/database")

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", async (req, res) => {

  try {

    const result = await pool.query("SELECT NOW()")

    res.json({
      online: true,
      banco: true,
      horario: result.rows[0]
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      online: true,
      banco: false,
      erro: err.message
    })

  }

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT)
})