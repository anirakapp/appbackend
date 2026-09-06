const negocioModel = require("../models/negociosModel");
const productoModel = require("../models/productoModel");
const { CATEGORIAS_ESTANDAR } = require("../lib/keywordDictionary");

function aplicarPaginacion(res, resultado) {
  res.set("X-Total-Count", String(resultado.total));
  res.set("X-Page", String(resultado.page));
  res.set("X-Total-Pages", String(resultado.totalPages));
  return resultado.data;
}

async function listarPublico(req, res, next) {
  try {
    const { ciudad, lat, lng } = req.query;
    const lista = await negocioModel.listarAprobados(
      ciudad,
      lat != null ? Number(lat) : undefined,
      lng != null ? Number(lng) : undefined,
      req.user ? req.user.id : undefined
    );
    const pagina = negocioModel.paginar(lista, req.query);
    return res.json(aplicarPaginacion(res, pagina));
  } catch (error) {
    return next(error);
  }
}

async function cercanos(req, res, next) {
  try {
    const { lat, lng } = req.query;
    if (lat == null || lng == null) {
      return res.status(400).json({ message: "Faltan lat y lng" });
    }
    const negocios = await negocioModel.listarCercanos(
      Number(lat),
      Number(lng),
      20,
      req.user ? req.user.id : undefined
    );
    return res.json(negocios);
  } catch (error) {
    return next(error);
  }
}

async function registrar(req, res, next) {
  try {
    if (!CATEGORIAS_ESTANDAR.includes(req.body.categoria)) {
      return res.status(400).json({ message: "Categoría inválida." });
    }
    const negocio = await negocioModel.crear({
      ...req.body,
      ownerId: req.user.id,
      habilitado: false,
    });
    notificar(req, "negocios:pendiente", negocio);
    return res.status(201).json(negocio);
  } catch (error) {
    return next(error);
  }
}

async function propios(req, res, next) {
  try {
    const negocios = await negocioModel.listarPropios(req.user.id);
    return res.json(negocios);
  } catch (error) {
    return next(error);
  }
}

// Campos que un dueño de negocio puede editar sobre su propio negocio.
// Deliberadamente NO incluye habilitado/isBlocked/activo/ownerId: esos
// los controla el admin.
const CAMPOS_EDITABLES_PROPIO = [
  "nombre",
  "categoria",
  "imagen",
  "ciudad",
  "direccion",
  "descripcion",
  "barrio",
  "telefono",
  "horarios",
  "palabrasClave",
  "lat",
  "lng",
  "whatsapp",
];

function filtrarCamposPropio(body) {
  const cambios = {};
  for (const campo of CAMPOS_EDITABLES_PROPIO) {
    if (body[campo] !== undefined) cambios[campo] = body[campo];
  }
  return cambios;
}

// Confirma que el negocio existe y pertenece al usuario autenticado antes
// de dejarlo editar o eliminar. Devuelve 404 en vez de 403 para no revelar
// si el id corresponde a un negocio de otra persona.
async function verificarPropietario(id, userId) {
  const negocio = await negocioModel.buscarPorId(id);
  if (!negocio || negocio.ownerId == null || negocio.ownerId.toString() !== userId.toString()) {
    const error = new Error("Negocio no encontrado");
    error.status = 404;
    throw error;
  }
  return negocio;
}

async function propioActualizar(req, res, next) {
  try {
    await verificarPropietario(req.params.id, req.user.id);
    const cambios = filtrarCamposPropio(req.body);
    const negocio = await negocioModel.actualizar(req.params.id, cambios);
    notificar(req, "negocios:actualizado", negocio);
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

async function propioEliminar(req, res, next) {
  try {
    await verificarPropietario(req.params.id, req.user.id);
    await negocioModel.eliminar(req.params.id);
    notificar(req, "negocios:eliminado", { id: req.params.id });
    return res.json({ id: req.params.id });
  } catch (error) {
    return next(error);
  }
}

// Agrega la cantidad de productos cargados a cada negocio, para el panel admin.
async function conCantidadProductos(lista) {
  return Promise.all(
    lista.map(async (negocio) => ({
      ...negocio,
      cantidadProductos: await productoModel.contarPorNegocio(negocio.id),
    }))
  );
}

async function adminTodos(req, res, next) {
  try {
    const lista = await conCantidadProductos(await negocioModel.listarTodos());
    const pagina = negocioModel.paginar(lista, req.query);
    return res.json(aplicarPaginacion(res, pagina));
  } catch (error) {
    return next(error);
  }
}

async function adminPendientes(req, res, next) {
  try {
    const lista = await conCantidadProductos(await negocioModel.listarPendientes());
    const pagina = negocioModel.paginar(lista, req.query);
    return res.json(aplicarPaginacion(res, pagina));
  } catch (error) {
    return next(error);
  }
}

async function adminCrear(req, res, next) {
  try {
    const negocio = await negocioModel.crear({ ...req.body, ownerId: null, habilitado: true });
    notificar(req, "negocios:actualizado", negocio);
    return res.status(201).json(negocio);
  } catch (error) {
    return next(error);
  }
}

async function adminActualizar(req, res, next) {
  try {
    const negocio = await negocioModel.actualizar(req.params.id, req.body);
    notificar(req, "negocios:actualizado", negocio);
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

async function adminEliminar(req, res, next) {
  try {
    await negocioModel.eliminar(req.params.id);
    notificar(req, "negocios:eliminado", { id: req.params.id });
    return res.json({ id: req.params.id });
  } catch (error) {
    return next(error);
  }
}

async function adminAprobar(req, res, next) {
  try {
    const negocio = await negocioModel.aprobar(req.params.id);
    notificar(req, "negocios:actualizado", negocio);
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

async function adminBloquear(req, res, next) {
  try {
    const negocio = await negocioModel.bloquear(req.params.id);
    notificar(req, "negocios:actualizado", negocio);
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

async function adminDesbloquear(req, res, next) {
  try {
    const negocio = await negocioModel.desbloquear(req.params.id);
    notificar(req, "negocios:actualizado", negocio);
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

async function adminActivar(req, res, next) {
  try {
    const negocio = await negocioModel.activar(req.params.id);
    notificar(req, "negocios:actualizado", negocio);
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

async function adminDesactivar(req, res, next) {
  try {
    const negocio = await negocioModel.desactivar(req.params.id);
    notificar(req, "negocios:actualizado", negocio);
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

function notificar(req, evento, payload) {
  const io = req.app.get("io");
  if (io) io.emit(evento, payload);
}

module.exports = {
  listarPublico,
  cercanos,
  registrar,
  propios,
  propioActualizar,
  propioEliminar,
  adminTodos,
  adminPendientes,
  adminCrear,
  adminActualizar,
  adminEliminar,
  adminAprobar,
  adminBloquear,
  adminDesbloquear,
  adminActivar,
  adminDesactivar,
};
