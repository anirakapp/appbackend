// backend/controllers/searchController.js

const searchModel = require("../models/searchModel");
const busquedaModel = require("../models/busquedaModel");

async function buscar(req, res, next) {
  try {
    const { q, ciudad, lat, lng } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Falta el parámetro de búsqueda (q)" });
    }

    const { resultados, sugerenciaVacia } = await searchModel.buscar({
      q,
      ciudad,
      lat: lat != null ? Number(lat) : undefined,
      lng: lng != null ? Number(lng) : undefined,
      userId: req.user ? req.user.id : undefined,
    });

    return res.json({ query: q, resultados, sugerenciaVacia });
  } catch (error) {
    return next(error);
  }
}


async function sugerencias(req, res, next) {
  try {
    const { q } = req.query;
    const datos = await searchModel.sugerir(q || "");
    return res.json(datos);
  } catch (error) {
    return next(error);
  }
}

async function populares(req, res, next) {
  try {
    const limite = Number(req.query.limite) || 10;
    const datos = await busquedaModel.populares(limite);
    return res.json(datos);
  } catch (error) {
    return next(error);
  }
}

module.exports = { buscar, sugerencias, populares };
