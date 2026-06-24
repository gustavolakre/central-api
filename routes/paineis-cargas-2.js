const express = require("express");
const router = express.Router();
const pool = require("../src/db/database");

router.get("/", async (req,res)=>{

    try{

       const resultado = await pool.query(`
   SELECT
    substring(cc.etiquetas from '[0-9]{4}/[0-9]{2}') as semana,

    cc.fornecedor,
    cc.comprador,
    cc.tipo_suino,
    cc.frete,

    pf.uf as estado_fornecedor,
    pc.uf as estado_comprador,

    SUM(
        CASE 
            WHEN cc.quantidade IS NOT NULL 
            THEN cc.quantidade 
            ELSE 0 
        END
    ) as quantidade,

    SUM(
        CASE 
            WHEN cc.peso IS NOT NULL 
             AND cc.preco_kg IS NOT NULL
            THEN cc.peso * cc.preco_kg
            ELSE 0
        END
    ) as valor_total,

    SUM(
        CASE 
            WHEN cc.peso IS NOT NULL 
            THEN cc.peso
            ELSE 0
        END
    ) as peso_total

FROM controle_cargas cc

LEFT JOIN parceiros_negocio pf
    ON pf.nome_usual = cc.fornecedor

LEFT JOIN parceiros_negocio pc
    ON pc.nome_usual = cc.comprador

WHERE substring(cc.etiquetas from '[0-9]{4}/[0-9]{2}') IS NOT NULL
  AND COALESCE(cc.fase,'') <> '09-Cancelada'
  AND cc.peso IS NOT NULL
  AND cc.preco_kg IS NOT NULL

GROUP BY
    semana,
    cc.fornecedor,
    cc.comprador,
    cc.tipo_suino,
    cc.frete,
    pf.uf,
    pc.uf

ORDER BY semana;
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