// routes/diccionarioRoutes.js
const express = require("express");
const diccionarioController = require("../controllers/diccionarioController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get("/", diccionarioController.getDiccionario);
router.post("/categoria", diccionarioController.crearCategoria);
router.post("/:clave/palabras", diccionarioController.agregarPalabras);
router.delete("/:clave", diccionarioController.eliminarEntrada);

module.exports = router;
