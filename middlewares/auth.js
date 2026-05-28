const jwt = require("jsonwebtoken")

const JWT_SECRET =
process.env.JWT_SECRET || "segredo_super_forte"


function verificarToken(req,res,next){

    try{

        const authHeader =
            req.headers.authorization


        if(!authHeader){

            return res.status(401).json({
                erro:"Token não enviado"
            })

        }


        const token =
            authHeader.split(" ")[1]


        const decoded = jwt.verify(
            token,
            JWT_SECRET
        )


        req.usuario = decoded

        next()

    }

    catch(err){

        return res.status(401).json({
            erro:"Token inválido"
        })

    }

}


module.exports = verificarToken