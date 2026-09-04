// routes/negociosRoutes.js
const express = require("express");
const negociosController = require("../controllers/negociosController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Públicas: las consume el front en la home
router.get("/", negociosController.listar);

// Admin: ve también los deshabilitados. Va ANTES de "/:id" para que
// Express no lo interprete como un id.
router.get("/admin/todos", requireAuth, requireAdmin, negociosController.listarAdmin);

router.get("/:id", negociosController.obtenerUno);

// Protegidas: solo admin
router.post("/", requireAuth, requireAdmin, negociosController.crear);
router.put("/:id", requireAuth, requireAdmin, negociosController.actualizar);
router.delete("/:id", requireAuth, requireAdmin, negociosController.eliminar);

module.exports = router;