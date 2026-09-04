// controllers/adminController.js
const adminModel = require("../models/adminModel");

function getCatalogo(req, res) {
  return res.json(adminModel.getCatalogo());
}

function agregarMenuItem(req, res, next) {
  try {
    const item = adminModel.agregarItem("menu", req.body);
    notificar(req, "catalogo:actualizado", adminModel.getCatalogo());
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
}

function actualizarMenuItem(req, res, next) {
  try {
    const item = adminModel.actualizarItem("menu", req.params.id, req.body);
    notificar(req, "catalogo:actualizado", adminModel.getCatalogo());
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

function eliminarMenuItem(req, res, next) {
  try {
    const item = adminModel.eliminarItem("menu", req.params.id);
    notificar(req, "catalogo:actualizado", adminModel.getCatalogo());
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

function agregarBebida(req, res, next) {
  try {
    const item = adminModel.agregarItem("bebidas", req.body);
    notificar(req, "catalogo:actualizado", adminModel.getCatalogo());
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
}

function actualizarBebida(req, res, next) {
  try {
    const item = adminModel.actualizarItem("bebidas", req.params.id, req.body);
    notificar(req, "catalogo:actualizado", adminModel.getCatalogo());
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

function eliminarBebida(req, res, next) {
  try {
    const item = adminModel.eliminarItem("bebidas", req.params.id);
    notificar(req, "catalogo:actualizado", adminModel.getCatalogo());
    return res.json(item);
  } catch (error) {
    return next(error);
  }
}

// Avisa por Socket.IO a todos los clientes conectados (ej: un dashboard admin
// abierto en otra pestaña) que el catálogo cambió, sin que tengan que refrescar.
function notificar(req, evento, payload) {
  const io = req.app.get("io");
  if (io) io.emit(evento, payload);
}

module.exports = {
  getCatalogo,
  agregarMenuItem,
  actualizarMenuItem,
  eliminarMenuItem,
  agregarBebida,
  actualizarBebida,
  eliminarBebida,
};
