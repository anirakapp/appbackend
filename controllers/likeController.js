// backend/controllers/likeController.js
// El contador de likes NUNCA lo manda el frontend: siempre se calcula acá,
// en base a quién está autenticado (req.user viene del JWT verificado).
const negocioModel = require("../models/negociosModel");

async function like(req, res, next) {
  try {
    const negocio = await negocioModel.darLike(req.params.id, req.user.id);
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

async function unlike(req, res, next) {
  try {
    const negocio = await negocioModel.quitarLike(req.params.id, req.user.id);
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

module.exports = { like, unlike };
