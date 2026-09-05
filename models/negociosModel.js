const mongoose = require("mongoose");

const negocioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    categoria: { type: String, required: true, trim: true },
    imagen: { type: String, required: true },
    ciudad: { type: String, required: true, lowercase: true, trim: true },
    direccion: { type: String },
    // NUEVO: campos adicionales pedidos, reutilizando nombres ya existentes
    // donde correspondía (lat/lng ya existían y cumplen el rol de
    // "latitude/longitude" del pedido original).
    descripcion: { type: String, trim: true },
    barrio: { type: String, trim: true },
    telefono: { type: String, trim: true },
    horarios: { type: String, trim: true },
    palabrasClave: { type: [String], default: [] },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    badge: { type: String },
    whatsapp: { type: String },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    auspiciado: { type: Boolean, default: false },
    habilitado: { type: Boolean, default: false }, // false = pendiente de aprobación
    // NUEVO: activo/inactivo (lo maneja el dueño o el admin) e isBlocked
    // (solo lo maneja el admin). Ambos, además de habilitado=false,
    // sacan al negocio de los resultados públicos y del buscador.
    activo: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    likedBy: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true } // createdAt / updatedAt automáticos
);

// Índices para que la búsqueda y el listado por ciudad escalen bien
// (pensado para pasar de decenas a miles de negocios sin cambiar código).
negocioSchema.index({ ciudad: 1, habilitado: 1, isBlocked: 1, activo: 1 });
negocioSchema.index({ categoria: 1 });
negocioSchema.index({ palabrasClave: 1 });
negocioSchema.index({ nombre: "text", categoria: "text", palabrasClave: "text" });

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

// Convierte el doc de Mongo (_id) al mismo shape que ya consume el front (id).
// Si se pasa userId, agrega "likeadoPorMi" y nunca expone el array crudo
// likedBy (contiene ids de otros usuarios).
function formatear(doc, userId) {
  const { _id, __v, likedBy, ...resto } = doc;
  const negocio = {
    id: _id.toString(),
    ...resto,
    distanciaKm: resto.distanciaKm || 0,
  };
  if (userId) {
    negocio.likeadoPorMi = (likedBy || []).some((id) => id.toString() === userId.toString());
  }
  return negocio;
}

async function crear({
  nombre,
  categoria,
  imagen,
  ciudad,
  direccion,
  descripcion,
  barrio,
  telefono,
  horarios,
  palabrasClave,
  lat,
  lng,
  badge,
  whatsapp,
  auspiciado,
  ownerId,
  habilitado,
  activo,
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
    descripcion: descripcion || undefined,
    barrio: barrio || undefined,
    telefono: telefono || undefined,
    horarios: horarios || undefined,
    palabrasClave: Array.isArray(palabrasClave) ? palabrasClave : [],
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    badge: badge || undefined,
    whatsapp: whatsapp || undefined,
    auspiciado: Boolean(auspiciado),
    habilitado: Boolean(habilitado),
    activo: activo != null ? Boolean(activo) : true,
    ownerId: ownerId || null,
  });

  return formatear(negocio.toObject());
}

// Filtro común para todo lo que se muestra públicamente: aprobado por admin,
// no bloqueado y activo.
function filtroPublico(extra = {}) {
  return { habilitado: true, isBlocked: false, activo: true, ...extra };
}

async function listarAprobados(ciudad, lat, lng, userId) {
  const filtro = filtroPublico();
  if (ciudad) filtro.ciudad = String(ciudad).toLowerCase();

  const negocios = await Negocio.find(filtro).sort({ createdAt: -1 }).lean();
  const formateados = negocios.map((n) => formatear(n, userId));

  if (lat == null || lng == null) return formateados;

  return formateados
    .map((n) => ({
      ...n,
      distanciaKm:
        n.lat != null && n.lng != null
          ? calcularDistanciaKm(lat, lng, n.lat, n.lng)
          : n.distanciaKm,
    }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}

async function listarTodos() {
  const negocios = await Negocio.find().sort({ createdAt: -1 }).lean();
  return negocios.map((n) => formatear(n));
}

async function listarPendientes() {
  const negocios = await Negocio.find({ habilitado: false }).sort({ createdAt: -1 }).lean();
  return negocios.map((n) => formatear(n));
}

async function listarPropios(ownerId) {
  const negocios = await Negocio.find({ ownerId }).sort({ createdAt: -1 }).lean();
  return negocios.map((n) => formatear(n));
}

async function listarCercanos(lat, lng, maxKm = 20, userId) {
  const negocios = await Negocio.find(
    filtroPublico({ lat: { $ne: null }, lng: { $ne: null } })
  ).lean();

  return negocios
    .map((n) => ({
      ...formatear(n, userId),
      distanciaKm: calcularDistanciaKm(lat, lng, n.lat, n.lng),
    }))
    .filter((n) => n.distanciaKm <= maxKm)
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}

// Usado internamente por el buscador: todos los negocios visibles
// públicamente, sin filtrar por ciudad, para poder aplicar el scoring.
async function listarBuscables(userId) {
  const negocios = await Negocio.find(filtroPublico()).lean();
  return negocios.map((n) => formatear(n, userId));
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

async function bloquear(id) {
  return actualizar(id, { isBlocked: true });
}

async function desbloquear(id) {
  return actualizar(id, { isBlocked: false });
}

async function activar(id) {
  return actualizar(id, { activo: true });
}

async function desactivar(id) {
  return actualizar(id, { activo: false });
}

// --- Likes -------------------------------------------------------------
// Se guardan en likedBy (array de userId) para poder impedir que un mismo
// usuario sume infinitos likes. El contador "likes" queda desnormalizado
// para que listar negocios no tenga que calcular el tamaño del array cada vez.

async function darLike(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Negocio no encontrado");
    error.status = 404;
    throw error;
  }

  const antes = await Negocio.findById(id).lean();
  if (!antes) {
    const error = new Error("Negocio no encontrado");
    error.status = 404;
    throw error;
  }

  const yaExistia = (antes.likedBy || []).some((u) => u.toString() === userId.toString());

  if (!yaExistia) {
    await Negocio.findByIdAndUpdate(id, {
      $addToSet: { likedBy: userId },
      $inc: { likes: 1 },
    });
  }

  const actualizado = await Negocio.findById(id).lean();
  return formatear(actualizado, userId);
}

async function quitarLike(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Negocio no encontrado");
    error.status = 404;
    throw error;
  }

  const antes = await Negocio.findById(id).lean();
  if (!antes) {
    const error = new Error("Negocio no encontrado");
    error.status = 404;
    throw error;
  }

  const teniaLike = (antes.likedBy || []).some((u) => u.toString() === userId.toString());

  if (teniaLike) {
    await Negocio.findByIdAndUpdate(id, {
      $pull: { likedBy: userId },
      $inc: { likes: -1 },
    });
  }

  const actualizado = await Negocio.findById(id).lean();
  return formatear(actualizado, userId);
}

module.exports = {
  Negocio,
  crear,
  listarAprobados,
  listarTodos,
  listarPendientes,
  listarPropios,
  listarCercanos,
  listarBuscables,
  buscarPorId,
  actualizar,
  eliminar,
  aprobar,
  bloquear,
  desbloquear,
  activar,
  desactivar,
  darLike,
  quitarLike,
  paginar,
  formatear,
  calcularDistanciaKm,
};
