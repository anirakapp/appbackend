const express = require("express");
const negociosController = require("../controllers/negociosController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", negociosController.listarPublico);
router.get("/cercanos", negociosController.cercanos);

router.post("/registro", requireAuth, negociosController.registrar);
router.get("/propios", requireAuth, negociosController.propios);

router.get("/admin/todos", requireAuth, requireAdmin, negociosController.adminTodos);
router.get("/admin/pendientes", requireAuth, requireAdmin, negociosController.adminPendientes);
router.post("/", requireAuth, requireAdmin, negociosController.adminCrear);
router.put("/:id", requireAuth, requireAdmin, negociosController.adminActualizar);
router.delete("/:id", requireAuth, requireAdmin, negociosController.adminEliminar);
router.patch("/:id/aprobar", requireAuth, requireAdmin, negociosController.adminAprobar);

module.exports = router;
