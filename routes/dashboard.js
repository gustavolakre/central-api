const express = require("express");
const router = express.Router();

const pool =
    require("../src/db/database");

router.get("/pipeline", async (req, res) => {

    try {

     const resultado = await pool.query(`
    SELECT

    responsavel AS responsavel_dashboard,

    substring(
        etiquetas
        from '[0-9]{4}/[0-9]{2}'
    ) AS semana,

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

WHERE responsavel IN (
    'Adelar Schuh',
    'Enário dos Santos',
    'Rafael de Lima',
    'Vânia Riva'
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
    responsavel,
    substring(
        etiquetas
        from '[0-9]{4}/[0-9]{2}'
    ),
    LOWER(
        REGEXP_REPLACE(
            TRIM(split_part(etiquetas, ',', 1)),
            '^[0-9]+-',
            ''
        )
    ),
    fase

ORDER BY
    semana DESC,
    responsavel;
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