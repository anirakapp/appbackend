// routes/categoriasRoutes.js
const express = require("express");
const diccionarioService = require("../lib/diccionarioService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const categorias = await diccionarioService.obtenerCategorias();
    return res.json({ categorias });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
