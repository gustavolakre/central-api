require("dotenv").config()

const path = require("path")
const express = require("express")
const cors = require("cors")

const importarPipefy = require("./routes/importarPipefy")
const importarParceiros = require("./routes/importarParceiros")
const gerarFaturamento = require("./routes/gerarFaturamento")
const buscarCargas = require("./routes/buscarCargas")
const buscarParceiros = require("./routes/buscarParceiros")
const financeiro = require("./routes/financeiro")
const bancos = require("./routes/bancos")


const pool = require("./src/db/database")

const app = express()

app.use(cors())
app.use(express.json())

app.use(express.static(path.join(__dirname, "faturamento")))

app.use("/importar-pipefy", importarPipefy)
app.use("/importar-parceiros", importarParceiros)
app.use("/gerar-faturamento", gerarFaturamento)

app.use("/buscarDados", buscarCargas)
app.use("/buscarParceiros", buscarParceiros)

app.use("/financeiro", financeiro)
app.use("/bancos", bancos)


app.get("/", async (req, res) => {

  try {

    await pool.query("SELECT NOW()")

    res.status(200).send("API ONLINE")

  } catch (err) {

    console.error(err)

    res.status(500).send("ERRO DB")

  }

})

const PORT = process.env.PORT || 3000

app.listen(PORT, "0.0.0.0", () => {

  console.log(`Servidor rodando na porta ${PORT}`)

})