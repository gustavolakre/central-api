const express = require("express");
const axios = require("axios");

const router = express.Router();

/** ID bruto do record connector Pipefy (sem JSON.stringify). */
function normalizarConnectorId(value) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    let id = value;

    for (let i = 0; i < 3; i++) {
        if (typeof id !== "string") {
            id = String(id);
            break;
        }

        const trimmed = id.trim();
        if (!trimmed) {
            return null;
        }

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                id = parsed[0];
                continue;
            }
            if (typeof parsed === "string" || typeof parsed === "number") {
                id = String(parsed);
                continue;
            }
        } catch {
            id = trimmed;
        }

        break;
    }

    id = String(id ?? "").trim();
    return id || null;
}


router.post("/", async (req, res) => {

    try {

        const { cards } = req.body;


        if (!cards || !Array.isArray(cards)) {

            return res.status(400).json({

                sucesso:false,

                erro:"Nenhum card recebido"

            });

        }


        const PIPE_ID = "304131962";


        const RESPONSAVEIS = {

            "Adelar Schuh": "306443829",
            "Ana Wust": "305728998",
            "Bruna Jaine Anderson": "308039901",
            "Bruno Panatta": "307550459",
            "Enário dos Santos": "307046790",
            "Henrique": "304564865",
            "Jeferson A. Antunes": "304569850",
            "Rafael de Lima": "307776597",
            "Luiz Gustavo Deon": "307283950",
            "Vânia Riva": "305099902",
            "Mikael Silva Sousa": "307046791",
            "Wanderson Agostinho": "305205639"

        };



        let sucesso = 0;
        let erros = 0;

        let detalhesErros = [];



        for (const card of cards) {


            try {


                const fields = [];



                function adicionarCampo(field_id, value){


                    if(
                        value !== undefined &&
                        value !== null &&
                        value !== ""
                    ){

                        fields.push({

                            field_id,

                            value:String(value)

                        });

                    }

                }



                function adicionarConnector(field_id, value){

                    const id = normalizarConnectorId(value);

                    if(!id){
                        return;
                    }

                    fields.push({

                        field_id,

                        value: id

                    });

                }



                /*
                    CONNECTORS
                */


                adicionarConnector(
                    "comprador_restored",
                    card.compradorId
                );


                adicionarConnector(
                    "fornecedor",
                    card.fornecedorId
                );



                /*
                    RESPONSÁVEL
                    assignee_select recebe somente ID
                */


                adicionarCampo(
                    "respons_vel",
                    RESPONSAVEIS["Luiz Gustavo Deon"]
                );



                /*
                    CAMPOS NORMAIS
                */


                adicionarCampo(
                    "frete",
                    card.frete
                );


                adicionarCampo(
                    "tipo_su_no",
                    card.tipoSuino
                );


                adicionarCampo(
                    "quantidade",
                    card.quantidade
                );


                adicionarCampo(
                    "pre_o_kg",
                    card.preco
                );


                adicionarCampo(
                    "prazo_negociado",
                    card.prazo
                );



                /*
                    TESTE
                    Comentados para validar criação básica

                adicionarCampo(
                    "data_e_hora_da_carga",
                    card.embarque
                );


                adicionarCampo(
                    "data_e_hora_de_desembarque",
                    card.descarga
                );


                const etiqueta =
                `${card.etiquetaDia}, ${card.etiquetaSemana}`;


                adicionarCampo(
                    "etiquetas",
                    etiqueta
                );

                */



                console.log(
                    "FIELDS ENVIADOS:",
                    JSON.stringify(
                        fields,
                        null,
                        2
                    )
                );




                const fieldsGraphQL = fields

                    .map(f => {


                        return `{

                            field_id:"${f.field_id}"

                            field_value:"${String(f.value)
                                .replace(/"/g,'\\"')}"

                        }`;


                    })

                    .join(",");





                const titulo =
                `${card.fornecedorNome} - ${card.compradorNome}`;





                const mutation = `

                mutation {

                    createCard(

                        input:{


                            pipe_id:${PIPE_ID}


                            title:"${titulo}"


                            fields_attributes:[

                                ${fieldsGraphQL}

                            ]


                        }

                    ){


                        card{

                            id

                            title

                        }


                    }


                }

                `;


                console.log(
                  "MUTATION ENVIADA:",
                  mutation
                );


                const response = await axios.post(


                    "https://api.pipefy.com/graphql",


                    {

                        query: mutation

                    },


                    {

                        headers:{

                            Authorization:
                            `Bearer ${process.env.PIPEFY_TOKEN}`

                        }

                    }


                );




                console.log(

                    "PIPEFY RESPONSE:",

                    JSON.stringify(
                        response.data,
                        null,
                        2
                    )

                );




                if(response.data.errors){


                    erros++;


                    detalhesErros.push({

                        card:titulo,

                        erro:
                        response.data.errors
                        .map(e=>e.message)
                        .join(" | ")

                    });


                }
                else{


                    sucesso++;


                }




            }
            catch(err){


                erros++;


                detalhesErros.push({

                    card:
                    card.fornecedorNome,


                    erro:
                    err.response?.data ||
                    err.message

                });


            }


        }




        return res.json({

            sucesso:true,

            criados:sucesso,

            erros,

            detalhesErros

        });




    }
    catch(err){


        console.error(err);


        return res.status(500).json({

            sucesso:false,

            erro:err.message

        });


    }


});



module.exports = router;