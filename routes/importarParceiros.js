const express = require("express");
const axios = require("axios");
const pool = require("../src/db/database");
const autenticar = require("../middlewares/autenticar");

const router = express.Router();

router.use(autenticar);

const TABLE_ID = 304131925;

router.get("/", async (req, res) => {

  try {

    const bloqueio = await pool.query(`

    SELECT *
    FROM controle_processos
    WHERE processo = 'FATURAMENTO_CARGAS'

`);

if (

    bloqueio.rows.length &&
    bloqueio.rows[0].status === 'EM_ANDAMENTO'

) {

    return res.status(409).json({

        erro:
            `Atualização bloqueada. Faturamento iniciado por ${
                bloqueio.rows[0].iniciado_por
            }`

    });

}

    let totalImportados = 0;

    let hasNextPage = true;

    let cursor = null;

    const ultimaSync = await pool.query(`
      SELECT MAX(updated_at) as ultima
      FROM parceiros_negocio
    `);

    const dataUltimaSync =
       ultimaSync.rows[0].ultima;

    console.log(
      "ULTIMA SYNC:",
       dataUltimaSync
    );

    while (hasNextPage) {

    const query = `
query {

  table_records(
    table_id: ${TABLE_ID},
    first: 50,
    after: ${cursor ? `"${cursor}"` : null}
  ) {

    pageInfo {
      hasNextPage
      endCursor
    }

    edges {

      node {

        id

        record_fields {
          name
          value
        }

      }

    }

  }

}
`;

    const response = await axios.post(
      "https://api.pipefy.com/graphql",
      { query },
      {
        headers: {
          Authorization: `Bearer ${process.env.PIPEFY_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const records = response.data.data.table_records.edges;

    hasNextPage =
      response.data.data.table_records.pageInfo.hasNextPage;

    cursor =
      response.data.data.table_records.pageInfo.endCursor;

    console.log({
      hasNextPage,
      cursor,
      lote: records.length
    });

    for (const item of records) {

      const record = item.node;

      const fields = {};

      record.record_fields.forEach(f => {
        fields[f.name] = f.value;
      });

      console.log(fields)

      await pool.query(

        
        
      `
      INSERT INTO parceiros_negocio (

        pipefy_record_id,

        tipo,
        nome_usual,
        razao_social,

        cnpj,
        cpf,
        inscricao_estadual,

        municipio,
        uf,
        cep,
        endereco,

        email_comercial,
        email_cobranca,

        localizacao,
        inspecao,

        conta_pix,

        contatos,
        anexos,

        programador,
        vendedor,

        raw_data,
        updated_at

      )

      VALUES (

        $1,

        $2,$3,$4,

        $5,$6,$7,

        $8,$9,$10,$11,

        $12,$13,

        $14,$15,

        $16,

        $17,$18,

        $19,$20,

        $21,
        
        NOW()

      )

      ON CONFLICT (pipefy_record_id)
      DO UPDATE SET

        tipo = EXCLUDED.tipo,
        nome_usual = EXCLUDED.nome_usual,
        razao_social = EXCLUDED.razao_social,

        cnpj = EXCLUDED.cnpj,
        cpf = EXCLUDED.cpf,
        inscricao_estadual = EXCLUDED.inscricao_estadual,

        municipio = EXCLUDED.municipio,
        uf = EXCLUDED.uf,
        cep = EXCLUDED.cep,
        endereco = EXCLUDED.endereco,

        email_comercial = EXCLUDED.email_comercial,
        email_cobranca = EXCLUDED.email_cobranca,

        localizacao = EXCLUDED.localizacao,
        inspecao = EXCLUDED.inspecao,

        conta_pix = EXCLUDED.conta_pix,

        contatos = EXCLUDED.contatos,
        anexos = EXCLUDED.anexos,

        programador = EXCLUDED.programador,
        vendedor = EXCLUDED.vendedor,

        raw_data = EXCLUDED.raw_data,
        updated_at = NOW()
      `,
      [

        record.id,

        fields["Tipo"] || "",
        fields["Nome Usual"] || "",
        fields["Razão Social"] || "",

        fields["CNPJ"] || "",
        fields["CPF"] || "",
        fields["Inscrição Estadual"] || "",

        fields["Município"] || "",
        fields["UF"] || "",
        fields["CEP"] || "",
        fields["Endereço"] || "",

        fields["e-mail Comercial"] || "",
        fields["e-mail Cobrança"] || "",

        fields["Localização"] || "",
        fields["Inspeção"] || "",

        fields["CONTA / PIX"] || "",
        fields["Contatos"] || "",
        JSON.stringify(fields["Anexos"] || []),
        fields["Programador"] || "",
        fields["Vendedor"] || "",

        JSON.stringify(fields)

      ]
      );

      totalImportados++;

          }

    }

    

    res.json({
      success: true,
      total: totalImportados
    });

  } catch (error) {

    console.error("ERRO COMPLETO:");
    console.error(JSON.stringify(error.response?.data, null, 2));
    console.error(error.message);

    res.status(500).json({
      error: "Erro ao importar parceiros"
    });

  }

});

module.exports = router;
