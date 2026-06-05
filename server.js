require("dotenv").config()

const path = require("path")
const express = require("express")
const cors = require("cors")

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


app.use("/importar-parceiros", autenticar, importarParceiros)
app.use("/gerar-faturamento", gerarFaturamento)

app.use("/buscarDados", buscarCargas)
app.use("/buscarParceiros", buscarParceiros)

app.use("/financeiro", financeiro)
app.use("/bancos", bancos)

//app.use(
//    "/financeiro",
//    autenticar,
//    financeiro
//);

//app.use(
//    "/bancos",
//    autenticar,
//    bancos
//);

//app.use(
//    "/buscarParceiros",
//    autenticar,
//    buscarParceiros
//);

//app.use(
//    "/contas-gerenciais",
//    autenticar,
//    contasGerenciaisRoutes
//);

//app.use(
//    "/financeiro",
//    autenticar,
//    financeiro
// );

//app.use(
//    "/bancos",
//    autenticar,
//    bancos
// );



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

app.get(
    "/validar-token",
    autenticar,
    (req,res)=>{

        res.json({
            sucesso:true,
            usuario:req.usuario
        });

    }
);

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


        if(!senhaValida){

            return res.status(401).json({
                sucesso:false,
                erro:"Senha inválida"
            });

        }


        const token =
    jwt.sign(
        {
            id: usuarioDb.id,
            email: usuarioDb.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "8h"
        }
    );

return res.json({
    sucesso:true,
    token
});

        // restante do login...

    } catch(err){

        console.error(err);

        res.status(500).json({
            sucesso:false
        });

    }

});