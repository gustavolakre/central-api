const express = require("express")
const router = express.Router()

const pool = require("../src/db/database")


/* =========================================
   LISTAR
========================================= */

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



/* =========================================
   NOVA CONTA
========================================= */

router.post("/", async(req,res)=>{

    try{

        const {
            nome,
            tipo
        } = req.body

        const result = await pool.query(`

            INSERT INTO contas_gerenciais (

                nome,
                tipo

            )

            VALUES (

                $1,$2

            )

            RETURNING *

        `,[

            nome,
            tipo

        ])

        res.json(result.rows[0])

    }

    catch(err){

        console.error(err)

        res.status(500).json({
            erro: err.message
        })

    }

})

module.exports = router