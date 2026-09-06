const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatarUrl: { type: String, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@cuantocompro.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin1234";

  const yaExiste = await User.findOne({ email });
  if (yaExiste) return;

  await User.create({
    nombre: "Administrador",
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "admin",
  });

  console.log(`👤 Admin sembrado: ${email}`);
}

async function findByEmail(email) {
  if (!email) return null;
  return User.findOne({ email: String(email).toLowerCase() });
}

function verifyPassword(user, password) {
  if (!user) return false;
  return bcrypt.compareSync(password, user.passwordHash);
}

function toPublicUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : user;
  return {
    id: obj._id.toString(),
    nombre: obj.nombre,
    email: obj.email,
    role: obj.role,
    avatarUrl: obj.avatarUrl || null,
  };
}

async function create({ nombre, email, password, role = "user" }) {
  const existente = await findByEmail(email);
  if (existente) {
    const error = new Error("Ya existe un usuario con ese email");
    error.status = 409;
    throw error;
  }

  const nuevo = await User.create({
    nombre,
    email: String(email).toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
  });

  return toPublicUser(nuevo);
}

async function actualizarAvatar(userId, avatarUrl) {
  const user = await User.findByIdAndUpdate(
    userId,
    { avatarUrl: avatarUrl || null },
    { new: true, runValidators: true }
  );
  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.status = 404;
    throw error;
  }
  return toPublicUser(user);
}

module.exports = {
  User,
  seedAdmin,
  findByEmail,
  verifyPassword,
  toPublicUser,
  create,
  actualizarAvatar,
};
