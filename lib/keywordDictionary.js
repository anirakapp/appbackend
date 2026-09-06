// backend/lib/keywordDictionary.js
const DICCIONARIO_BASE = {
  carne: {
    categoria: "carnicería",
    palabras: [
      "carne",
      "carnes",
      "carne vacuna",
      "asado",
      "vacío",
      "vacio",
      "costilla",
      "costillas",
      "nalga",
      "cuadril",
      "paleta",
      "roast beef",
      "carnicería",
      "carniceria",
      "carnicera",
      "carnicero",
    ],
  },
  aceite: {
    categoria: "almacén",
    palabras: [
      "aceite",
      "aceites",
      "haceite",
      "aceite de girasol",
      "aceite de maíz",
      "aceite de maiz",
      "aceite vegetal",
    ],
  },
  pan: {
    categoria: "panadería",
    palabras: ["pan", "panes", "panadería", "panaderia", "pan lactal", "pan fresco"],
  },
  pizza: {
    categoria: "pizzería",
    palabras: [
      "pizza",
      "pizzas",
      "piza",
      "pizzeria",
      "pizzería",
      "mozzarella",
      "muzzarella",
      "mu zzarella",
    ],
  },
  gaseosa: {
    categoria: "bebidas",
    palabras: ["gaseosa", "gaseosas", "bebida", "bebidas", "refresco", "refrescos"],
  },
  queso: {
    categoria: "almacén",
    palabras: ["queso", "quesos", "fiambrería", "fiambreria", "fiambres"],
  },
  salsa: {
    categoria: "almacén",
    palabras: [
      "salsa de tomate",
      "salsa",
      "salsas",
      "tomate",
      "puré de tomate",
      "pure de tomate",
    ],
  },
  vino: {
    categoria: "bebidas",
    palabras: ["vino", "vinos", "vinoteca"],
  },
  singluten: {
    categoria: "sin tacc",
    palabras: [
      "sin gluten",
      "sin tacc",
      "sintacc",
      "sin tac",
      "celíacos",
      "celiacos",
      "ciliacos",
      "alimentos sin gluten",
      "alimentos para celíacos",
      "alimentos para celiacos",
      "comida sin gluten",
      "productos para celiacos",
      "productos para celíacos",
      "psyllium",
      "psilio",
      "sylium",
      "silium",
      "cilium",
      "zilium",
    ],
  },
  supermercado: {
    categoria: "supermercado",
    palabras: ["supermercado", "supermercados", "almacén", "almacen", "autoservicio"],
  },
  papas: {
    categoria: "verdulería",
    palabras: ["papa", "papas", "verduleria", "verdulería"],
  },
  rotiseria: {
    categoria: "rotisería",
    palabras: [
      "rotisería",
      "rotiseria",
      "pollo al horno",
      "pollo asado",
      "empanadas",
      "comida lista",
      "comida para llevar",
      "vianda",
      "viandas",
    ],
  },
  ferreteria: {
    categoria: "ferretería",
    palabras: [
      "ferretería",
      "ferreteria",
      "tornillos",
      "herramientas",
      "pintura",
      "clavos",
      "candado",
      "cerrajería",
      "cerrajeria",
    ],
  },
};

// Frases que indican intención de "quiero comprar X" (se detectan y se
// descartan del texto antes de tokenizar, para no confundir al buscador).
const PALABRAS_INTENCION_COMPRA = [
  "donde compro",
  "dónde compro",
  "donde comprar",
  "dónde comprar",
  "quiero comprar",
  "necesito comprar",
  "necesito",
  "busco",
];

// Frases que indican intención de cercanía ("carnicería cerca").
const PALABRAS_CERCANIA = [
  "cerca mio",
  "cerca mío",
  "cerca de mi",
  "cerca de mí",
  "por aca",
  "por acá",
  "cercano",
  "cercanos",
  "cerca",
];

const CATEGORIAS_ESTANDAR = [...new Set(Object.values(DICCIONARIO_BASE).map((e) => e.categoria))].sort();

module.exports = {
  DICCIONARIO_BASE,
  PALABRAS_INTENCION_COMPRA,
  PALABRAS_CERCANIA,
  CATEGORIAS_ESTANDAR,
};
