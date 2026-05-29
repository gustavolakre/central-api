const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {

  try {

    console.log(
      "WEBHOOK RECEBIDO:"
    );

    console.log(
      JSON.stringify(req.body, null, 2)
    );

    res.sendStatus(200);

  } catch (err) {

    console.log(err);

    res.sendStatus(500);

  }

});

module.exports = router;