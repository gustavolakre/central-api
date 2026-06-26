const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/autenticar");
const faturamentoSessao = require("../services/faturamentoSessao");

router.use(autenticar);

function emailUsuario(req) {
  return req.usuario.email || req.usuario.usuario || "";
}

router.get("/", async (req, res) => {

  try {

    const sessoes =
      await faturamentoSessao.listarAtivas();

    res.json({
      sucesso: true,
      sessoes
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      erro: err.message
    });

  }

});

router.get("/:processo", async (req, res) => {

  try {

    const sessao =
      await faturamentoSessao.buscarAtiva(
        req.params.processo
      );

    if (!sessao) {
      return res.json({
        sucesso: true,
        sessao: null
      });
    }

    res.json({
      sucesso: true,
      sessao
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      erro: err.message
    });

  }

});

router.post("/", async (req, res) => {

  try {

    const { processo, dados } = req.body;

    if (!processo || !dados) {
      return res.status(400).json({
        erro: "processo e dados são obrigatórios"
      });
    }

    const resultado =
      await faturamentoSessao.criar(
        processo,
        emailUsuario(req),
        dados
      );

    res.json({
      sucesso: true,
      ...resultado
    });

  } catch (err) {

    console.error(err);

    res.status(err.status || 500).json({
      erro: err.message
    });

  }

});

router.put("/:processo", async (req, res) => {

  try {

    const { dados } = req.body;

    if (!dados) {
      return res.status(400).json({
        erro: "dados são obrigatórios"
      });
    }

    const sessao =
      await faturamentoSessao.salvar(
        req.params.processo,
        emailUsuario(req),
        dados
      );

    res.json({
      sucesso: true,
      sessao
    });

  } catch (err) {

    console.error(err);

    res.status(err.status || 500).json({
      erro: err.message
    });

  }

});

router.post("/:processo/concluir", async (req, res) => {

  try {

    const sessao =
      await faturamentoSessao.concluir(
        req.params.processo,
        emailUsuario(req)
      );

    res.json({
      sucesso: true,
      sessao
    });

  } catch (err) {

    console.error(err);

    res.status(err.status || 500).json({
      erro: err.message
    });

  }

});

module.exports = router;
