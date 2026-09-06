const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

function firmarToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "cambiame_super_secreto",
    { expiresIn: "8h" }
  );
}

async function register(req, res, next) {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ message: "Nombre, email y contraseña son obligatorios" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
  }
  try {
    const user = await userModel.create({ nombre, email, password, role: "user" });
    const token = firmarToken(user);
    return res.status(201).json({ token, user });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son obligatorios" });
  }
  try {
    const user = await userModel.findByEmail(email);
    const esValido = userModel.verifyPassword(user, password);
    if (!user || !esValido) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    const token = firmarToken(user);
    return res.json({ token, user: userModel.toPublicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findByEmail(req.user.email);
    return res.json({ user: userModel.toPublicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function actualizarAvatar(req, res, next) {
  try {
    const { avatarUrl } = req.body;
    if (avatarUrl && !/^https?:\/\/.+/i.test(avatarUrl)) {
      return res.status(400).json({ message: "La URL del avatar no es válida" });
    }
    const user = await userModel.actualizarAvatar(req.user.id, avatarUrl);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, me, actualizarAvatar };
