// backend/controllers/ratingController.js
// El promedio y la cantidad de reseñas NUNCA los manda el frontend: se
// recalculan siempre en el servidor a partir de las valoraciones guardadas.
const ratingModel = require("../models/ratingModel");

async function valorar(req, res, next) {
  try {
    const { valor } = req.body;
    const resultado = await ratingModel.valorar(req.params.id, req.user.id, valor);
    return res.json(resultado);
  } catch (error) {
    return next(error);
  }
}

module.exports = { valorar };
