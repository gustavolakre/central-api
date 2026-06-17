const express = require("express");
const router = express.Router();
const pool = require("../src/db/database");

router.get("/", async (req,res)=>{

    try{

        const todasSemanas = await pool.query(`

          SELECT DISTINCT

               substring(
               etiquetas
               from '[0-9]{4}/[0-9]{2}'
           ) as semana

          FROM controle_cargas

          WHERE substring(
             etiquetas
             from '[0-9]{4}/[0-9]{2}'
          ) IS NOT NULL

           ORDER BY semana DESC

        `);

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

    

        `);

       const compradores = await pool.query(`

    SELECT

        substring(
            etiquetas
            from '[0-9]{4}/[0-9]{2}'
        ) as semana,

        comprador,

        SUM(quantidade) as total_suinos,

        COUNT(*) as total_cargas

    FROM controle_cargas

    WHERE comprador IS NOT NULL
      AND comprador <> ''
      AND substring(
            etiquetas
            from '[0-9]{4}/[0-9]{2}'
          ) IS NOT NULL

    GROUP BY
        semana,
        comprador

    ORDER BY
        SUM(quantidade) DESC

`);

const fornecedores = await pool.query(`

    SELECT

        substring(
            etiquetas
            from '[0-9]{4}/[0-9]{2}'
        ) as semana,

        fornecedor,

        SUM(quantidade) as total_suinos,

        COUNT(*) as total_cargas

    FROM controle_cargas

    WHERE fornecedor IS NOT NULL
      AND fornecedor <> ''
      AND substring(
            etiquetas
            from '[0-9]{4}/[0-9]{2}'
          ) IS NOT NULL

    GROUP BY
        semana,
        fornecedor

    ORDER BY
        SUM(quantidade) DESC

`);

const negociacoes = await pool.query(`

    SELECT

        substring(
            etiquetas
            from '[0-9]{4}/[0-9]{2}'
        ) as semana,

        comprador,

        fornecedor,

        SUM(quantidade) as total_suinos,

        COUNT(*) as total_cargas

    FROM controle_cargas

    WHERE comprador IS NOT NULL
      AND fornecedor IS NOT NULL
      AND substring(
            etiquetas
            from '[0-9]{4}/[0-9]{2}'
          ) IS NOT NULL

    GROUP BY
        semana,
        comprador,
        fornecedor

    ORDER BY
        SUM(quantidade) DESC

`);

         

        `);

        res.json({

            semanas:
                semanas.rows,

            todasSemanas: 
                todasSemanas.rows,

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