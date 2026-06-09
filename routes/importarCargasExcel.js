const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const pool = require("../src/db/database");

const importarCargas = require("../services/importarCargasService");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("ROTA IMPORTAR CARGAS OK");
});

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },

  fileFilter: (req, file, cb) => {

    const permitidos = [
      ".xlsx",
      ".xls"
    ];

    const nome = file.originalname.toLowerCase();

    const valido = permitidos.some(ext =>
      nome.endsWith(ext)
    );

    if (!valido) {
      return cb(
        new Error("Apenas arquivos Excel são permitidos")
      );
    }

    cb(null, true);
  }
});

const BATCH_SIZE = 200;

function numero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) return null;

  const n = Number(
    String(valor)
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return Number.isNaN(n)
    ? null
    : n;
}

function texto(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) return null;

  return String(valor).trim();
}

function data(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  return valor;
}

const autenticar = require("../middlewares/autenticar");

router.post(
  "/",
  autenticar,
  upload.single("arquivo"),
  async (req, res) => {

    console.log(
      "USUARIO ROTA:",
      req.usuario
    );

    if (req.usuario.perfil !== "admin") {

      return res.status(403).json({
        erro: "Acesso negado"
      });

    }

    try {

      /*
      =========================================
      BLOQUEIO DE FATURAMENTO
      =========================================
      */

      const bloqueio = await pool.query(`

        SELECT *
        FROM controle_processos

        WHERE processo =
          'FATURAMENTO_CARGAS'

      `);

      if (

        bloqueio.rows.length > 0 &&

        bloqueio.rows[0].status ===
          "EM_ANDAMENTO"

      ) {

        return res.status(409).json({

          erro:
            `Atualização bloqueada. Faturamento iniciado por ${
              bloqueio.rows[0].iniciado_por
            }`

        });

      }


      /*
      =========================================
      VALIDA ARQUIVO
      =========================================
      */

      if (!req.file) {

        return res.status(400).json({

          erro: "Nenhum arquivo enviado"

        });

      }


      /*
      =========================================
      IMPORTAÇÃO
      =========================================
      */

      const resultado = await importarCargas(

        req.file.buffer

      );

      return res.json(resultado);

    }

    catch (err) {

      console.error(err);

      if (err.code === "LIMIT_FILE_SIZE") {

        return res.status(400).json({

          erro: "Arquivo maior que 20MB"

        });

      }

      return res.status(500).json({

        erro: err.message

      });

    }

  }
);

module.exports = router;