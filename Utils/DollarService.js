const axios = require('axios')
const BANXICO_KEY = "b9d6d2cdf05e4c3e21d9ff4875726239284828d61033be5780c82e8f5c9d40df"

exports.dolar = async (monto_mxn) => {
    try {
        const response = await axios.get(`https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno?token=${BANXICO_KEY}`)
        const conversion = monto_mxn/parseFloat(response.data.bmx.series[0].datos[0].dato)
        const fecha = response.data.bmx.series[0].datos[0].fecha
        return Promise.resolve({conversion: conversion.toFixed(2), fecha: fecha, tipo_cambio: response.data.bmx.series[0].datos[0].dato})
    } catch (error) {
        console.error(error)
        return Promise.resolve({conversion: null, fecha: null, tipo_cambio: null})
    }
}