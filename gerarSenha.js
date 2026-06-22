const bcrypt = require("bcrypt");

async function gerar() {

    const hash =
        await bcrypt.hash(
            "123br",
            10
        );

    console.log(hash);

}

gerar();