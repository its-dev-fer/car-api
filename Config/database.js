const mongoose = require('mongoose')

const {DB_URL} = process.env

exports.connect = () => {
    mongoose.connect(DB_URL, {
        useNewUrlParser: true
    }).then(() => console.log("Conectado a la BD"))
    .catch((error) => {
        console.log("Error de conexion");
        console.error(error);
        process.exit(1);
    });
}