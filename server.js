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

app.use("/gerar-faturamento", gerarFaturamento)


app.use(
    "/financeiro",
    autenticar,
    financeiro
);

app.use(
    "/bancos",
    autenticar,
    bancos
);

app.use(
    "/buscarParceiros",
    autenticar,
    buscarParceiros
);

app.use(
    "/contas-gerenciais",
    autenticar,
    contasGerenciaisRoutes
);

app.use(
    "/financeiro",
    autenticar,
    financeiro
 );

app.use(
    "/bancos",
    autenticar,
    bancos
 );


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

async function entrar(){

    const resposta =
        await fetch(
            "/login",
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({

                    usuario:
                        document.getElementById("usuario").value,

                    senha:
                        document.getElementById("senha").value

                })
            }
        );

    const dados =
        await resposta.json();

    console.log("STATUS:", resposta.status);
    console.log("DADOS:", dados);

    if(dados.token){

        localStorage.setItem(
            "token",
            dados.token
        );

        window.location.href =
            "/janelas/inicial.html";

    }else{

        alert(
            JSON.stringify(dados)
        );

    }

}