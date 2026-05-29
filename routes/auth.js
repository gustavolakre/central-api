// routes/auth.js

const express = require("express")
const router = express.Router()

const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const pool = require("../src/db/database")

const JWT_SECRET = process.env.JWT_SECRET


router.post("/login", async (req, res) => {

    try{

        const {
            email,
            senha
        } = req.body

        const result = await pool.query(`

            SELECT *
            FROM usuarios
            WHERE email = $1

        `,[email])

        if(!result.rows.length){

            return res.status(401).json({
                erro:"Usuário não encontrado"
            })

        }

        const usuario = result.rows[0]

        const senhaOk = await bcrypt.compare(
            senha,
            usuario.senha
        )

        if(!senhaOk){

            return res.status(401).json({
                erro:"Senha inválida"
            })

        }

        const token = jwt.sign(

            {
                id:usuario.id,
                nome:usuario.nome,
                email:usuario.email
            },

            JWT_SECRET,

            {
                expiresIn:"12h"
            }

        )

        res.json({
            token
        })

    }

    catch(err){

        console.error(err)

        res.status(500).json({
            erro:err.message
        })

    }

})

module.exports = router