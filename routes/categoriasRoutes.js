// routes/categoriasRoutes.js
const express = require("express");
const { CATEGORIAS_ESTANDAR } = require("../lib/keywordDictionary");

const router = express.Router();

// Pública, de solo lectura: no requiere auth.
router.get("/", (req, res) => {
  res.json({ categorias: CATEGORIAS_ESTANDAR });
});

module.exports = router;
