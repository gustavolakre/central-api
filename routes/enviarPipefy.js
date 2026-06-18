const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {

    try {

           console.log("=== PIPEFY ===");
           console.log("BODY:", req.body);

        const { cards } = req.body;

           console.log("CARDS:", cards);

        for (const card of cards) {

            if (card.nfCompr) {

                await axios.post(
                    "https://api.pipefy.com/graphql",
                    {
                        query: `
                        mutation {
                          updateCardField(
                            input:{
                              card_id:${card.cardId}
                              field_id:"nf_taxa_compr"
                              new_value:"${card.nfCompr}"
                            }
                          ){
                            success
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

            }

            if (card.nfFornec) {

                await axios.post(
                    "https://api.pipefy.com/graphql",
                    {
                        query: `
                        mutation {
                          updateCardField(
                            input:{
                              card_id:${card.cardId}
                              field_id:"nfs_de_servi_o"
                              new_value:"${card.nfFornec}"
                            }
                          ){
                            success
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

            }

        }

        res.json({
            sucesso: true,
            total: cards.length
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            sucesso: false,
            erro: err.message
        });

    }

});

module.exports = router;