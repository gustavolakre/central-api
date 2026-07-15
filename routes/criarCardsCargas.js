const express = require("express");
const axios = require("axios");

const router = express.Router();


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



                /*
                    CONNECTORS
                */

                adicionarCampo(
                    "comprador_restored",
                    card.compradorId
                );


                adicionarCampo(
                    "fornecedor",
                    card.fornecedorId
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


                adicionarCampo(
                    "data_e_hora_da_carga",
                    card.embarque
                );


                adicionarCampo(
                    "data_e_hora_de_desembarque",
                    card.descarga
                );



                /*
                    ETIQUETA OBRIGATÓRIA

                    Ex:
                    03-Quarta, 2026/29
                */


                const etiqueta = 
                `${card.etiquetaDia}, ${card.etiquetaSemana}`;


                adicionarCampo(
                    "etiquetas",
                    etiqueta
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
                    "PIPEFY:",
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



                }else{


                    sucesso++;


                }



            }catch(err){


                erros++;


                detalhesErros.push({

                    card:
                    card.fornecedorNome,

                    erro:err.message

                });


            }


        }



        return res.json({

            sucesso:true,

            criados:sucesso,

            erros,

            detalhesErros

        });



    }catch(err){


        console.error(err);


        return res.status(500).json({

            sucesso:false,

            erro:err.message

        });


    }


});


module.exports = router;