const negocioModel = require("../models/negociosModel");

function aplicarPaginacion(res, resultado) {
  res.set("X-Total-Count", String(resultado.total));
  res.set("X-Page", String(resultado.page));
  res.set("X-Total-Pages", String(resultado.totalPages));
  return resultado.data;
}

async function listarPublico(req, res, next) {
  try {
    const lista = await negocioModel.listarAprobados(req.query.ciudad);
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
    const negocios = await negocioModel.listarCercanos(Number(lat), Number(lng));
    return res.json(negocios);
  } catch (error) {
    return next(error);
  }
}

async function registrar(req, res, next) {
  try {
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

async function adminTodos(req, res, next) {
  try {
    const lista = await negocioModel.listarTodos();
    const pagina = negocioModel.paginar(lista, req.query);
    return res.json(aplicarPaginacion(res, pagina));
  } catch (error) {
    return next(error);
  }
}

async function adminPendientes(req, res, next) {
  try {
    const lista = await negocioModel.listarPendientes();
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

function notificar(req, evento, payload) {
  const io = req.app.get("io");
  if (io) io.emit(evento, payload);
}

module.exports = {
  listarPublico, cercanos, registrar, propios,
  adminTodos, adminPendientes, adminCrear, adminActualizar, adminEliminar, adminAprobar,
};
