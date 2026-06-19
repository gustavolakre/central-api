const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {

  try {

    const { cards } = req.body;

    let sucesso = 0;
    let erros = 0;

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
        "PIPEFY CREATE:",
        JSON.stringify(response.data, null, 2)
      );

      if (response.data.errors) {
        erros++;
      } else {
        sucesso++;
      }

    }

    res.json({
      sucesso,
      erros
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