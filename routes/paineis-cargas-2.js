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

    cc.quantidade as quantidade,

    cc.peso as peso,

    cc.preco_kg as preco_kg,

    -- 🔥 preço normalizado (REGRA CORRETA)
    CASE 
        WHEN cc.preco_kg > 20 THEN cc.preco_kg / 10.0
        ELSE cc.preco_kg
    END AS preco_kg_normalizado,

    -- 🔥 valor corrigido usando preço normalizado
    CASE 
        WHEN cc.peso > 0 AND cc.preco_kg > 0 THEN
            cc.peso * (
                CASE 
                    WHEN cc.preco_kg > 20 THEN cc.preco_kg / 10.0
                    ELSE cc.preco_kg
                END
            )
        ELSE 0
    END AS valor

FROM controle_cargas cc

LEFT JOIN parceiros_negocio pf
    ON pf.nome_usual = cc.fornecedor

LEFT JOIN parceiros_negocio pc
    ON pc.nome_usual = cc.comprador

WHERE substring(cc.etiquetas from '[0-9]{4}/[0-9]{2}') IS NOT NULL
  AND COALESCE(cc.fase,'') <> '09-Cancelada'
  AND COALESCE(cc.peso, 0) > 0
  AND COALESCE(cc.preco_kg, 0) > 0

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