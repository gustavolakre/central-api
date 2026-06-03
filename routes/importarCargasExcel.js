const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const pool = require("../src/db/database");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage()
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
        { type: "buffer" }
      );

      const sheetName =
        workbook.SheetNames[0];

      const worksheet =
        workbook.Sheets[sheetName];

      const dados =
        XLSX.utils.sheet_to_json(
          worksheet,
          { defval: null }
        );

      res.json({
        linhas: dados.length
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        erro: err.message
      });

    }

  }
);

module.exports = router;