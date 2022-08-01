const jwt = require("jsonwebtoken")
const User = require("../Models/User")
const config = process.env

const verifiyToken = async (request, result, next) => {
    const token = request.body.token || request.query.token || request.headers["x-access-token"]
    if(!token){
        return result.status(403).json({
            message: "El header Authorization es requerido"
        })
    }

    try{
        const decoded = await jwt.verify(token, config.TOKEN_KEY)
        request.user = decoded
        const user = await User.findById(decoded.user_id).select("-password")
        if(!user){
            return result.status(500).json({
                message: "Sesión no válida"
            })
        }else if(user.permisos != "administrador"){
            return result.status(403).json({
                message: "No tienes permisos para este módulo"
            })
        }
    }catch(error){
        return result.status(500).json({
            message: error
        })
    }
    return next()
}

module.exports = verifiyToken