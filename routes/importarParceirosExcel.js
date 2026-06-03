const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const pool = require("../src/db/database");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage()
});

const BATCH_SIZE = 500;
const TOTAL_COLUNAS = 21;

function texto(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  return String(valor).trim();
}

router.get("/", (req, res) => {

  res.send(
    "ROTA IMPORTAR PARCEIROS EXCEL OK"
  );

});

router.post(
  "/",
  upload.single("arquivo"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          erro: "Nenhum arquivo enviado"
        });

      }

      const workbook = XLSX.read(
        req.file.buffer,
        {
          type: "buffer"
        }
      );

      const sheetName =
        workbook.SheetNames[0];

      const worksheet =
        workbook.Sheets[sheetName];

      const dados =
        XLSX.utils.sheet_to_json(
          worksheet,
          {
            defval: null,
            raw: false
          }
        );

      console.log(
        "TOTAL PARCEIROS:",
        dados.length
      );

      console.time(
        "IMPORTACAO_PARCEIROS"
      );

      let importados = 0;

      const sqlBase = `
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

        raw_data

      )
      VALUES
      `;

      for (
        let i = 0;
        i < dados.length;
        i += BATCH_SIZE
      ) {

        const lote =
          dados.slice(
            i,
            i + BATCH_SIZE
          );

        const placeholders = [];
        const valores = [];

        lote.forEach(
          (linha, index) => {

            const base =
              index *
              TOTAL_COLUNAS;

            placeholders.push(`(

              $${base + 1},

              $${base + 2},
              $${base + 3},
              $${base + 4},

              $${base + 5},
              $${base + 6},
              $${base + 7},

              $${base + 8},
              $${base + 9},
              $${base + 10},
              $${base + 11},

              $${base + 12},
              $${base + 13},

              $${base + 14},
              $${base + 15},

              $${base + 16},

              $${base + 17},
              $${base + 18},

              $${base + 19},
              $${base + 20},

              $${base + 21}

            )`);

            valores.push(

              Number(
                linha["ID"]
              ),

              texto(
                linha["Tipo"]
              ),

              texto(
                linha["Nome Usual"]
              ),

              texto(
                linha["Razão Social"]
              ),

              texto(
                linha["CNPJ"]
              ),

              texto(
                linha["CPF"]
              ),

              texto(
                linha[
                  "Inscrição Estadual"
                ]
              ),

              texto(
                linha["Município"]
              ),

              texto(
                linha["UF"]
              ),

              texto(
                linha["CEP"]
              ),

              texto(
                linha["Endereço"]
              ),

              texto(
                linha[
                  "e-mail Comercial"
                ]
              ),

              texto(
                linha[
                  "e-mail Cobrança"
                ]
              ),

              texto(
                linha["Localização"]
              ),

              texto(
                linha["Inspeção"]
              ),

              texto(
                linha["CONTA / PIX"]
              ),

              texto(
                linha["Contatos"]
              ),

              JSON.stringify(
               linha["Anexos"]
               ? [linha["Anexos"]]
               : []
              ),

              texto(
                linha["Programador"]
              ),

              texto(
                linha["Vendedor"]
              ),

              JSON.stringify(
                linha
              )

            );

          }
        );

        const sqlFinal =
          sqlBase +
          placeholders.join(",") +
          `
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
        `;

        await pool.query(
          sqlFinal,
          valores
        );

        importados +=
          lote.length;

        const percentual =
          (
            (importados /
              dados.length) *
            100
          ).toFixed(1);

        console.log(
          `${percentual}% - ${importados}/${dados.length}`
        );

      }

      console.timeEnd(
        "IMPORTACAO_PARCEIROS"
      );

      return res.json({
        sucesso: true,
        importados
      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        erro: err.message
      });

    }

  }
);

module.exports = router;