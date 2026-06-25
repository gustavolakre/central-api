// FUNÇÃO DO ARQUIVO:
// Recebe um arquivo Excel (.xlsx/.xls) via upload (multipart).
// Valida o arquivo e envia o buffer para importarFretes().
// Grava/atualiza os registros na tabela contratacao_fretes.
//
// RESUMO: Importa a planilha de contratação de fretes manualmente,
// como alternativa à importação automática via relatório do Pipefy.

const express = require("express");
const multer = require("multer");

const importarFretes =
  require("../services/importarFretesService");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("ROTA IMPORTAR FRETES OK");
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

const autenticar = require("../middlewares/autenticar");

router.post(
  "/",
  autenticar,
  upload.single("arquivo"),
  async (req, res) => {

    try {

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

      const resultado = await importarFretes(
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
