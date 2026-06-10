const express = require("express");
const router = express.Router();

const pool =
    require("../src/db/database");

router.get("/pipeline", async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT

    CASE

        WHEN fase IN (
           '04-Fechamento Fiscal',
           '06-Doc. Pendentes'
        ) THEN

            CASE

                WHEN responsaveis ILIKE '%Adelar Schuh%'
                    THEN 'Adelar Schuh'

                WHEN responsaveis ILIKE '%Enário dos Santos%'
                    THEN 'Enário dos Santos'

                WHEN responsaveis ILIKE '%Vânia Riva%'
                    THEN 'Vânia Riva'

                WHEN responsaveis ILIKE '%Rafael de Lima%'
                    THEN 'Rafael de Lima'

            END

        ELSE responsaveis

    END AS responsavel_dashboard,

            substring(
                etiquetas
                from '[0-9]{4}/[0-9]{2}'
            ) AS semana,

            fase,
            COUNT(*) AS quantidade
            FROM controle_cargas
            WHERE
            (
                responsaveis ILIKE '%Adelar Schuh%'
                OR responsaveis ILIKE '%Enário dos Santos%'
                OR responsaveis ILIKE '%Vânia Riva%'
                OR responsaveis ILIKE '%Rafael de Lima%'
            )
            AND fase IN (
                '01-Negociado',
                '02-Planejamento',
                '03-Programado',
                '04-Fechamento Fiscal',
                '06-Doc. Pendentes'
            )
            GROUP BY
                responsavel_dashboard,
                semana,
                fase
            ORDER BY
                semana DESC,
                responsavel_dashboard
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