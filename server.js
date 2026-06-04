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
const contasGerenciaisRoutes = require("./routes/contasGerenciais")

const importarCargasExcel =
require("./routes/importarCargasExcel");

const importarParceirosExcel =
  require("./routes/importarParceirosExcel");

const pool = require("./src/db/database")

const app = express()

const jwt = require("jsonwebtoken");

const autenticar =
    require("./middlewares/autenticar");

app.use(cors())
app.use(express.json())

app.use(
  "/janelas",
  express.static(path.join(__dirname, "janelas"))
)

app.use(
  "/importar-parceiros-excel",
  autenticar,
  importarParceirosExcel
);


app.use("/importar-pipefy", importarPipefy)
app.use("/importar-parceiros", autenticar, importarParceiros)
app.use("/gerar-faturamento", gerarFaturamento)

app.use("/buscarDados", buscarCargas)
app.use("/buscarParceiros", buscarParceiros)

app.use("/financeiro", financeiro)
app.use("/bancos", bancos)

app.use("/contas-gerenciais", contasGerenciaisRoutes)


app.use(
    "/importar-cargas",
    autenticar,
    importarCargasExcel
);


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

app.post("/login", (req, res) => {

    const { usuario, senha } = req.body;

    if (
        usuario !== process.env.ADMIN_USER ||
        senha !== process.env.ADMIN_PASSWORD
    ) {

        return res.status(401).json({
            sucesso: false,
            erro: "Usuário ou senha inválidos"
        });

    }

    const token = jwt.sign(

        {
            usuario
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "8h"
        }

    );

    res.json({

        sucesso: true,

        token

    });

});