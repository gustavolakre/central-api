const bcrypt = require("bcrypt");

async function gerar() {

    const hash =
        await bcrypt.hash(
            "SuaSenha123",
            10
        );

    console.log(hash);

}

gerar();