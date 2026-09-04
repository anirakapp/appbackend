// controllers/authController.js
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

function firmarToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "cambiame_super_secreto",
    { expiresIn: "8h" }
  );
}

function register(req, res, next) {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res
      .status(400)
      .json({ message: "Nombre, email y contraseña son obligatorios" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    // Registro público: siempre role "user", nunca "admin".
    const user = userModel.create({ nombre, email, password, role: "user" });
    const token = firmarToken(user);
    return res.status(201).json({ token, user });
  } catch (error) {
    return next(error);
  }
}

function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son obligatorios" });
  }

  const user = userModel.findByEmail(email);
  const esValido = userModel.verifyPassword(user, password);

  if (!user || !esValido) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const token = firmarToken(user);

  return res.json({ token, user: userModel.toPublicUser(user) });
}

function me(req, res) {
  const user = userModel.findByEmail(req.user.email);
  return res.json({ user: userModel.toPublicUser(user) });
}

module.exports = { register, login, me };