
// FUNÇÃO DO ARQUIVO:
//Recebe uma requisição HTTP (POST).
//Chama a API GraphQL do Pipefy.
//Solicita a geração de um relatório específico (pipeId e pipeReportId).
//Aguarda o Pipefy terminar a exportação.
//Obtém a URL do arquivo gerado.
//Baixa o arquivo Excel.
//Envia esse arquivo para importarCargas().
//Retorna ao usuário o resultado da importação.

// resummo:Busca o relatório mais recente no Pipefy e manda os dados para o importador gravar no banco.


require("dotenv").config();

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const importarCargas =
  require("../services/importarCargasService");

// 🔥 IMPORTANTE: pega o io do server

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    //
    // 1 - GERA RELATÓRIO
    //
    const gerar = await axios.post(
      "https://api.pipefy.com/graphql",
      {
        query: `
          mutation {
            exportPipeReport(
              input:{
                pipeId:304131962
                pipeReportId:301064116
              }
            ){
              pipeReportExport{
                id
              }
            }
          }
        `
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PIPEFY_TOKEN}`
        }
      }
    );

    const exportId =
      gerar.data.data.exportPipeReport.pipeReportExport.id;

    //
    // 2 - AGUARDA EXPORTAÇÃO
    //
    let fileURL = null;

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));

      const consulta = await axios.post(
        "https://api.pipefy.com/graphql",
        {
          query: `
            query {
              pipeReportExport(
                id:${exportId}
              ){
                id
                state
                fileURL
              }
            }
          `
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PIPEFY_TOKEN}`
          }
        }
      );

      const exportacao =
        consulta.data.data.pipeReportExport;

      if (exportacao && exportacao.state === "done") {
        fileURL = exportacao.fileURL;
        break;
      }
    }

    if (!fileURL) {
      return res.status(500).json({
        sucesso: false,
        erro: "Relatório não ficou pronto."
      });
    }

    //
    // 3 - BAIXA ARQUIVO
    //
    const arquivo = await axios.get(fileURL, {
      responseType: "arraybuffer"
    });

    const caminho = path.join(
      __dirname,
      "..",
      "temp-cargas.xlsx"
    );

    fs.writeFileSync(caminho, arquivo.data);

    //
    // 4 - IMPORTA NO BANCO
    //
    const resultado = await importarCargas(
      Buffer.from(arquivo.data)
    );

    //
    // 5 - 🔥 DISPARA SOCKET PARA TODOS OS PAINÉIS
    //
    const dataHora =
  new Date().toLocaleDateString("pt-BR") +
  " " +
  new Date().toLocaleTimeString("pt-BR");

const io = req.app.get("io");

if (!io) {
    console.log("ERRO: io não encontrado!");
} else {
    req.app.set("ultimaAtualizacaoPipefy", dataHora);

    io.emit("ultimaAtualizacaoPipefy", {
        data: dataHora
    });
}

//
// 6 - RESPOSTA FINAL
//
return res.json(resultado);

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      sucesso: false,
      erro: err.message
    });
  }
});

module.exports = router;

