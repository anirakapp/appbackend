const express = require("express");
const searchController = require("../controllers/searchController");
const { requireAuth, requireAdmin, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, searchController.buscar);
router.get("/sugerencias", searchController.sugerencias);
router.get("/populares", requireAuth, requireAdmin, searchController.populares);

module.exports = router;
