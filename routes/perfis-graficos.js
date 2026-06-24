const express = require("express");
const router = express.Router();
const pool = require("../src/db/database");
const autenticar = require("../middlewares/autenticar");

router.use(autenticar);


// LISTAR PERFIS

router.get("/", async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                id,
                nome
            FROM filtros_paineis
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
            FROM filtros_paineis
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

        const { nome, filtros_json } = req.body;

        if (!nome || !filtros_json) {
            return res.status(400).json({
                erro: "Nome e filtros são obrigatórios"
            });
        }

        const filtrosNormalizados = {
            periodo: filtros_json.periodo || "52",
            fornecedor: filtros_json.fornecedor || [],
            comprador: filtros_json.comprador || [],
            ufFornecedor: filtros_json.ufFornecedor || [],
            ufComprador: filtros_json.ufComprador || [],
            tipo: filtros_json.tipo || [],
            frete: filtros_json.frete || []
        };

        const resultado = await pool.query(`
            INSERT INTO filtros_paineis
            (nome, filtros_json, criado_por)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [
            nome,
            JSON.stringify(filtrosNormalizados),
            req.usuario.id
        ]);

        res.json(resultado.rows[0]);

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: erro.message });
    }
});


// ATUALIZAR

router.put("/:id", async (req, res) => {
    try {

        const { nome, filtros_json } = req.body;

        if (!nome || !filtros_json) {
            return res.status(400).json({
                erro: "Nome e filtros são obrigatórios"
            });
        }

        const filtrosNormalizados = {
            periodo: filtros_json.periodo || "52",
            fornecedor: filtros_json.fornecedor || [],
            comprador: filtros_json.comprador || [],
            ufFornecedor: filtros_json.ufFornecedor || [],
            ufComprador: filtros_json.ufComprador || [],
            tipo: filtros_json.tipo || [],
            frete: filtros_json.frete || []
        };

        const resultado = await pool.query(`
            UPDATE filtros_paineis
            SET nome=$1,
                filtros_json=$2,
                atualizado_em=NOW()
            WHERE id=$3
            RETURNING *
        `, [
            nome,
            JSON.stringify(filtrosNormalizados),
            req.params.id
        ]);

        if (!resultado.rows.length) {
            return res.status(404).json({
                erro: "Perfil não encontrado"
            });
        }

        res.json(resultado.rows[0]);

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: erro.message });
    }
});


// EXCLUIR

router.delete("/:id", async (req, res) => {

    try {

        await pool.query(

            `
            DELETE
            FROM filtros_paineis
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
