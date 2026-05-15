require("dotenv").config()

const path = require("path");
const express = require("express")
const cors = require("cors")
const importarPipefy = require("./routes/importarPipefy");
const importarParceiros = require("./routes/importarParceiros");
const gerarFaturamento = require("./routes/gerarFaturamento");
const buscarCargas = require("./routes/buscarCargas")
const buscarParceiros = require("./routes/buscarParceiros")



const pool = require("./src/db/database")

const app = express()

app.use(cors())
app.use(express.json())


app.use(
  express.static(
    path.join(__dirname, "faturamento")
  )
)

app.use("/importar-pipefy", importarPipefy);
app.use("/importar-parceiros", importarParceiros);
app.use("/gerar-faturamento", gerarFaturamento);
app.use(express.static(path.join(__dirname, "frontend")));

app.use("/buscar-cargas", buscarCargas)
app.use("/buscar-parceiros", buscarParceiros)

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
    });

  }

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT)
})