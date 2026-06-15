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
                WHEN responsavel ILIKE '%Adelar Schuh%' THEN 'Adelar Schuh'
                WHEN responsavel ILIKE '%Enário dos Santos%' THEN 'Enário dos Santos'
                WHEN responsavel ILIKE '%Vânia Riva%' THEN 'Vânia Riva'
                WHEN responsavel ILIKE '%Rafael de Lima%' THEN 'Rafael de Lima'
            END
        ELSE responsavel
    END AS responsavel_dashboard,

    TRIM(split_part(etiquetas, ',', 2)) AS semana,

    LOWER(
        REGEXP_REPLACE(
            TRIM(split_part(etiquetas, ',', 1)),
            '^[0-9]+-',
            ''
        )
    ) AS dia,

    fase,
    COUNT(*) AS quantidade

    FROM controle_cargas

    WHERE
        (
            responsavel ILIKE '%Adelar Schuh%'
            OR responsavel ILIKE '%Enário dos Santos%'
            OR responsavel ILIKE '%Vânia Riva%'
            OR responsavel ILIKE '%Rafael de Lima%'
        )

    AND fase IN (
        '01-Negociado',
        '02-Planejamento',
        '03-Programado',
        '04-Fechamento Fiscal',
        '05-Verificação',
        '06-Doc. Pendentes',
        '07-Pagamento'
    )

    GROUP BY
        CASE
            WHEN fase IN (
               '04-Fechamento Fiscal',
               '06-Doc. Pendentes'
            ) THEN
                CASE
                    WHEN responsavel ILIKE '%Adelar Schuh%' THEN 'Adelar Schuh'
                    WHEN responsavel ILIKE '%Enário dos Santos%' THEN 'Enário dos Santos'
                    WHEN responsavel ILIKE '%Vânia Riva%' THEN 'Vânia Riva'
                    WHEN responsavel ILIKE '%Rafael de Lima%' THEN 'Rafael de Lima'
                END
            ELSE responsavel
        END,

        TRIM(split_part(etiquetas, ',', 2)),

        LOWER(
            REGEXP_REPLACE(
                TRIM(split_part(etiquetas, ',', 1)),
                '^[0-9]+-',
                ''
            )
        ),

        fase

    ORDER BY semana DESC, responsavel_dashboard;
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