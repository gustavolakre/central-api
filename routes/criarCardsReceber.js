const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {

  try {

    const { cards } = req.body;

    let sucesso = 0;
    let erros = 0;
    let detalhesErros = [];

    for (const card of cards) {

      const fields = card.fields
        .map(f => `{
          field_id: "${f.field_id}",
          field_value: "${String(f.value || "").replace(/"/g, '\\"')}"
        }`)
        .join(",");

      const mutation = `
        mutation {
          createCard(
            input: {
              pipe_id: ${card.pipeId}
              title: "${card.title.replace(/"/g, '\\"')}"
              fields_attributes: [
                ${fields}
              ]
            }
          ) {
            card {
              id
              title
            }
          }
        }
      `;

      const response = await axios.post(
         "https://api.pipefy.com/graphql",
       { query: mutation },
       {
         headers: {
         Authorization: `Bearer ${process.env.PIPEFY_TOKEN}`
         }
       }
     );

       console.log(
       "PIPEFY RETORNO:",
       JSON.stringify(response.data, null, 2)
     );

     if (response.data.errors) {

         console.error(
          "ERRO PIPEFY:",
          JSON.stringify(response.data.errors, null, 2)
          );

       erros++;

       detalhesErros.push({
         title: card.title,
         erro: response.data.errors
           .map(e => e.message)
           .join(" | ")
       });

       } else {

       sucesso++;

    }

    }

    res.json({
      sucesso,
      erros,
      detalhesErros
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