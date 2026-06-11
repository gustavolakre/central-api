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
                WHEN responsaveis ILIKE '%Adelar Schuh%' THEN 'Adelar Schuh'
                WHEN responsaveis ILIKE '%Enário dos Santos%' THEN 'Enário dos Santos'
                WHEN responsaveis ILIKE '%Vânia Riva%' THEN 'Vânia Riva'
                WHEN responsaveis ILIKE '%Rafael de Lima%' THEN 'Rafael de Lima'
            END
        ELSE responsaveis
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
                    WHEN responsaveis ILIKE '%Adelar Schuh%' THEN 'Adelar Schuh'
                    WHEN responsaveis ILIKE '%Enário dos Santos%' THEN 'Enário dos Santos'
                    WHEN responsaveis ILIKE '%Vânia Riva%' THEN 'Vânia Riva'
                    WHEN responsaveis ILIKE '%Rafael de Lima%' THEN 'Rafael de Lima'
                END
            ELSE responsaveis
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