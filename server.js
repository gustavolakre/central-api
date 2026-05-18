require("dotenv").config()

const express = require("express")
const cors = require("cors")

console.log("1 - express ok")

const app = express()

app.use(cors())
app.use(express.json())

console.log("2 - middlewares ok")

// TESTE IMPORTS
require("./src/db/database")
console.log("3 - database ok")

require("./routes/importarPipefy")
console.log("4 - importarPipefy ok")

require("./routes/importarParceiros")
console.log("5 - importarParceiros ok")

require("./routes/gerarFaturamento")
console.log("6 - gerarFaturamento ok")

require("./routes/buscarCargas")
console.log("7 - buscarCargas ok")

require("./routes/buscarParceiros")
console.log("8 - buscarParceiros ok")

app.get("/", (req, res) => {
  res.send("API ONLINE")
})

const PORT = process.env.PORT || 3000

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})