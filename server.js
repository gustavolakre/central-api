require("dotenv").config()

const express = require("express")
const cors = require("cors")

console.log("1")

const app = express()

app.use(cors())
app.use(express.json())

console.log("2")

require("./src/db/database")
console.log("3")

require("./routes/importarPipefy")
console.log("4")

app.get("/", (req, res) => {
  res.send("API ONLINE")
})

const PORT = process.env.PORT || 3000

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})