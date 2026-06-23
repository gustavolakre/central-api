const express = require("express");
const router = express.Router();
const pool = require("../src/db/database");


// LISTAR PERFIS

router.get("/", async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                id,
                nome
            FROM perfis_graficos
            ORDER BY nome
        `);

        res.json(resultado.rows);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: erro.message
        });

    }

});


// BUSCAR UM PERFIL

router.get("/:id", async (req, res) => {

    try {

        const resultado = await pool.query(
            `
            SELECT *
            FROM perfis_graficos
            WHERE id=$1
            `,
            [req.params.id]
        );

        if (!resultado.rows.length) {

            return res.status(404).json({
                erro: "Perfil não encontrado."
            });

        }

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: erro.message
        });

    }

});


// CRIAR

router.post("/", async (req, res) => {

    try {

        const {
            nome,
            filtros_json
        } = req.body;

        const resultado = await pool.query(

            `
            INSERT INTO perfis_graficos
            (
                nome,
                filtros_json,
                criado_por
            )

            VALUES

            (
                $1,
                $2,
                $3
            )

            RETURNING *
            `,

            [
                nome,
                JSON.stringify(filtros_json),
                req.usuario.id
            ]

        );

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: erro.message
        });

    }

});


// ATUALIZAR

router.put("/:id", async (req, res) => {

    try {

        const {
            nome,
            filtros_json
        } = req.body;

        const resultado = await pool.query(

            `
            UPDATE perfis_graficos

            SET

                nome=$1,
                filtros_json=$2,
                atualizado_em=NOW()

            WHERE id=$3

            RETURNING *
            `,

            [
                nome,
                JSON.stringify(filtros_json),
                req.params.id
            ]

        );

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: erro.message
        });

    }

});


// EXCLUIR

router.delete("/:id", async (req, res) => {

    try {

        await pool.query(

            `
            DELETE
            FROM perfis_graficos
            WHERE id=$1
            `,

            [req.params.id]

        );

        res.json({
            sucesso: true
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: erro.message
        });

    }

});

module.exports = router;