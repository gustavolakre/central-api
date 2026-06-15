const express = require("express");
const router = express.Router();
const pool = require("../src/db/database");

router.get("/dashboard/graficos", async (req,res)=>{

    try{

        const semanas = await pool.query(`

            SELECT
                substring(etiquetas from '[0-9]{4}/[0-9]{2}') as semana,

                SUM(quantidade) as total_suinos,

                COUNT(*) as total_cargas

            FROM controle_cargas

            WHERE substring(etiquetas from '[0-9]{4}/[0-9]{2}') IS NOT NULL

            GROUP BY semana

            ORDER BY semana DESC

            LIMIT 20

        `);

        res.json(semanas.rows);

    }catch(err){

        console.error(err);

        res.status(500).json({
            erro:err.message
        });

    }

});

module.exports = router;