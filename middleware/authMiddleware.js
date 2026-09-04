// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Falta el token de autenticación" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "cambiame_super_secreto");
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Requiere permisos de administrador" });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };