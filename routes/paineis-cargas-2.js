const express = require("express");
const router = express.Router();

const pool = require("../src/db/database");

router.get("/", async (req, res) => {

    try {

        const resultado = await pool.query(`

            SELECT

                substring(
                    c.etiquetas
                    from '[0-9]{4}/[0-9]{2}'
                ) as semana,

                c.fornecedor,

                c.comprador,

                COALESCE(
                    pf.estado,
                    'N/A'
                ) as estado_fornecedor,

                COALESCE(
                    pc.estado,
                    'N/A'
                ) as estado_comprador,

                SUM(
                    COALESCE(c.quantidade,0)
                ) as total_suinos

            FROM controle_cargas c

            LEFT JOIN parceiros_negocio pf
                ON trim(lower(pf.nome))
                 = trim(lower(c.fornecedor))

            LEFT JOIN parceiros_negocio pc
                ON trim(lower(pc.nome))
                 = trim(lower(c.comprador))

            GROUP BY

                semana,

                c.fornecedor,

                c.comprador,

                pf.estado,

                pc.estado

            ORDER BY semana

        `);

        res.json(resultado.rows);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: erro.message
        });

    }

});

module.exports = router;