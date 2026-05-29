const express = require("express")
const router = express.Router()

const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

const pool = require("../src/db/database")


/* =========================================
   LOGIN
========================================= */

router.post("/login", async (req, res) => {

    try {

        const { email, senha } = req.body

        if (!email || !senha) {

            return res.status(400).json({
                erro: "Email e senha obrigatórios"
            })

        }


        /* BUSCAR USUÁRIO */

        const result = await pool.query(`

            SELECT *
            FROM usuarios
            WHERE email = $1

        `, [email])


        if (!result.rows.length) {

            return res.status(401).json({
                erro: "Usuário não encontrado"
            })

        }


        const usuario = result.rows[0]


        /* VALIDAR SENHA */

        const senhaCorreta =
            await bcrypt.compare(
                senha,
                usuario.senha
            )


        if (!senhaCorreta) {

            return res.status(401).json({
                erro: "Senha inválida"
            })

        }


        /* GERAR TOKEN */

        const token = jwt.sign(

            {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "12h"
            }

        )


        res.json({

            token,

            usuario: {

                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email

            }

        })

    }

    catch (err) {

        console.error(err)

        res.status(500).json({
            erro: err.message
        })

    }

})

module.exports = router