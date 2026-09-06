// models/diccionarioModel.js
const mongoose = require("mongoose");
const { DICCIONARIO_BASE } = require("../lib/keywordDictionary");
const { normalizar } = require("../lib/textUtils");

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

// Busca si ya existe una categoría con ese nombre (estática o ya cargada por
// el admin), sin importar tildes/mayúsculas, para no permitir duplicados
// como "carne" vs "carnicería" apuntando a lo mismo.
async function buscarClaveExistente(categoriaTexto) {
  const categoriaNorm = normalizar(categoriaTexto);

  const enEstatico = Object.entries(DICCIONARIO_BASE).find(
    ([, entrada]) => normalizar(entrada.categoria) === categoriaNorm
  );
  if (enEstatico) return enEstatico[0];

  const dinamicas = await DiccionarioEntry.find().lean();
  const enDinamico = dinamicas.find((e) => normalizar(e.categoria) === categoriaNorm);
  return enDinamico ? enDinamico.clave : null;
}

async function listarTodos() {
  const entradas = await DiccionarioEntry.find().sort({ categoria: 1 }).lean();
  return entradas.map(formatear);
}

// Crea una categoría 100% nueva. Si ya existe una con ese nombre, rechaza
// y avisa cuál es su clave para que se le agreguen palabras ahí en vez de
// duplicarla.
async function crearEntrada({ categoria, palabras, clave }) {
  if (!categoria || !categoria.trim()) {
    const error = new Error("La categoría es obligatoria");
    error.status = 400;
    throw error;
  }

  const claveExistente = await buscarClaveExistente(categoria);
  if (claveExistente) {
    const error = new Error(
      `Ya existe la categoría "${categoria}" (clave "${claveExistente}"). Agregale las palabras nuevas desde esa entrada en vez de crear una repetida.`
    );
    error.status = 409;
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

  const existentePorClave = await DiccionarioEntry.findOne({ clave: claveFinal }).lean();
  if (existentePorClave) {
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
    const categoria = categoriaFallback || DICCIONARIO_BASE[claveFinal]?.categoria;
    if (!categoria) {
      const error = new Error("No encontramos esa entrada; para crearla mandá también la categoría");
      error.status = 404;
      throw error;
    }
    entrada = (
      await DiccionarioEntry.create({ clave: claveFinal, categoria, palabras: limpias })
    ).toObject();
  }

  return formatear(entrada);
}

async function eliminarEntrada(clave) {
  const claveFinal = slugificar(clave);
  const eliminada = await DiccionarioEntry.findOneAndDelete({ clave: claveFinal }).lean();
  if (!eliminada) {
    const error = new Error("No encontramos esa entrada para eliminar");
    error.status = 404;
    throw error;
  }
  return formatear(eliminada);
}

module.exports = {
  DiccionarioEntry,
  listarTodos,
  crearEntrada,
  agregarPalabras,
  eliminarEntrada,
  slugificar,
};
