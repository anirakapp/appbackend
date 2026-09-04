// routes/adminRoutes.js
const express = require("express");
const adminController = require("../controllers/adminController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/catalogo", adminController.getCatalogo);

router.post("/catalogo/menu", adminController.agregarMenuItem);
router.put("/catalogo/menu/:id", adminController.actualizarMenuItem);
router.delete("/catalogo/menu/:id", adminController.eliminarMenuItem);

router.post("/catalogo/bebidas", adminController.agregarBebida);
router.put("/catalogo/bebidas/:id", adminController.actualizarBebida);
router.delete("/catalogo/bebidas/:id", adminController.eliminarBebida);

module.exports = router;