const bcrypt = require("bcrypt")

async function gerar(){

    const senha = "123456"

    const hash = await bcrypt.hash(senha, 10)

    console.log(hash)

}

gerar()