//models/busquedaModel.js
const mongoose = require("mongoose");

const busquedaSchema = new mongoose.Schema({
  termino: { type: String, required: true, trim: true },
  fecha: { type: Date, default: Date.now },
  cantidadResultados: { type: Number, default: 0 },
});

busquedaSchema.index({ termino: 1 });
busquedaSchema.index({ fecha: -1 });

const Busqueda = mongoose.model("Busqueda", busquedaSchema);

async function registrar(termino, cantidadResultados) {
  if (!termino || !termino.trim()) return;
  try {
    await Busqueda.create({
      termino: termino.trim().toLowerCase(),
      cantidadResultados,
    });
  } catch (error) {
    // Un error acá nunca debe romper la búsqueda del usuario.
    console.error("No se pudo registrar la búsqueda:", error.message);
  }
}

async function populares(limite = 10) {
  return Busqueda.aggregate([
    { $group: { _id: "$termino", cantidad: { $sum: 1 } } },
    { $sort: { cantidad: -1 } },
    { $limit: limite },
  ]);
}

module.exports = { Busqueda, registrar, populares };
