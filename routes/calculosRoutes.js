// routes/calculosRoutes.js
const express = require("express");
const calculosController = require("../controllers/calculosController");

const router = express.Router();

router.post("/", calculosController.calcular);

module.exports = router;