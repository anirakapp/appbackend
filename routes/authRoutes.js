// routes/authRoutes.js
const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.patch("/avatar", requireAuth, authController.actualizarAvatar);
module.exports = router;
