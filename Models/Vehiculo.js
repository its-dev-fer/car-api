const mongoose = require("mongoose")

/**
 * Modelo de `usuario`
 */
const vehiculoSchema = new mongoose.Schema({
    numero_serie: {
        type: String,
        default: null,
        unique: true
    },
    numero_motor: {
        type: String,
        default: null,
        unique: true
    },
    precio: {
        type: Number,
        default: 0
    },
    modelo: {
        type: String,
        default: null,
    },
    marca: {
        type: String,
        default: null,
    },
    nombre: {
        type: String,
        default: null,
    },
    vendido: {
        type: Boolean,
        default: false
    }
})
// exportar el esquema
module.exports = mongoose.model("vehiculo", vehiculoSchema)