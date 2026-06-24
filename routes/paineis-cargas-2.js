const express = require("express");
const router = express.Router();
const pool = require("../src/db/database");

router.get("/", async (req,res)=>{

    try{

        const resultado = await pool.query(`

            SELECT

                substring(
                    cc.etiquetas
                    from '[0-9]{4}/[0-9]{2}'
                ) as semana,

                cc.fornecedor,

                cc.comprador,

                cc.tipo_suino,

                cc.frete, 

                cc.peso,

                cc.preco_kg,

                pf.uf as estado_fornecedor,

                pc.uf as estado_comprador,

               

                SUM(
                    COALESCE(cc.quantidade,0)
                ) as quantidade

            FROM controle_cargas cc

            LEFT JOIN parceiros_negocio pf
                ON pf.nome_usual = cc.fornecedor

            LEFT JOIN parceiros_negocio pc
                ON pc.nome_usual = cc.comprador

            WHERE substring(
                cc.etiquetas
                from '[0-9]{4}/[0-9]{2}'
            ) IS NOT NULL

                AND COALESCE(cc.fase,'') <> '09-Cancelada'

            GROUP BY

                semana,
                cc.fornecedor,
                cc.comprador,
                cc.tipo_suino,
                cc.frete,
                cc.peso,
                cc.preco_kg,
                pf.uf,
                pc.uf

            ORDER BY semana

        `);

        res.json(resultado.rows);

    }catch(erro){

        console.error(erro);

        res.status(500).json({
            erro: erro.message
        });

    }

});

module.exports = router;