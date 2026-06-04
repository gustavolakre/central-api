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

const bcrypt = require("bcrypt");

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

app.post("/login", async (req, res) => {

    try {

        const { usuario, senha } = req.body;

        console.log("Email recebido:", usuario);

        const resultado =
            await pool.query(
                `
                SELECT *
                FROM usuarios
                WHERE email = $1
                `,
                [usuario]
            );

        console.log(
            "Usuários encontrados:",
            resultado.rows.length
        );

        if(resultado.rows.length === 0){

            return res.status(401).json({
                sucesso:false,
                erro:"Usuário não encontrado"
            });

        }

        const usuarioDb =
            resultado.rows[0];

        console.log(
            "Hash banco:",
            usuarioDb.senha
        );

        const senhaValida =
            await bcrypt.compare(
                senha,
                usuarioDb.senha
            );

        console.log(
            "Senha válida:",
            senhaValida
        );

        if(!senhaValida){

            return res.status(401).json({
                sucesso:false,
                erro:"Senha inválida"
            });

        }

        // restante do login...

    } catch(err){

        console.error(err);

        res.status(500).json({
            sucesso:false
        });

    }

});