//FUNÇÃO DO ARQUIVO:
//Consulta a tabela no raliway.
//Filtra apenas os registros desejados.
//Converte o resultado para JSON.
//Envia os dados para o navegador.





const express = require("express")
const router = express.Router()

const pool = require("../src/db/database")


router.get("/", async(req,res)=>{

    try{

        const result = await pool.query(`

            SELECT *
            FROM contas_gerenciais
            ORDER BY nome ASC

        `)

        res.json(result.rows)

    }

    catch(err){

        console.error(err)

        res.status(500).json({
            erro: err.message
        })

    }

})


module.exports = router