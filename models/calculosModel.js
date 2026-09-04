// models/calculosModel.js

const MARGEN_EXTRA = 1.1; // +10% para que "falte lo justo"
const PORCIONES_POR_PIZZA = 8; // pizza standard: 8 porciones

const MENU_RULES = {
  asado: [
    { label: "Vacío / Carne", unidad: "kg", porAdulto: 0.4, porNino: 0.2 },
    { label: "Chorizos", unidad: "unid", porAdulto: 1, porNino: 0.5 },
    { label: "Pan", unidad: "kg", porAdulto: 0.1, porNino: 0.05 },
  ],
  "pollo-horno": [{ label: "Pollo", unidad: "kg", porAdulto: 0.35, porNino: 0.2 }],
  hamburguesas: [
    { label: "Carne para hamburguesas", unidad: "kg", porAdulto: 0.2, porNino: 0.12 },
    { label: "Pan de hamburguesa", unidad: "unid", porAdulto: 1, porNino: 1 },
  ],
  pastas: [{ label: "Pastas", unidad: "kg", porAdulto: 0.15, porNino: 0.1 }],
  pizza: [
    {
      label: "Pizza",
      unidad: "unid",
      porAdulto: 3 / PORCIONES_POR_PIZZA,
      porNino: 2 / PORCIONES_POR_PIZZA,
    },
  ],
  empanadas: [{ label: "Empanadas", unidad: "unid", porAdulto: 3, porNino: 2 }],
  choripan: [{ label: "Choripán", unidad: "unid", porAdulto: 1, porNino: 0.5 }],
  milanesas: [{ label: "Milanesas", unidad: "unid", porAdulto: 1.5, porNino: 1 }],
  ensaladas: [{ label: "Ensalada", unidad: "kg", porAdulto: 0.1, porNino: 0.08 }],
  postres: [{ label: "Postres", unidad: "kg", porAdulto: 0.12, porNino: 0.12 }],
};

const DRINK_RULES = {
  gaseosa: { label: "Gaseosa", unidad: "litros", porAdulto: 0.5, porNino: 0.4, soloAdultos: false },
  agua: { label: "Agua", unidad: "litros", porAdulto: 0.35, porNino: 0.3, soloAdultos: false },
  jugo: { label: "Jugo", unidad: "litros", porAdulto: 0.3, porNino: 0.35, soloAdultos: false },
  vino: { label: "Vino", unidad: "litros", porAdulto: 0.2, porNino: 0, soloAdultos: true },
  cerveza: { label: "Cerveza", unidad: "litros", porAdulto: 0.4, porNino: 0, soloAdultos: true },
};

const HIELO_RULE = { label: "Hielo", unidad: "kg", porAdulto: 0.15, porNino: 0.1 };

function redondear(valor, unidad) {
  const conMargen = valor * MARGEN_EXTRA;
  if (unidad === "unid") return Math.ceil(conMargen);
  return Math.round(conMargen * 10) / 10;
}

function sumarAResumen(mapaResumen, regla, adultos, ninos, soloAdultos = false) {
  const cantidadNinos = soloAdultos ? 0 : ninos * regla.porNino;
  const cantidadCruda = adultos * regla.porAdulto + cantidadNinos;

  const clave = `${regla.label}__${regla.unidad}`;
  const existente = mapaResumen.get(clave);
  if (existente) {
    existente.crudo += cantidadCruda;
    existente.cantidad = redondear(existente.crudo, regla.unidad);
  } else {
    mapaResumen.set(clave, {
      label: regla.label,
      unidad: regla.unidad,
      crudo: cantidadCruda,
      cantidad: redondear(cantidadCruda, regla.unidad),
    });
  }
}

function calcular({ adultos, ninos, menu, bebidas }) {
  const mapaResumen = new Map();

  menu.forEach((menuId) => {
    const reglas = MENU_RULES[menuId];
    if (!reglas) return; // id desconocido: se ignora en vez de romper el cálculo
    reglas.forEach((regla) => sumarAResumen(mapaResumen, regla, adultos, ninos));
  });

  bebidas.forEach((bebidaId) => {
    const regla = DRINK_RULES[bebidaId];
    if (!regla) return;
    sumarAResumen(mapaResumen, regla, adultos, ninos, regla.soloAdultos);
  });

  if (bebidas.length > 0) {
    sumarAResumen(mapaResumen, HIELO_RULE, adultos, ninos);
  }

  const resumen = Array.from(mapaResumen.values()).map(
    ({ label, unidad, cantidad }) => ({ label, unidad, cantidad })
  );

  return {
    resumen,
    consejo:
      "Sumamos un margen extra del 10% para que no falte comida ni bebida.",
  };
}

module.exports = {
  calcular,
  MENU_RULES,
  DRINK_RULES,
};
