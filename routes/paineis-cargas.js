const express = require("express");
const router = express.Router();
const pool = require("../src/db/database");

router.get("/", async (req,res)=>{

    try{

        const semanas = await pool.query(`

            SELECT

                substring(
                    etiquetas
                    from '[0-9]{4}/[0-9]{2}'
                ) as semana,

                SUM(quantidade) as total_suinos,

                COUNT(*) as total_cargas

            FROM controle_cargas

            WHERE substring(
                etiquetas
                from '[0-9]{4}/[0-9]{2}'
            ) IS NOT NULL

            GROUP BY semana

            ORDER BY semana DESC

            LIMIT 20

        `);

        const compradores = await pool.query(`

            SELECT

                comprador,

                SUM(quantidade) as total_suinos,

                COUNT(*) as total_cargas

            FROM controle_cargas

            WHERE comprador IS NOT NULL
              AND comprador <> ''

            GROUP BY comprador

            ORDER BY
                SUM(quantidade) DESC

            LIMIT 20

        `);

        const fornecedores = await pool.query(`

            SELECT

                fornecedor,

                SUM(quantidade) as total_suinos,

                COUNT(*) as total_cargas

            FROM controle_cargas

            WHERE fornecedor IS NOT NULL
              AND fornecedor <> ''

            GROUP BY fornecedor

            ORDER BY
                SUM(quantidade) DESC

            LIMIT 20

        `);

        const negociacoes = await pool.query(`

            SELECT

                comprador,

                fornecedor,

                SUM(quantidade) as total_suinos,

                COUNT(*) as total_cargas

            FROM controle_cargas

            WHERE comprador IS NOT NULL
              AND fornecedor IS NOT NULL

            GROUP BY
                comprador,
                fornecedor

            ORDER BY
                SUM(quantidade) DESC

            LIMIT 20

        `);

        res.json({

            semanas:
                semanas.rows,

            compradores:
                compradores.rows,

            fornecedores:
                fornecedores.rows,

            negociacoes:
                negociacoes.rows

        });

    }catch(err){

        console.error(err);

        res.status(500).json({
            erro: err.message
        });

    }

});

module.exports = router;