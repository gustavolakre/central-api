const express = require("express");
const router = express.Router();
const pool = require("../src/db/database");


// =====================================================
// 📌 LISTAR TODAS AS SELEÇÕES SALVAS
// =====================================================
router.get("/", async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT *
            FROM filtros_paineis
            ORDER BY criado_em DESC
        `);

        res.json(resultado.rows);

    } catch (err) {
        console.error("Erro GET filtros_paineis:", err);
        res.status(500).json({ erro: err.message });
    }
});


// =====================================================
// 📌 CRIAR NOVA SELEÇÃO
// =====================================================
router.post("/", async (req, res) => {
    try {
        const {
            nome,
            filtros_json,
            criado_por
        } = req.body;

        if (!nome || !filtros_json) {
            return res.status(400).json({
                erro: "nome e filtros_json são obrigatórios"
            });
        }

        const resultado = await pool.query(`
            INSERT INTO filtros_paineis
                (nome, filtros_json, criado_por)
            VALUES
                ($1, $2, $3)
            RETURNING *
        `, [
            nome,
            filtros_json,
            criado_por || "sistema"
        ]);

        res.json(resultado.rows[0]);

    } catch (err) {
        console.error("Erro POST filtros_paineis:", err);
        res.status(500).json({ erro: err.message });
    }
});


// =====================================================
// 📌 ATUALIZAR SELEÇÃO EXISTENTE
// =====================================================
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome,
            filtros_json
        } = req.body;

        if (!id) {
            return res.status(400).json({
                erro: "ID é obrigatório"
            });
        }

        const resultado = await pool.query(`
            UPDATE filtros_paineis
            SET
                nome = COALESCE($1, nome),
                filtros_json = COALESCE($2, filtros_json),
                atualizado_em = NOW()
            WHERE id = $3
            RETURNING *
        `, [
            nome,
            filtros_json,
            id
        ]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                erro: "Seleção não encontrada"
            });
        }

        res.json(resultado.rows[0]);

    } catch (err) {
        console.error("Erro PUT filtros_paineis:", err);
        res.status(500).json({ erro: err.message });
    }
});


// =====================================================
// 📌 EXCLUIR SELEÇÃO
// =====================================================
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(`
            DELETE FROM filtros_paineis
            WHERE id = $1
            RETURNING id
        `, [id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                erro: "Seleção não encontrada"
            });
        }

        res.json({
            sucesso: true,
            id: resultado.rows[0].id
        });

    } catch (err) {
        console.error("Erro DELETE filtros_paineis:", err);
        res.status(500).json({ erro: err.message });
    }
});

module.exports = router;