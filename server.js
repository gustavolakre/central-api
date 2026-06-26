require("dotenv").config()

const path = require("path")
const express = require("express")
const cors = require("cors")

const gerarFaturamento = require("./routes/gerarFaturamento")
const buscarCargas = require("./routes/buscarCargas")
const buscarParceiros = require("./routes/buscarParceiros")
const buscarFretes = require("./routes/buscarFretes")
const financeiro = require("./routes/financeiro")
const bancos = require("./routes/bancos")
const contasGerenciaisRoutes = require("./routes/contasGerenciais")

const importarCargasExcel =
require("./routes/importarCargasExcel");

const importarParceirosExcel =
  require("./routes/importarParceirosExcel");

const importarParceiros =
  require("./routes/importarParceiros");

const pool = require("./src/db/database")

const app = express()

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const autenticar =
    require("./middlewares/autenticar");

const importarCargasRelatorio =
require("./routes/importarCargasRelatorio");

const controleFaturamento =
    require("./routes/controleFaturamento");

const dashboard =
    require("./routes/dashboard");

const paineisCargas =
    require("./routes/paineis-cargas");

const paineisCargas2 =
    require("./routes/paineis-cargas-2");

const importarFretesRelatorio =
    require("./routes/importarFretesRelatorio");

const importarFretesExcel =
    require("./routes/importarFretesExcel");

const faturamentoSessao =
    require("./routes/faturamentoSessao");

const enviarPipefy = require("./routes/enviarPipefy");

const criarCardsReceber =
  require("./routes/criarCardsReceber");

const perfisRouter = require("./routes/perfis-graficos");

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

module.exports.io = io;

app.set("io", io);


const ultimaAtualizacao = require("./services/ultimaAtualizacao");

ultimaAtualizacao.garantirTabela().catch(err => {
    console.error("Erro ao preparar tabela de atualizações:", err);
});

io.on("connection", (socket) => {
    console.log("cliente conectado");

    ultimaAtualizacao.enviarTodas(socket);
});

app.use(cors())
app.use(express.json())

// Login público
app.get("/login", (req, res) => {
  res.sendFile(
    path.join(__dirname, "janelas", "login.html")
  );
});

// Todas as demais janelas protegidas
app.use(
  "/janelas",
  express.static(path.join(__dirname, "janelas"))
);

app.use(
  "/importar-parceiros-excel",
  autenticar,
  importarParceirosExcel
);

app.use(
  "/importar-parceiros",
  importarParceiros
);

app.use(
    "/gerar-faturamento",
    autenticar,
    gerarFaturamento
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
    "/buscarParceiros",
    autenticar,
    buscarParceiros
);

app.use(
    "/buscarCargas",
    autenticar,
    buscarCargas
);

app.use(
    "/contas-gerenciais",
    autenticar,
    contasGerenciaisRoutes
);

app.use(
    "/importar-cargas",
    autenticar,
    importarCargasExcel
);

app.use(
    "/importar-cargas-relatorio",
    autenticar,
    importarCargasRelatorio
);

app.use(
    "/controle-faturamento",
    controleFaturamento
);

app.use(
    "/faturamento-sessao",
    faturamentoSessao
);

app.use(
    "/dashboard",
    autenticar,
    dashboard
);

app.use(
    "/paineis-cargas",
    paineisCargas
);

app.use(
    "/paineis-cargas-2",
    paineisCargas2
);

app.use(
    "/importar-fretes-relatorio",
    importarFretesRelatorio
);

app.use(
    "/importar-fretes",
    autenticar,
    importarFretesExcel
);

app.use(
    "/buscarFretes",
    require("./routes/buscarFretes")
)

app.use("/metricas", require("./routes/metricas"));

app.use(
    "/pipefy",
    autenticar,
    enviarPipefy
);


app.use(
  "/criar-cards-receber",
  autenticar,
  criarCardsReceber
);


app.use("/paineis-cargas-2/perfis", perfisRouter);

app.get("/", (req, res) => {
  res.redirect("/login");
});

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


app.post("/login", async (req, res) => {

    try {

        const { usuario, senha } = req.body;

        const resultado = await pool.query(
            `
            SELECT *
            FROM usuarios
            WHERE email = $1
            `,
            [usuario]
        );

        if (resultado.rows.length === 0) {

            return res.status(401).json({
                sucesso: false,
                erro: "Usuário não encontrado"
            });

        }

        const usuarioDb = resultado.rows[0];

        const senhaValida =
            await bcrypt.compare(
                senha,
                usuarioDb.senha
            );

        if (!senhaValida) {

            return res.status(401).json({
                sucesso: false,
                erro: "Senha inválida"
            });

        }

        console.log("USUARIO LOGIN:", usuarioDb);

        const token = jwt.sign(
            {
                id: usuarioDb.id,
                email: usuarioDb.email,
                perfil: usuarioDb.perfil
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        console.log("TOKEN GERADO:", token);

       const payload = jwt.verify(
          token,
          process.env.JWT_SECRET
       );

       console.log("PAYLOAD TOKEN:", payload);

        return res.json({
            sucesso: true,
            token
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            sucesso: false,
            erro: err.message
        });

    }

});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})



