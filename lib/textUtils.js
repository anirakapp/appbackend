// backend/lib/textUtils.js

function normalizar(texto) {
  if (!texto) return "";
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca tildes
    .replace(/[^a-z0-9\s]/g, " ") // saca puntuación
    .replace(/\s+/g, " ")
    .trim();
}

function distanciaLevenshtein(a, b) {
  const filas = a.length + 1;
  const columnas = b.length + 1;
  const dp = Array.from({ length: filas }, () => new Array(columnas).fill(0));
  for (let i = 0; i < filas; i += 1) dp[i][0] = i;
  for (let j = 0; j < columnas; j += 1) dp[0][j] = j;
  for (let i = 1; i < filas; i += 1) {
    for (let j = 1; j < columnas; j += 1) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + costo);
    }
  }
  return dp[filas - 1][columnas - 1];
}

// Similitud entre 0 y 1 (1 = idéntico), basada en Levenshtein normalizado.
function similitud(a, b) {
  const largoMax = Math.max(a.length, b.length);
  if (largoMax === 0) return 1;
  return 1 - distanciaLevenshtein(a, b) / largoMax;
}

// Dado dos palabras normalizadas, decide si son "suficientemente parecidas"
// como para considerarse el mismo término con un error de tipeo
// (carniseria -> carniceria, piza -> pizza, haceite -> aceite, etc).
function coincideAproximado(palabra, candidata) {
  if (!palabra || !candidata) return false;
  if (candidata.includes(palabra) || palabra.includes(candidata)) return true;
  const umbral = palabra.length <= 4 ? 0.7 : 0.75;
  return similitud(palabra, candidata) >= umbral;
}

function coincideEnFrase(token, frase) {
  if (!token || !frase) return false;
  if (frase === token) return true;
  if (frase.includes(token) || token.includes(frase)) return true;
  return frase.split(" ").some((palabra) => coincideAproximado(token, palabra));
}


function coincidePrefijoEnFrase(prefijo, frase) {
  if (!prefijo || !frase) return false;
  return frase
    .split(" ")
    .some(
      (palabra) =>
        palabra.startsWith(prefijo) ||
        (prefijo.length >= 3 && coincideAproximado(prefijo, palabra))
    );
}

function tokenizar(texto) {
  return normalizar(texto).split(" ").filter(Boolean);
}

module.exports = {
  normalizar,
  distanciaLevenshtein,
  similitud,
  coincideAproximado,
  coincideEnFrase,
  coincidePrefijoEnFrase,
  tokenizar,
};
