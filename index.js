// Configuration
require("dotenv").config()
require("./config/database").connect()
const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const { API_PORT } = process.env
const bcrypt = require('bcryptjs')

// Models
const User = require('./models/User')
const jwt = require('jsonwebtoken')
const session_middleware = require('./middleware/AdminMiddleware')
const Vehiculo = require("./models/Vehiculo")
const tc = require('./utils/DollarService') // tipo de cambio

// live server
app.use(express.json())

server.listen(API_PORT, () => {
    console.log('Servidor ejecutandose')

    // sesiones
    app.post('/register', async (request, response) => {
        try {
            const { full_name, email, password } = request.body
            if(!(full_name && email && password)){
                return response.status(422).json({
                    message: "Formulario incompleto, se requiere full_name, email, password"
                })
            }

            // validar si existe un usuario con el email
            const usuarioExistente = await User.findOne({email})
            // hacer hash al password
            const password_hash = await bcrypt.hash(password, 10)
            // validar que no existan dos usuarios con el mismo email
            if(usuarioExistente){
                return response.status(422).json({
                    message: "Ya existe un usuario con este email"
                })
            }
            // crear al usuario
            const newUser = await User.create({
                full_name,
                email: email.toLowerCase(),
                password: password_hash,
                permisos: 'administrador'
            })
            // registrar un nuevo token
            const token = jwt.sign(
                {
                 user_id: newUser._id,
                 email: newUser.email   
                },
                process.env.TOKEN_KEY,
                {
                    expiresIn: '8h'
                }
            )
            newUser.access_token = token
            return response.status(201).json(newUser)
        } catch (error) {
            console.error(error)
            response.status(500).send({
                "message": "Ocurrió un error",
                "error": error
            })
        }
    })

    app.post('/login', async (request, response) => {
        try {
            const { email, password } = request.body
            if(!(email && password)){
                return response.status(400).json({
                    message: "Se necesita el campo email y password"
                })
            }
            const user = await User.findOne({email})
            if(user && (await bcrypt.compare(password, user.password))){
                const token = jwt.sign(
                    {
                        user_id: user._id,
                        email: email
                    },
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: '8h'
                    }
                )
                user.access_token = token
                return response.status(200).json({
                    full_name: user.full_name,
                    email: user.email,
                    access_token: user.access_token
                })
            }
            return response.status(403).json({
                message: "Credenciales incorrectas"
            })
        } catch (error) {
            console.error(error)
            response.status(500).send({
                "message": "Ocurrió un error",
                "error": error
            })
        }
    })

    app.get('/dashboard', session_middleware, (request, response) => {
        return response.status(200).json({
            message: `Bienvenido!`
        })
    })

    // vehiculos
    app.post('/vehiculos/new', session_middleware, async (request, response) => {
        try{
            const { numero_serie, numero_motor, precio, modelo, marca, nombre } = request.body
            if(!(numero_serie && numero_motor && precio && modelo && marca && nombre)){
                return response.status(422).json({
                    message: "Faltan datos por llenar, los campos son: numero_serie, numero_motor, precio, modelo, marca, nombre"
                })
            }
            const vehiculoExistente = await Vehiculo.findOne({
                $or: [
                    {
                        numero_motor: numero_motor
                    },
                    {
                        numero_serie: numero_serie
                    }
                ]
            })
            if(vehiculoExistente){
                return response.status(400).json({
                    message: `Ya existe un vehiculo con el num. de serie ${numero_serie} y/o motor: ${numero_motor}`
                })
            }

            const newCar = await Vehiculo.create({
                numero_motor: numero_motor,
                numero_serie: numero_serie,
                marca: marca.toUpperCase(),
                modelo: modelo,
                nombre: nombre.toUpperCase(),
                precio: precio
            })

            return response.status(201).json({
                message: "Vehiculo registrado",
                vehiculo: newCar
            })

        }catch(error){
            console.error(error)
            response.status(500).send({
                "message": "Ocurrió un error",
                "error": error
            })
        }
    })

    app.get('/vehiculos', async (request, response) => {
        let { sortBy, busqueda, convertir_moneda } = request.body
        if(sortBy != null) sortBy = sortBy.toUpperCase()
        if(busqueda != null) busqueda = busqueda.toUpperCase()
        let vehiculos = []
        if(busqueda == '' || busqueda == null){
            if(sortBy == 'ASC' || sortBy == 'DESC'){
                // sort por precio
                vehiculos = await Vehiculo.where('vendido').equals(false).sort({precio: (sortBy == 'ASC') ? 1 : -1}).exec()
            }else{
                vehiculos = await Vehiculo.where('vendido').equals(false).exec()
            }
        }else{
            if(sortBy == 'ASC' || sortBy == 'DESC'){
                // sort por precio
                vehiculos = await Vehiculo.find({
                    vendido: false,
                    $or: [
                        {
                            nombre: busqueda
                        },
                        {
                            marca: busqueda
                        },
                        {
                            modelo: busqueda
                        }
                    ]
                }).sort({precio: (sortBy == 'ASC') ? 1 : -1}).exec()
            }else{
                // busqueda normal
                vehiculos = await Vehiculo.find({
                    vendido: false,
                    $or: [
                        {
                            nombre: busqueda
                        },
                        {
                            marca: busqueda
                        },
                        {
                            modelo: busqueda
                        }
                    ]
                }).exec()
            }
        }

        if(convertir_moneda){
            let _vehiculos = []
            for(let v of vehiculos){
                const {conversion, fecha, tipo_cambio} = await tc.dolar(v.precio)
                _vehiculos.push({
                    _id: v._id,
                    numero_serie: v.numero_serie,
                    numero_motor: v.numero_motor,
                    precio: v.precio,
                    modelo: v.modelo,
                    marca: v.marca,
                    nombre: v.nombre,
                    vendido: v.vendido,
                    __v: v.__v,
                    precio_dolares: conversion,
                    fecha_consulta: fecha,
                    tipo_cambio: tipo_cambio
                })
            }
            vehiculos = _vehiculos
        }
        return response.status(200).json({
            vehiculos
        })
    })

    app.get('/vehiculo/:id', async (request, response) => {

        try {
            const {id} = request.params
            const {convertir_moneda} = request.query
        
            const vehiculo = await Vehiculo.findById(id)
    
            if(!vehiculo) return response.status(404).json({
                message: "Vehículo no encontrado"
            })
    
            if(convertir_moneda){
                const {conversion, fecha, tipo_cambio} = await tc.dolar(vehiculo.precio)
                return response.status(200).json({
                    ...vehiculo._doc,
                    precio_dolares: conversion,
                    fecha_consulta: fecha,
                    tipo_cambio: tipo_cambio
                })
            }else{
                return response.status(200).json(vehiculo)
            }
        } catch (error) {
            return response.status(404).json({
                message: "Vehículo no encontrado"
            })  
        }
    })

    app.put('/vehiculos/vendido/:id', session_middleware, async (request, result) => {
        try {
            const {id} = request.params
            let vehiculo = await Vehiculo.findById(id)
            if(vehiculo.vendido){
                return result.status(422).json({
                    message: "Este vehiculo ya se marcó como vendido"
                })
            }
            vehiculo = await Vehiculo.findByIdAndUpdate(id, {
                vendido: true
            })
            vehiculo = await Vehiculo.findById(id)
            return result.status(200).json({
                message: "Marcado como vendido",
                vehiculo: vehiculo
            })
        } catch (error) {
            return result.status(400).json({
                message: "Vehículo no encontrado"
            })
        }
    })
})

module.exports = app