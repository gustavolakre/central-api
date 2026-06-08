const jwt = require("jsonwebtoken");

module.exports = function autenticar(
    req,
    res,
    next
){

    const auth =
        req.headers.authorization;

    if(
        !auth ||
        !auth.startsWith("Bearer ")
    ){

        return res.status(401).json({
            erro: "Token não informado"
        });

    }

    console.log(
        "AUTH HEADER:",
        req.headers.authorization
      );

    const token =
        auth.replace(
            "Bearer ",
            ""
        );

    console.log("TOKEN RECEBIDO:", token);

    try{

        const payload =
    jwt.verify(
        token,
        process.env.JWT_SECRET
    );

console.log(
    "PAYLOAD MIDDLEWARE:",
    payload
);

req.usuario = payload;

        next();

    }catch(error){

        console.error(
            "Erro JWT:",
            error.message
        );

        return res.status(401).json({
            erro: "Token inválido"
        });

    }

};