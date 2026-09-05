require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const userModel = require("./models/userModel");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const negociosRoutes = require("./routes/negociosRoutes");
const calculosRoutes = require("./routes/calculosRoutes");

const app = express();
const server = http.createServer(app);

// --- CORS: whitelist explícita + manejo de preflight ---
const ORIGENES_PERMITIDOS = [
  "https://frontapp-seven.vercel.app",
  "http://localhost:3000", // para desarrollo local
];

const corsOptions = {
  origin(origin, callback) {
    // Permite requests sin origin (Postman, curl, server-to-server)
    if (!origin || ORIGENES_PERMITIDOS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// Responde explícitamente a cualquier preflight OPTIONS
app.options("*", cors(corsOptions));

app.use(express.json());

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: ORIGENES_PERMITIDOS,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Servidor funcionando 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/negocios", negociosRoutes);
app.use("/api/calculo", calculosRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Manejador de errores — también necesita permitir CORS en la respuesta de error
app.use((err, req, res, next) => {
  console.error("💥", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Error interno del servidor",
  });
});

io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);

  socket.on("mensaje", (data) => {
    console.log("📩 Mensaje recibido:", data);
    io.emit("mensaje", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

async function iniciar() {
  try {
    await connectDB();
    await userModel.seedAdmin();

    server.listen(PORT, () => {
      console.log(`🚀 Servidor trota en http://localhost:${PORT}`);
      console.log(`⚡ Socket.IO activo`);
    });
  } catch (error) {
    console.error("💥 No se pudo conectar a la base de datos:", error.message);
    process.exit(1);
  }
}

iniciar();

module.exports = app; // 👈 necesario si Vercel lo importa como función serverless
