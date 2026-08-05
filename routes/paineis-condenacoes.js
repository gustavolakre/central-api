const express = require('express');
const router = express.Router();
const pool = require("../src/db/database");

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        semana,
        fornecedor,
        comprador,
        tipo_suino,

        COALESCE(valor_total_bruto, 0) AS valor_total_bruto,
        COALESCE(valor_total_liquido, 0) AS valor_total_liquido,
        COALESCE(valor_condenacoes, 0) AS valor_condenacoes,
        COALESCE(valor_mortos, 0) AS valor_mortos_transporte

      FROM controle_cargas
      WHERE fase <> '09-Cancelada'
      ORDER BY semana;
    `);

    res.json(rows);

  } catch (err) {
    console.error('Erro painel condenações:', err);
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;