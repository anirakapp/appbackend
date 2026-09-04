// index.js — versión serverless, sin server.listen ni socket.io
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userModel = require("./models/userModel");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const negociosRoutes = require("./routes/negociosRoutes");
const calculosRoutes = require("./routes/calculosRoutes");

const app = express();

app.use(cors({
  origin: ["https://frontapp-seven.vercel.app", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());

// Conectar a Mongo UNA vez, cacheado entre invocaciones (patrón recomendado por Vercel)
let dbConectada = false;
app.use(async (req, res, next) => {
  if (!dbConectada) {
    await connectDB();
    await userModel.seedAdmin();
    dbConectada = true;
  }
  next();
});

app.get("/", (req, res) => res.json({ ok: true, message: "Servidor funcionando 🚀" }));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/negocios", negociosRoutes);
app.use("/api/calculo", calculosRoutes);

app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));
app.use((err, req, res, next) => {
  console.error("💥", err.message);
  res.status(err.status || 500).json({ message: err.message || "Error interno" });
});

module.exports = app; // 👈 Vercel usa esto como handler, sin listen()
