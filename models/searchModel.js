//models/searchModel.js

const negocioModel = require("./negociosModel");
const busquedaModel = require("./busquedaModel");
const {
  DICCIONARIO,
  PALABRAS_INTENCION_COMPRA,
  PALABRAS_CERCANIA,
} = require("../lib/keywordDictionary");
const { normalizar, tokenizar, coincideAproximado } = require("../lib/textUtils");

// Puntajes orientativos pedidos, ya aplicados en un sistema consistente.
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

// Expande un token de búsqueda a la(s) entrada(s) del diccionario que
// matchean (exacto, contiene, o aproximado por errores de tipeo).
function expandirTermino(token) {
  const grupos = [];

  Object.entries(DICCIONARIO).forEach(([clave, entrada]) => {
    const coincide = entrada.palabras.some((palabra) => {
      const palabraNorm = normalizar(palabra);
      if (palabraNorm === token) return true;
      if (palabraNorm.includes(token) || token.includes(palabraNorm)) return true;
      return coincideAproximado(token, palabraNorm);
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
  let coincidenciaDirecta = false; // true solo si hubo un match real con lo buscado

  const categoriaNegocio = normalizar(negocio.categoria || "");
  const nombreNegocio = normalizar(negocio.nombre || "");
  const palabrasClaveNegocio = (negocio.palabrasClave || []).map(normalizar);

  gruposBuscados.forEach((grupo) => {
    let coincidioEsteGrupo = false;
    const categoriaCoincide =
      categoriaNegocio && normalizar(grupo.categoria) === categoriaNegocio;

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

  // Coincidencia directa de tokens crudos (por si el usuario buscó algo que
  tokensCrudos.forEach((token) => {
    if (nombreNegocio.includes(token) || categoriaNegocio.includes(token)) {
      score += PUNTOS.palabraClave;
      coincidenciaDirecta = true;
    }
  });

  // Multi-producto: si el negocio coincide con varios de los grupos
  if (gruposBuscados.length > 1 && gruposCoincididos > 1) {
    score += (gruposCoincididos - 1) * PUNTOS.sinonimo;
  }

  // Importante: estos son puntos de CALIDAD para ordenar entre negocios que
  if (coincidenciaDirecta) {
    if (negocio.activo !== false && !negocio.isBlocked) score += PUNTOS.activo;
    if ((negocio.rating || 0) >= 4) score += PUNTOS.reputacion;

    if (opciones.intencionCercania && negocio.distanciaKm != null) {
      score += Math.max(0, PUNTOS.cercania - negocio.distanciaKm);
    }
  }

  return { score, gruposCoincididos };
}
  // Coincidencia directa de tokens crudos (por si el usuario buscó algo que
  // no está en el diccionario, ej. el nombre propio de un negocio).
  tokensCrudos.forEach((token) => {
    if (nombreNegocio.includes(token) || categoriaNegocio.includes(token)) {
      score += PUNTOS.palabraClave;
    }
  });

  // Multi-producto: si el negocio coincide con varios de los grupos
  // buscados ("carne y pan"), le damos un bonus por cubrir más de uno.
  if (gruposBuscados.length > 1 && gruposCoincididos > 1) {
    score += (gruposCoincididos - 1) * PUNTOS.sinonimo;
  }

  if (negocio.activo !== false && !negocio.isBlocked) score += PUNTOS.activo;
  if ((negocio.rating || 0) >= 4) score += PUNTOS.reputacion;

  if (opciones.intencionCercania && negocio.distanciaKm != null) {
    score += Math.max(0, PUNTOS.cercania - negocio.distanciaKm);
  }

  return { score, gruposCoincididos };
}

async function buscar({ q, ciudad, lat, lng, userId }) {
  const textoNormalizado = normalizar(q || "");
  if (!textoNormalizado) return { resultados: [], sugerenciaVacia: true };

  const { intencionCercania, textoLimpio } = detectarIntencion(textoNormalizado);
  const tokens = tokenizar(textoLimpio);

  const gruposBuscados = tokens.map(expandirTermino).flat();

  const negocios =
    lat != null && lng != null
      ? await negocioModel.listarCercanos(Number(lat), Number(lng), 50, userId)
      : await negocioModel.listarAprobados(ciudad, undefined, undefined, userId);

  const conScore = negocios
    .map((negocio) => {
      const { score } = calcularScoreNegocio(negocio, gruposBuscados, tokens, {
        intencionCercania,
      });
      return { negocio, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const resultados = conScore.map((item) => item.negocio);

  await busquedaModel.registrar(q, resultados.length);

  return { resultados, sugerenciaVacia: resultados.length === 0 };
}

// Sugerencias de autocompletado a partir del diccionario (no inventa
// negocios, solo términos/categorías conocidas).
function sugerir(prefijoCrudo) {
  const prefijo = normalizar(prefijoCrudo);
  if (!prefijo) return [];

  const vistos = new Set();
  const sugerencias = [];

  Object.values(DICCIONARIO).forEach((entrada) => {
    entrada.palabras.forEach((palabra) => {
      const palabraNorm = normalizar(palabra);
      const matchea =
        palabraNorm.startsWith(prefijo) ||
        (prefijo.length >= 3 && coincideAproximado(prefijo, palabraNorm));

      if (matchea && !vistos.has(palabra)) {
        vistos.add(palabra);
        sugerencias.push({ texto: palabra, categoria: entrada.categoria });
      }
    });
  });

  return sugerencias.slice(0, 8);
}

module.exports = { buscar, sugerir, detectarIntencion, expandirTermino };
