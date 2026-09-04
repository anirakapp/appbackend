const mongoose = require("mongoose");

const negocioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    categoria: { type: String, required: true, trim: true },
    imagen: { type: String, required: true },
    ciudad: { type: String, required: true, lowercase: true, trim: true },
    direccion: { type: String },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    badge: { type: String },
    whatsapp: { type: String },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    auspiciado: { type: Boolean, default: false },
    habilitado: { type: Boolean, default: false }, // false = pendiente de aprobación
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true } // createdAt / updatedAt automáticos
);

const Negocio = mongoose.model("Negocio", negocioSchema);

function calcularDistanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function paginar(lista, { page = 1, limit = 4 } = {}) {
  const paginaActual = Math.max(1, Number(page) || 1);
  const porPagina = Math.max(1, Number(limit) || 4);
  const inicio = (paginaActual - 1) * porPagina;
  const data = lista.slice(inicio, inicio + porPagina);
  return {
    data,
    total: lista.length,
    page: paginaActual,
    totalPages: Math.max(1, Math.ceil(lista.length / porPagina)),
  };
}

// Convierte el doc de Mongo (_id) al mismo shape que ya consume el front (id)
function formatear(doc) {
  const { _id, __v, ...resto } = doc;
  return { id: _id.toString(), ...resto, distanciaKm: resto.distanciaKm || 0 };
}

async function crear({
  nombre,
  categoria,
  imagen,
  ciudad,
  direccion,
  lat,
  lng,
  badge,
  whatsapp,
  auspiciado,
  ownerId,
  habilitado,
}) {
  if (!nombre || !categoria || !imagen || !ciudad) {
    const error = new Error("nombre, categoria, imagen y ciudad son obligatorios");
    error.status = 400;
    throw error;
  }

  const negocio = await Negocio.create({
    nombre,
    categoria,
    imagen,
    ciudad,
    direccion: direccion || undefined,
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    badge: badge || undefined,
    whatsapp: whatsapp || undefined,
    auspiciado: Boolean(auspiciado),
    habilitado: Boolean(habilitado),
    ownerId: ownerId || null,
  });

  return formatear(negocio.toObject());
}

async function listarAprobados(ciudad) {
  const filtro = { habilitado: true };
  if (ciudad) filtro.ciudad = String(ciudad).toLowerCase();

  const negocios = await Negocio.find(filtro).sort({ createdAt: -1 }).lean();
  return negocios.map(formatear);
}

async function listarTodos() {
  const negocios = await Negocio.find().sort({ createdAt: -1 }).lean();
  return negocios.map(formatear);
}

async function listarPendientes() {
  const negocios = await Negocio.find({ habilitado: false })
    .sort({ createdAt: -1 })
    .lean();
  return negocios.map(formatear);
}

async function listarPropios(ownerId) {
  const negocios = await Negocio.find({ ownerId }).sort({ createdAt: -1 }).lean();
  return negocios.map(formatear);
}

async function listarCercanos(lat, lng, maxKm = 20) {
  const negocios = await Negocio.find({
    habilitado: true,
    lat: { $ne: null },
    lng: { $ne: null },
  }).lean();

  return negocios
    .map((n) => ({
      ...formatear(n),
      distanciaKm: calcularDistanciaKm(lat, lng, n.lat, n.lng),
    }))
    .filter((n) => n.distanciaKm <= maxKm)
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}

async function buscarPorId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const negocio = await Negocio.findById(id).lean();
  return negocio ? formatear(negocio) : null;
}

async function actualizar(id, cambios) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Negocio no encontrado");
    error.status = 404;
    throw error;
  }

  const negocio = await Negocio.findByIdAndUpdate(id, cambios, {
    new: true,
    runValidators: true,
  }).lean();

  if (!negocio) {
    const error = new Error("Negocio no encontrado");
    error.status = 404;
    throw error;
  }

  return formatear(negocio);
}

async function eliminar(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Negocio no encontrado");
    error.status = 404;
    throw error;
  }

  const eliminado = await Negocio.findByIdAndDelete(id).lean();
  if (!eliminado) {
    const error = new Error("Negocio no encontrado");
    error.status = 404;
    throw error;
  }

  return formatear(eliminado);
}

async function aprobar(id) {
  return actualizar(id, { habilitado: true });
}

module.exports = {
  Negocio,
  crear,
  listarAprobados,
  listarTodos,
  listarPendientes,
  listarPropios,
  listarCercanos,
  buscarPorId,
  actualizar,
  eliminar,
  aprobar,
  paginar,
};
