
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

console.log("ROTA IMPORTAR FRETES CARREGADA");

const importarFretes =
    require("../services/importarFretesService");

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
                                pipeId:304187133
                                pipeReportId:301066997
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
                    Authorization:
                        `Bearer ${process.env.PIPEFY_TOKEN}`
                }
            }

        );

        const exportId =
            gerar.data.data
                .exportPipeReport
                .pipeReportExport
                .id;

        //
        // 2 - AGUARDA FICAR PRONTO
        //

        let fileURL = null;

        for(let i = 0; i < 20; i++){

            await new Promise(
                r => setTimeout(r, 3000)
            );

            const consulta =
                await axios.post(

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
                        headers:{
                            Authorization:
                                `Bearer ${process.env.PIPEFY_TOKEN}`
                        }
                    }

                );

            const exportacao =
                consulta.data.data
                    .pipeReportExport;

            if(
                exportacao &&
                exportacao.state === "done"
            ){

                fileURL =
                    exportacao.fileURL;

                break;
            }

        }

        if(!fileURL){

            return res.status(500).json({
                sucesso:false,
                erro:"Relatório não ficou pronto."
            });

        }

        //
        // 3 - BAIXA XLSX
        //

        console.log("URL:", fileURL);

        const arquivo =
            await axios.get(
                fileURL,
                {
                    responseType:"arraybuffer"
                }
            );

        console.log("Arquivo baixado");

        const caminho =
            path.join(
                __dirname,
                "..",
                "temp-fretes.xlsx"
            );

        fs.writeFileSync(
          caminho,
          arquivo.data
        );

        console.log(
         "Tamanho:",
         fs.statSync(caminho).size
        );

        console.log("Arquivo salvo:", caminho);

        const resultado =
          await importarFretes(
             Buffer.from(arquivo.data)
        );

    return res.json(resultado);

    } catch(err){

        console.error(err);

        return res.status(500).json({

            sucesso:false,

            erro:err.message

        });

    }

});

module.exports = router;