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

// NUEVO: igual que requireAuth pero nunca bloquea la request. Si viene un
// token válido, completa req.user (para poder mostrar "likeadoPorMi", etc);
// si no viene token o es inválido, sigue como usuario anónimo.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || "cambiame_super_secreto");
    } catch {
      // token inválido o vencido: seguimos sin romper la request
    }
  }
  return next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
