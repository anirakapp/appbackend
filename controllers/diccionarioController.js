// controllers/diccionarioController.js
const diccionarioModel = require("../models/diccionarioModel");
const diccionarioService = require("../lib/diccionarioService");

async function getDiccionario(req, res, next) {
  try {
    const diccionario = await diccionarioService.obtenerDiccionario();
    const entradas = Object.entries(diccionario).map(([clave, entrada]) => ({
      clave,
      categoria: entrada.categoria,
      palabras: entrada.palabras,
    }));
    return res.json({ entradas });
  } catch (error) {
    return next(error);
  }
}

async function crearCategoria(req, res, next) {
  try {
    const { categoria, palabras, clave } = req.body;
    const entrada = await diccionarioModel.crearEntrada({ categoria, palabras, clave });
    diccionarioService.invalidarCache();
    return res.status(201).json(entrada);
  } catch (error) {
    return next(error);
  }
}

async function agregarPalabras(req, res, next) {
  try {
    const { palabras, categoriaFallback } = req.body;
    const entrada = await diccionarioModel.agregarPalabras(req.params.clave, palabras, categoriaFallback);
    diccionarioService.invalidarCache();
    return res.json(entrada);
  } catch (error) {
    return next(error);
  }
}

module.exports = { getDiccionario, crearCategoria, agregarPalabras };
