// lib/diccionarioService.js
const { DICCIONARIO_BASE } = require("./keywordDictionary");
const diccionarioModel = require("../models/diccionarioModel");

const TTL_MS = 30_000; // cache en memoria por instancia serverless
let cache = null;
let cacheAt = 0;

function clonarBase() {
  const copia = {};
  Object.entries(DICCIONARIO_BASE).forEach(([clave, entrada]) => {
    copia[clave] = { categoria: entrada.categoria, palabras: [...entrada.palabras] };
  });
  return copia;
}

async function construirDiccionario() {
  const combinado = clonarBase();
  const dinamicas = await diccionarioModel.listarTodos();

  dinamicas.forEach((entrada) => {
    if (combinado[entrada.clave]) {
      // Categoría estática: solo le sumamos las palabras nuevas, sin duplicar.
      const vistos = new Set(combinado[entrada.clave].palabras.map((p) => p.toLowerCase()));
      entrada.palabras.forEach((p) => {
        if (!vistos.has(p.toLowerCase())) {
          combinado[entrada.clave].palabras.push(p);
          vistos.add(p.toLowerCase());
        }
      });
    } else {
      // Categoría 100% nueva, cargada por el admin.
      combinado[entrada.clave] = { categoria: entrada.categoria, palabras: [...entrada.palabras] };
    }
  });

  return combinado;
}

async function obtenerDiccionario() {
  const ahora = Date.now();
  if (!cache || ahora - cacheAt > TTL_MS) {
    cache = await construirDiccionario();
    cacheAt = ahora;
  }
  return cache;
}

async function obtenerCategorias() {
  const diccionario = await obtenerDiccionario();
  return [...new Set(Object.values(diccionario).map((e) => e.categoria))].sort();
}

function invalidarCache() {
  cache = null;
  cacheAt = 0;
}

module.exports = { obtenerDiccionario, obtenerCategorias, invalidarCache };
