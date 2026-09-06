// controllers/diccionarioController.js
const diccionarioModel = require("../models/diccionarioModel");
const diccionarioService = require("../lib/diccionarioService");

async function getDiccionario(req, res, next) {
  try {
    const [diccionario, dinamicas] = await Promise.all([
      diccionarioService.obtenerDiccionario(),
      diccionarioModel.listarTodos(),
    ]);
    const clavesConFilaPropia = new Set(dinamicas.map((e) => e.clave));

    const entradas = Object.entries(diccionario).map(([clave, entrada]) => ({
      clave,
      categoria: entrada.categoria,
      palabras: entrada.palabras,
      // true si hay palabras/categoría cargadas por el admin en Mongo para
      // esta clave (se puede borrar sin tocar el diccionario base).
      tienePalabrasPropias: clavesConFilaPropia.has(clave),
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

async function eliminarEntrada(req, res, next) {
  try {
    const entrada = await diccionarioModel.eliminarEntrada(req.params.clave);
    diccionarioService.invalidarCache();
    return res.json(entrada);
  } catch (error) {
    return next(error);
  }
}

module.exports = { getDiccionario, crearCategoria, agregarPalabras, eliminarEntrada };
