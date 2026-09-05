//models/ratingModel.js

const mongoose = require("mongoose");
const { Negocio } = require("./negociosModel");

const ratingSchema = new mongoose.Schema(
  {
    negocioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Negocio",
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    valor: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

ratingSchema.index({ negocioId: 1, userId: 1 }, { unique: true });

const Rating = mongoose.model("Rating", ratingSchema);

async function recalcularPromedio(negocioId) {
  const stats = await Rating.aggregate([
    { $match: { negocioId: new mongoose.Types.ObjectId(negocioId) } },
    { $group: { _id: "$negocioId", promedio: { $avg: "$valor" }, cantidad: { $sum: 1 } } },
  ]);

  const { promedio = 0, cantidad = 0 } = stats[0] || {};
  const ratingRedondeado = Math.round(promedio * 10) / 10;

  await Negocio.findByIdAndUpdate(negocioId, {
    rating: ratingRedondeado,
    reviews: cantidad,
  });

  return { rating: ratingRedondeado, reviews: cantidad };
}

async function valorar(negocioId, userId, valor) {
  if (!mongoose.Types.ObjectId.isValid(negocioId)) {
    const error = new Error("Negocio no encontrado");
    error.status = 404;
    throw error;
  }
  const valorNum = Number(valor);
  if (![1, 2, 3, 4, 5].includes(valorNum)) {
    const error = new Error("La valoración debe ser un número entero entre 1 y 5");
    error.status = 400;
    throw error;
  }

  // upsert: si el usuario ya había valorado, se actualiza (no se duplica).
  await Rating.findOneAndUpdate(
    { negocioId, userId },
    { valor: valorNum },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return recalcularPromedio(negocioId);
}

async function miValoracion(negocioId, userId) {
  const rating = await Rating.findOne({ negocioId, userId }).lean();
  return rating ? rating.valor : null;
}

module.exports = { Rating, valorar, miValoracion, recalcularPromedio };
