//models/productoModel.js

const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema(
  {
    negocioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Negocio",
      required: true,
      index: true,
    },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    categoria: { type: String, trim: true, index: true },
    subcategoria: { type: String, trim: true },
    palabrasClave: { type: [String], default: [] },
    sinonimos: { type: [String], default: [] },
    etiquetas: { type: [String], default: [] },
    sinGluten: { type: Boolean, default: false },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productoSchema.index({ nombre: "text", palabrasClave: "text", sinonimos: "text" });

const Producto = mongoose.model("Producto", productoSchema);

function formatear(doc) {
  const { _id, __v, ...resto } = doc;
  return { id: _id.toString(), ...resto };
}

async function crear(data) {
  const producto = await Producto.create(data);
  return formatear(producto.toObject());
}

async function listarPorNegocio(negocioId) {
  const productos = await Producto.find({ negocioId, activo: true }).lean();
  return productos.map(formatear);
}

async function contarPorNegocio(negocioId) {
  return Producto.countDocuments({ negocioId, activo: true });
}

// Usado por el buscador: todos los productos activos, con el negocio "poblado"
// para poder filtrar por negocios visibles (aprobados, no bloqueados).
async function todosActivosConNegocio() {
  const productos = await Producto.find({ activo: true }).lean();
  return productos.map(formatear);
}

async function actualizar(id, cambios) {
  const producto = await Producto.findByIdAndUpdate(id, cambios, {
    new: true,
    runValidators: true,
  }).lean();
  return producto ? formatear(producto) : null;
}

async function eliminar(id) {
  const eliminado = await Producto.findByIdAndDelete(id).lean();
  return eliminado ? formatear(eliminado) : null;
}

module.exports = {
  Producto,
  crear,
  listarPorNegocio,
  contarPorNegocio,
  todosActivosConNegocio,
  actualizar,
  eliminar,
};
