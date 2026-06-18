const express = require("express");
const router = express.Router();
const pool = require("../src/db/database");

router.get("/", async (req,res)=>{

    try{

        const resultado = await pool.query(`

            SELECT
                titulo,
                responsavel,
                etiquetas,

                crm,
                nota_fiscal,
                cnpj,
                documentacao,

                verificacao_peso,
                verificacao_condenacoes,
                verificacao_mortalidade,

                fase

            FROM controle_cargas

            WHERE
                COALESCE(fase,'') <> '09-Cancelada'

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