const mongoose = require("mongoose")

/**
 * Modelo de `usuario`
 */
const userSchema = new mongoose.Schema({
    full_name: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null,
        unique: true,
    },
    password: {
        type: String,
        default: null
    },
    permisos: {
        type: String,
        enum: ['administrador', 'usuario'] // administrador podra ver precios, usuario no
    },
    access_token: {
        type: String
    }
})
// exportar el esquema
module.exports = mongoose.model("user", userSchema)