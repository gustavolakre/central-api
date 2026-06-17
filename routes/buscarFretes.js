const express = require("express")
const router = express.Router()

const pool = require("../src/db/database")
const autenticar = require("../middlewares/autenticar")

router.use(autenticar)

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(`

            SELECT

                pipefy_card_id      AS "Código",
                titulo              AS "Título",
                etiquetas           AS "Etiquetas",
                contratante         AS "Contratante",
                numero_cte          AS "Nº CTe",
                numero_nota_fiscal  AS "Nº Nota Fiscal",
                valor_final_servico AS "Valor Final do Serviço",
                nf_servico          AS "NF Serviço",
                localizacao_destino AS "Destino"

            FROM contratacao_fretes

            WHERE fase <> '09-Cancelada'

        `)

        res.json(result.rows)

    } catch (err) {

        console.error(err)

        res.status(500).json({
            erro: err.message
        })

    }

})

module.exports = router