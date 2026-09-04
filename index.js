require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const negociosRoutes = require("./routes/negociosRoutes");
const calculosRoutes = require("./routes/calculosRoutes");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Los controllers acceden a io vía req.app.get("io") para emitir eventos
// en tiempo real (ej: cuando el admin edita el catálogo o un negocio).
app.set("io", io);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Servidor funcionando 🚀"
  });
});

// Rutas de la API: index -> routes -> controllers -> models
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/negocios", negociosRoutes);
app.use("/api/calculo", calculosRoutes);

// 404 para cualquier ruta no definida arriba
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Manejador de errores centralizado (lo usan los controllers via next(error))
app.use((err, req, res, next) => {
  console.error("💥", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Error interno del servidor"
  });
});

// Conexiones Socket.IO
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);

  // Cuando un cliente manda un mensaje
  socket.on("mensaje", (data) => {
    console.log("📩 Mensaje recibido:", data);

    // Enviar a TODOS los clientes conectados
    io.emit("mensaje", data);
  });

  // Cuando se desconecta
  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor trota en http://localhost:${PORT}`);
  console.log(`⚡ Socket.IO activo`);
});