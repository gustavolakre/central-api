const express = require("express");
const router = express.Router();

const pool = require("../src/db/database");

const autenticar = require("../middlewares/autenticar");

router.use(autenticar);


/* =========================================
   CONSULTAR STATUS
========================================= */

router.get("/:processo", async (req, res) => {

    try {

        const { processo } = req.params;

        const result = await pool.query(`

            SELECT *
            FROM controle_processos
            WHERE processo = $1

        `, [processo]);

        res.json(result.rows[0]);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            erro: err.message
        });

    }

});


/* =========================================
   INICIAR PROCESSO
========================================= */

router.post("/iniciar", async (req, res) => {

    try {

        const { processo } = req.body;

        const usuario =
            req.usuario.usuario;

        const atual = await pool.query(`

            SELECT *
            FROM controle_processos
            WHERE processo = $1

        `, [processo]);

        if (
            atual.rows[0].status ===
            "EM_ANDAMENTO"
        ) {

            return res.status(409).json({

                erro:
                    `Processo iniciado por ${
                        atual.rows[0].iniciado_por
                    }`

            });

        }

        await pool.query(`

            UPDATE controle_processos

            SET

                status = 'EM_ANDAMENTO',

                iniciado_por = $1,

                iniciado_em = NOW(),

                finalizado_em = NULL

            WHERE processo = $2

        `, [

            usuario,
            processo

        ]);

        res.json({
            sucesso: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            erro: err.message
        });

    }

});


/* =========================================
   FINALIZAR PROCESSO
========================================= */

router.post("/finalizar", async (req, res) => {

    try {

        const { processo } = req.body;

        await pool.query(`

            UPDATE controle_processos

            SET

                status = 'LIVRE',

                finalizado_em = NOW()

            WHERE processo = $1

        `, [processo]);

        res.json({
            sucesso: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            erro: err.message
        });

    }

});


module.exports = router;