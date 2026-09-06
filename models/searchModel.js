//models/searchModel.js

const negocioModel = require("./negociosModel");
const busquedaModel = require("./busquedaModel");
const { PALABRAS_INTENCION_COMPRA, PALABRAS_CERCANIA } = require("../lib/keywordDictionary");
const { obtenerDiccionario } = require("../lib/diccionarioService");
const { normalizar, tokenizar, coincideAproximado, coincideEnFrase, coincidePrefijoEnFrase } = require("../lib/textUtils");

const PUNTOS = {
  productoExacto: 40,
  categoria: 30,
  palabraClave: 20,
  sinonimo: 15,
  aproximado: 10,
  activo: 10,
  reputacion: 10,
  cercania: 10,
};

const STOPWORDS = new Set([
  "para",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "que",
  "y",
  "o",
  "en",
  "con",
  "por",
  "a",
  "al",
  "se",
  "mi",
  "tu",
  "su",
]);

// Largo mínimo para que un token crudo participe del fallback de
// tokensCrudos en calcularScoreNegocio. Tokens muy cortos generan
// coincidencias de substring poco confiables.
const LARGO_MINIMO_TOKEN_CRUDO = 3;

function esTokenUtil(token) {
  return token.length > 2 && !STOPWORDS.has(token);
}

function detectarIntencion(textoNormalizado) {
  const intencionCompra = PALABRAS_INTENCION_COMPRA.some((frase) =>
    textoNormalizado.includes(normalizar(frase))
  );
  const intencionCercania = PALABRAS_CERCANIA.some((frase) =>
    textoNormalizado.includes(normalizar(frase))
  );

  let limpio = textoNormalizado;
  PALABRAS_INTENCION_COMPRA.forEach((frase) => {
    limpio = limpio.replace(normalizar(frase), " ");
  });
  PALABRAS_CERCANIA.forEach((frase) => {
    limpio = limpio.replace(normalizar(frase), " ");
  });
  limpio = limpio.replace(/\s+/g, " ").trim();

  return { intencionCompra, intencionCercania, textoLimpio: limpio };
}

// Ahora es async: el diccionario puede incluir categorías/palabras cargadas
// por el admin desde el dashboard, además de las fijas del código.
async function expandirTermino(token) {
  const diccionario = await obtenerDiccionario();
  const grupos = [];

  Object.entries(diccionario).forEach(([clave, entrada]) => {
    const coincide = entrada.palabras.some((palabra) => {
      const palabraNorm = normalizar(palabra);
      return coincideEnFrase(token, palabraNorm);
    });
    if (coincide) {
      grupos.push({ clave, categoria: entrada.categoria, palabras: entrada.palabras });
    }
  });

  return grupos;
}

function calcularScoreNegocio(negocio, gruposBuscados, tokensCrudos, opciones) {
  let score = 0;
  let gruposCoincididos = 0;
  let coincidenciaDirecta = false;

  const categoriaNegocio = normalizar(negocio.categoria || "");
  const nombreNegocio = normalizar(negocio.nombre || "");
  const palabrasClaveNegocio = (negocio.palabrasClave || []).map(normalizar);

  gruposBuscados.forEach((grupo) => {
    let coincidioEsteGrupo = false;
    const categoriaGrupo = normalizar(grupo.categoria);
    const categoriaCoincide =
      Boolean(categoriaNegocio) &&
      Boolean(categoriaGrupo) &&
      (categoriaNegocio === categoriaGrupo ||
        categoriaNegocio.includes(categoriaGrupo) ||
        categoriaGrupo.includes(categoriaNegocio));

    if (categoriaCoincide) {
      score += PUNTOS.categoria;
      coincidioEsteGrupo = true;
    }

    if (categoriaCoincide) {
      grupo.palabras.forEach((palabra) => {
        const palabraNorm = normalizar(palabra);

        if (nombreNegocio.includes(palabraNorm) || categoriaNegocio.includes(palabraNorm)) {
          score += PUNTOS.palabraClave;
          coincidioEsteGrupo = true;
        }

        palabrasClaveNegocio.forEach((clave) => {
          if (clave === palabraNorm) {
            score += PUNTOS.productoExacto;
            coincidioEsteGrupo = true;
          } else if (coincideAproximado(clave, palabraNorm)) {
            score += PUNTOS.aproximado;
            coincidioEsteGrupo = true;
          }
        });
      });
    }

    if (coincidioEsteGrupo) {
      gruposCoincididos += 1;
      coincidenciaDirecta = true;
    }
  });

  tokensCrudos
    .filter((token) => token.length >= LARGO_MINIMO_TOKEN_CRUDO)
    .forEach((token) => {
      if (nombreNegocio.includes(token) || categoriaNegocio.includes(token)) {
        score += PUNTOS.palabraClave;
        coincidenciaDirecta = true;
      }
    });

  if (gruposBuscados.length > 1 && gruposCoincididos > 1) {
    score += (gruposCoincididos - 1) * PUNTOS.sinonimo;
  }

  if (coincidenciaDirecta) {
    if (negocio.activo !== false && !negocio.isBlocked) score += PUNTOS.activo;
    if ((negocio.rating || 0) >= 4) score += PUNTOS.reputacion;

    if (opciones.intencionCercania && negocio.distanciaKm != null) {
      score += Math.max(0, PUNTOS.cercania - negocio.distanciaKm);
    }
  }

  return { score, gruposCoincididos };
}

async function buscar({ q, ciudad, lat, lng, userId }) {
  const textoNormalizado = normalizar(q || "");
  if (!textoNormalizado) return { resultados: [], sugerenciaVacia: true };

  const { intencionCercania, textoLimpio } = detectarIntencion(textoNormalizado);

  // Se descartan conectores (stopwords) y tokens demasiado cortos antes de
  // usarlos para expandir términos o para el fallback de matching crudo:
  // son la fuente principal de falsos positivos (ver comentario en STOPWORDS).
  const tokens = tokenizar(textoLimpio).filter(esTokenUtil);

  const gruposPorToken = await Promise.all(tokens.map(expandirTermino));
  const gruposBuscados = gruposPorToken.flat();

  const negocios =
    lat != null && lng != null
      ? await negocioModel.listarCercanos(Number(lat), Number(lng), 50, userId)
      : await negocioModel.listarAprobados(ciudad, undefined, undefined, userId);

  const conScore = negocios
    .map((negocio) => {
      const { score } = calcularScoreNegocio(negocio, gruposBuscados, tokens, { intencionCercania });
      return { negocio, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const resultados = conScore.map((item) => item.negocio);

  await busquedaModel.registrar(q, resultados.length);

  return { resultados, sugerenciaVacia: resultados.length === 0 };
}

// Ahora es async por el mismo motivo que expandirTermino.
async function sugerir(prefijoCrudo) {
  const prefijo = normalizar(prefijoCrudo);
  if (!prefijo || STOPWORDS.has(prefijo)) return [];

  const diccionario = await obtenerDiccionario();
  const vistos = new Set();
  const sugerencias = [];

  Object.values(diccionario).forEach((entrada) => {
    entrada.palabras.forEach((palabra) => {
      const palabraNorm = normalizar(palabra);
      const matchea = coincidePrefijoEnFrase(prefijo, palabraNorm);

      if (matchea && !vistos.has(palabra)) {
        vistos.add(palabra);
        sugerencias.push({ texto: palabra, categoria: entrada.categoria });
      }
    });
  });

  return sugerencias.slice(0, 8);
}

module.exports = { buscar, sugerir, detectarIntencion, expandirTermino };
