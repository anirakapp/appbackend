// models/diccionarioModel.js
const mongoose = require("mongoose");

const diccionarioSchema = new mongoose.Schema(
  {
    clave: { type: String, required: true, unique: true, lowercase: true, trim: true },
    categoria: { type: String, required: true, trim: true },
    palabras: { type: [String], default: [] },
  },
  { timestamps: true }
);

const DiccionarioEntry = mongoose.model("DiccionarioEntry", diccionarioSchema);

function formatear(doc) {
  const { _id, __v, ...resto } = doc;
  return { id: _id.toString(), ...resto };
}

function slugificar(texto) {
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

async function listarTodos() {
  const entradas = await DiccionarioEntry.find().sort({ categoria: 1 }).lean();
  return entradas.map(formatear);
}

// Crea una categoría nueva (no pisa nada del diccionario estático).
async function crearEntrada({ categoria, palabras, clave }) {
  if (!categoria || !categoria.trim()) {
    const error = new Error("La categoría es obligatoria");
    error.status = 400;
    throw error;
  }

  const listaPalabras = Array.isArray(palabras)
    ? palabras.map((p) => p.trim()).filter(Boolean)
    : [];

  const claveFinal = slugificar(clave || categoria);
  if (!claveFinal) {
    const error = new Error("No se pudo generar una clave válida para la categoría");
    error.status = 400;
    throw error;
  }

  const existente = await DiccionarioEntry.findOne({ clave: claveFinal }).lean();
  if (existente) {
    const error = new Error(`Ya existe una entrada con la clave "${claveFinal}"`);
    error.status = 409;
    throw error;
  }

  const creada = await DiccionarioEntry.create({
    clave: claveFinal,
    categoria: categoria.trim(),
    palabras: listaPalabras,
  });

  return formatear(creada.toObject());
}

// Agrega palabras a una entrada. Si la clave corresponde a una categoría
// ESTÁTICA (carne, aceite, etc.) que todavía no tiene fila en Mongo, la crea
// ahí mismo (con categoriaFallback) para guardar solo las palabras nuevas.
async function agregarPalabras(clave, palabrasNuevas, categoriaFallback) {
  if (!Array.isArray(palabrasNuevas) || palabrasNuevas.length === 0) {
    const error = new Error("Mandá al menos una palabra clave");
    error.status = 400;
    throw error;
  }

  const claveFinal = slugificar(clave);
  const limpias = palabrasNuevas.map((p) => p.trim()).filter(Boolean);

  let entrada = await DiccionarioEntry.findOneAndUpdate(
    { clave: claveFinal },
    { $addToSet: { palabras: { $each: limpias } } },
    { new: true }
  ).lean();

  if (!entrada) {
    if (!categoriaFallback) {
      const error = new Error("No encontramos esa entrada; para crearla mandá también la categoría");
      error.status = 404;
      throw error;
    }
    entrada = (
      await DiccionarioEntry.create({ clave: claveFinal, categoria: categoriaFallback, palabras: limpias })
    ).toObject();
  }

  return formatear(entrada);
}

module.exports = { DiccionarioEntry, listarTodos, crearEntrada, agregarPalabras, slugificar };
