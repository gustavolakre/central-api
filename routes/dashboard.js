const express = require("express");
const router = express.Router();

const pool =
    require("../src/db/database");

router.get("/pipeline", async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                responsaveis,
                COALESCE(
                   substring(etiquetas from '[0-9]{4}/[0-9]{2}'),
                   TRIM(etiquetas)
                ) AS semana
                fase,
                COUNT(*) AS quantidade
            FROM controle_cargas
            WHERE responsaveis IN (
                'Adelar Schuh',
                'Enário dos Santos',
                'Vânia Riva',
                'Rafael de Lima'
            )
            AND fase IN (
                '01-Negociado',
                '02-Planejamento',
                '03-Programado',
                '04-Fechamento Fiscal',
                '05-Verificação',
                '06-Doc. Pendentes'
            )
            GROUP BY
                responsaveis,
                semana,
                fase
            ORDER BY
                semana DESC,
                responsaveis
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