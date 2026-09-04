// controllers/negociosController.js
const negociosModel = require("../models/negociosModel");

function listar(req, res) {
  const { ciudad } = req.query;
  return res.json(negociosModel.getByCiudad(ciudad));
}

/** Panel admin: ve TODOS los negocios, habilitados o no. */
function listarAdmin(req, res) {
  return res.json(negociosModel.getAll());
}

function obtenerUno(req, res) {
  const negocio = negociosModel.getById(req.params.id);
  if (!negocio) {
    return res.status(404).json({ message: "Negocio no encontrado" });
  }
  return res.json(negocio);
}

function crear(req, res, next) {
  try {
    const negocio = negociosModel.create(req.body);
    notificar(req, "negocios:actualizado", negocio);
    return res.status(201).json(negocio);
  } catch (error) {
    return next(error);
  }
}

function actualizar(req, res, next) {
  try {
    const negocio = negociosModel.update(req.params.id, req.body);
    notificar(req, "negocios:actualizado", negocio);
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

function eliminar(req, res, next) {
  try {
    const negocio = negociosModel.remove(req.params.id);
    notificar(req, "negocios:eliminado", { id: req.params.id });
    return res.json(negocio);
  } catch (error) {
    return next(error);
  }
}

function notificar(req, evento, payload) {
  const io = req.app.get("io");
  if (io) io.emit(evento, payload);
}

module.exports = { listar, listarAdmin, obtenerUno, crear, actualizar, eliminar };