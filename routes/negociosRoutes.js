const express = require("express");
const negociosController = require("../controllers/negociosController");
const likeController = require("../controllers/likeController");
const ratingController = require("../controllers/ratingController");
const { requireAuth, requireAdmin, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Públicas (optionalAuth: si viene token, se agrega "likeadoPorMi" a cada negocio)
router.get("/", optionalAuth, negociosController.listarPublico);
router.get("/cercanos", optionalAuth, negociosController.cercanos);

// Dueño de negocio autenticado
router.post("/registro", requireAuth, negociosController.registrar);
router.get("/propios", requireAuth, negociosController.propios);

// Likes y valoraciones: requieren estar logueado, pero no ser admin
router.post("/:id/like", requireAuth, likeController.like);
router.delete("/:id/like", requireAuth, likeController.unlike);
router.post("/:id/rating", requireAuth, ratingController.valorar);

// Admin: listados
router.get("/admin/todos", requireAuth, requireAdmin, negociosController.adminTodos);
router.get("/admin/pendientes", requireAuth, requireAdmin, negociosController.adminPendientes);

// Admin: CRUD
router.post("/", requireAuth, requireAdmin, negociosController.adminCrear);
router.put("/:id", requireAuth, requireAdmin, negociosController.adminActualizar);
router.delete("/:id", requireAuth, requireAdmin, negociosController.adminEliminar);
router.patch("/:id/aprobar", requireAuth, requireAdmin, negociosController.adminAprobar);

// Admin: bloqueo y activación
router.patch("/:id/bloquear", requireAuth, requireAdmin, negociosController.adminBloquear);
router.patch("/:id/desbloquear", requireAuth, requireAdmin, negociosController.adminDesbloquear);
router.patch("/:id/activar", requireAuth, requireAdmin, negociosController.adminActivar);
router.patch("/:id/desactivar", requireAuth, requireAdmin, negociosController.adminDesactivar);

module.exports = router;
