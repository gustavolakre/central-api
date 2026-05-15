const express = require("express");
const pool = require("../src/db/database");

const router = express.Router();

router.get("/", async (req, res) => {

  try {

    const cargas = await pool.query(`
      SELECT *
      FROM controle_cargas
    `);

    let totalGerados = 0;
    let ignorados = 0;

    for (const carga of cargas.rows) {

      const nfCompr = (carga.nf_taxa_compr || "").trim();
      const nfFornec = (carga.nf_taxa_fornec || "").trim();

      const semAcordo =
        nfCompr.toLowerCase() === "sem acordo" ||
        nfFornec.toLowerCase() === "sem acordo";

      if (semAcordo) {

        await pool.query(`
          INSERT INTO faturamento (

            card_id,
            comprador,
            fornecedor,
            tipo_suino,
            semana,

            nf_taxa_compr,
            nf_taxa_fornec,

            status_card_pipefy,

            raw_data,
            updated_at

          )

          VALUES (
            $1,$2,$3,$4,$5,
            $6,$7,
            $8,
            $9,
            NOW()
          )

          ON CONFLICT (card_id)
          DO UPDATE SET

            status_card_pipefy = 'SEM_ACORDO',
            updated_at = NOW()
        `,
        [
          carga.pipefy_card_id,
          carga.comprador,
          carga.fornecedor,
          carga.tipo_suino,
          carga.etiquetas || "",

          carga.nf_taxa_compr,
          carga.nf_taxa_fornec,

          "SEM_ACORDO",

          JSON.stringify(carga)
        ]);

        ignorados++;
        continue;
      }

      let semana = "";

      if (carga.etiquetas) {

        const partes = carga.etiquetas.split(",");

        semana = partes.length > 1
          ? partes[1].trim()
          : partes[0].trim();
      }

      await pool.query(`
        INSERT INTO faturamento (

          card_id,

          comprador,
          fornecedor,

          tipo_suino,
          semana,

          nf_taxa_compr,
          nf_taxa_fornec,

          valor_liquido,

          status_card_pipefy,
          status_envio_notas,

          raw_data,
          updated_at

        )

        VALUES (

          $1,

          $2,$3,

          $4,$5,

          $6,$7,

          $8,

          $9,$10,

          $11,
          NOW()

        )

        ON CONFLICT (card_id)
        DO UPDATE SET

          comprador = EXCLUDED.comprador,
          fornecedor = EXCLUDED.fornecedor,

          tipo_suino = EXCLUDED.tipo_suino,
          semana = EXCLUDED.semana,

          nf_taxa_compr = EXCLUDED.nf_taxa_compr,
          nf_taxa_fornec = EXCLUDED.nf_taxa_fornec,

          valor_liquido = EXCLUDED.valor_liquido,

          raw_data = EXCLUDED.raw_data,

          updated_at = NOW()
      `,
      [

        carga.pipefy_card_id,

        carga.comprador,
        carga.fornecedor,

        carga.tipo_suino,
        semana,

        carga.nf_taxa_compr,
        carga.nf_taxa_fornec,

        Number(carga.valor_total_liquido || 0),

        "PENDENTE",
        "PENDENTE",

        JSON.stringify(carga)

      ]);

      totalGerados++;

    }

    res.json({
      success: true,
      gerados: totalGerados,
      ignorados_sem_acordo: ignorados
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erro ao gerar faturamento"
    });

  }

});

module.exports = router;

