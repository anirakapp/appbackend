// models/adminModel.js
// Guarda el catálogo editable por el admin: platos de menú y bebidas.
// Mismos ids que usa el front en lib/menuData.ts y lib/drinksData.ts,
// para que el día que el front pida el catálogo acá (GET /api/admin/catalogo)
// en vez de tenerlo hardcodeado, no haya que tocar ids en ningún lado.
let catalogo = {
  menu: [
    { id: "asado", label: "Asado", image: "/assets/menu/asado.jpg" },
    { id: "pollo-horno", label: "Pollo al horno", image: "/assets/menu/pollo-horno.jpg" },
    { id: "hamburguesas", label: "Hamburguesas", image: "/assets/menu/hamburguesas.jpg" },
    { id: "pastas", label: "Pastas", image: "/assets/menu/pastas.jpg" },
    { id: "pizza", label: "Pizza", image: "/assets/menu/pizza.jpg" },
    { id: "empanadas", label: "Empanadas", image: "/assets/menu/empanadas.jpg" },
    { id: "choripan", label: "Choripán", image: "/assets/menu/choripan.jpg" },
    { id: "milanesas", label: "Milanesas", image: "/assets/menu/milanesas.jpg" },
    { id: "ensaladas", label: "Ensaladas", image: "/assets/menu/ensaladas.jpg" },
    { id: "postres", label: "Postres", image: "/assets/menu/postres.jpg" },
  ],
  bebidas: [
    { id: "gaseosa", label: "Gaseosa", image: "/assets/bebidas/gaseosa.jpg" },
    { id: "agua", label: "Agua", image: "/assets/bebidas/agua.jpg" },
    { id: "jugo", label: "Jugo", image: "/assets/bebidas/jugo.jpg" },
    { id: "vino", label: "Vino", image: "/assets/bebidas/vino.jpg" },
    { id: "cerveza", label: "Cerveza", image: "/assets/bebidas/cerveza.jpg" },
  ],
};

function getCatalogo() {
  return catalogo;
}

function agregarItem(tipo, item) {
  const lista = catalogo[tipo];
  if (!lista) {
    const error = new Error(`Tipo de catálogo inválido: ${tipo}`);
    error.status = 400;
    throw error;
  }
  const yaExiste = lista.some((i) => i.id === item.id);
  if (yaExiste) {
    const error = new Error(`Ya existe un item con id "${item.id}" en ${tipo}`);
    error.status = 409;
    throw error;
  }
  lista.push(item);
  return item;
}

function actualizarItem(tipo, id, cambios) {
  const lista = catalogo[tipo];
  if (!lista) {
    const error = new Error(`Tipo de catálogo inválido: ${tipo}`);
    error.status = 400;
    throw error;
  }
  const item = lista.find((i) => i.id === id);
  if (!item) {
    const error = new Error(`No se encontró "${id}" en ${tipo}`);
    error.status = 404;
    throw error;
  }
  Object.assign(item, cambios);
  return item;
}

function eliminarItem(tipo, id) {
  const lista = catalogo[tipo];
  if (!lista) {
    const error = new Error(`Tipo de catálogo inválido: ${tipo}`);
    error.status = 400;
    throw error;
  }
  const index = lista.findIndex((i) => i.id === id);
  if (index === -1) {
    const error = new Error(`No se encontró "${id}" en ${tipo}`);
    error.status = 404;
    throw error;
  }
  const [eliminado] = lista.splice(index, 1);
  return eliminado;
}

module.exports = {
  getCatalogo,
  agregarItem,
  actualizarItem,
  eliminarItem,
};