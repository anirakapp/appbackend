require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const userModel = require("./models/userModel"); // 👈 nuevo

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

app.set("io", io);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Servidor funcionando 🚀"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/negocios", negociosRoutes);
app.use("/api/calculo", calculosRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  console.error("💥", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Error interno del servidor"
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
    await userModel.seedAdmin(); // 👈 nuevo: crea el admin ya con Mongo conectado

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
