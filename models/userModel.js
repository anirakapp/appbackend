// models/userModel.js
// "DB" en memoria. El día que sumen una base de datos real (Mongo/Postgres),
// esta es la única pieza que hay que reemplazar: la forma (findByEmail,
// verifyPassword, create) puede quedar igual.
const bcrypt = require("bcryptjs");

const USERS = [];

function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@cuantocompro.com";
  const password = process.env.ADMIN_PASSWORD || "admin1234";

  const yaExiste = USERS.some((u) => u.email === email);
  if (yaExiste) return;

  USERS.push({
    id: "admin-1",
    nombre: "Administrador",
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "admin",
  });

  console.log(`👤 Admin sembrado: ${email}`);
}

function findByEmail(email) {
  return USERS.find((u) => u.email === email) || null;
}

function verifyPassword(user, password) {
  if (!user) return false;
  return bcrypt.compareSync(password, user.passwordHash);
}

function toPublicUser(user) {
  if (!user) return null;
  const { id, nombre, email, role } = user;
  return { id, nombre, email, role };
}

function create({ nombre, email, password, role = "user" }) {
  const existente = findByEmail(email);
  if (existente) {
    const error = new Error("Ya existe un usuario con ese email");
    error.status = 409;
    throw error;
  }

  const nuevo = {
    id: `user-${USERS.length + 1}`,
    nombre,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
  };
  USERS.push(nuevo);
  return toPublicUser(nuevo);
}

seedAdmin();

module.exports = {
  USERS,
  findByEmail,
  verifyPassword,
  toPublicUser,
  create,
};