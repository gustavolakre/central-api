const express = require("express");
const router = express.Router();
const pool = require("../src/db/database");

router.get("/", async (req, res) => {
  try {

    // =========================
    // TODAS AS SEMANAS
    // =========================
    const todasSemanas = await pool.query(`
      SELECT DISTINCT
        substring(etiquetas from '[0-9]{4}/[0-9]{2}') as semana
      FROM controle_cargas
      WHERE
        substring(etiquetas from '[0-9]{4}/[0-9]{2}') IS NOT NULL
        AND COALESCE(fase, '') <> '09-Cancelada'
      ORDER BY semana DESC
    `);

    // =========================
    // RESUMO POR SEMANA
    // =========================
    const semanas = await pool.query(`
      SELECT
        substring(etiquetas from '[0-9]{4}/[0-9]{2}') as semana,
        SUM(quantidade) as total_suinos,
        COUNT(*) as total_cargas
      FROM controle_cargas
      WHERE
        substring(etiquetas from '[0-9]{4}/[0-9]{2}') IS NOT NULL
        AND COALESCE(fase, '') <> '09-Cancelada'
      GROUP BY semana
      ORDER BY semana DESC
    `);

    // =========================
    // COMPRADORES
    // =========================
    const compradores = await pool.query(`
      SELECT
        substring(etiquetas from '[0-9]{4}/[0-9]{2}') as semana,
        comprador,
        SUM(quantidade) as total_suinos,
        COUNT(*) as total_cargas
      FROM controle_cargas
      WHERE
        comprador IS NOT NULL
        AND comprador <> ''
        AND substring(etiquetas from '[0-9]{4}/[0-9]{2}') IS NOT NULL
        AND COALESCE(fase, '') <> '09-Cancelada'
      GROUP BY semana, comprador
      ORDER BY SUM(quantidade) DESC
    `);

    // =========================
    // FORNECEDORES
    // =========================
    const fornecedores = await pool.query(`
      SELECT
        substring(etiquetas from '[0-9]{4}/[0-9]{2}') as semana,
        fornecedor,
        SUM(quantidade) as total_suinos,
        COUNT(*) as total_cargas
      FROM controle_cargas
      WHERE
        fornecedor IS NOT NULL
        AND fornecedor <> ''
        AND substring(etiquetas from '[0-9]{4}/[0-9]{2}') IS NOT NULL
        AND COALESCE(fase, '') <> '09-Cancelada'
      GROUP BY semana, fornecedor
      ORDER BY SUM(quantidade) DESC
    `);

    // =========================
    // NEGOCIAÇÕES
    // =========================
    const negociacoes = await pool.query(`
      SELECT
        substring(etiquetas from '[0-9]{4}/[0-9]{2}') as semana,
        comprador,
        fornecedor,
        SUM(quantidade) as total_suinos,
        COUNT(*) as total_cargas
      FROM controle_cargas
      WHERE
        comprador IS NOT NULL
        AND fornecedor IS NOT NULL
        AND substring(etiquetas from '[0-9]{4}/[0-9]{2}') IS NOT NULL
        AND COALESCE(fase, '') <> '09-Cancelada'
      GROUP BY semana, comprador, fornecedor
      ORDER BY SUM(quantidade) DESC
    `);

    const meses = await pool.query(`
     SELECT
       DATE_TRUNC('month', criado_em)::date as mes,
      SUM(quantidade) as total_suinos
    FROM controle_cargas
    WHERE
      criado_em >= DATE '2024-01-01'
    AND COALESCE(fase,'') <> '09-Cancelada'
    GROUP BY mes
    ORDER BY mes
    `);

    // =========================
    // RESPONSE FINAL
    // =========================
    res.json({
      semanas: semanas.rows,
      meses: meses.rows,
      todasSemanas: todasSemanas.rows,
      compradores: compradores.rows,
      fornecedores: fornecedores.rows,
      negociacoes: negociacoes.rows
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message
    });
  }
});

module.exports = router;