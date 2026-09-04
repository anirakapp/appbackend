// models/negociosModel.js
let negocios = [
  {
    id: "carniceria-don-jose",
    nombre: "Carnicería Don José",
    categoria: "Carnicería",
    imagen: "/assets/negocios/carniceria.jpg",
    rating: 4.8,
    reviews: 120,
    distanciaKm: 1.2,
    badge: "10% OFF en asados",
    auspiciado: true,
    ciudad: "Rosario",
  },
  {
    id: "distribuidora-el-sol",
    nombre: "Distribuidora El Sol",
    categoria: "Bebidas",
    imagen: "/assets/negocios/bebidas.jpg",
    rating: 4.6,
    reviews: 98,
    distanciaKm: 1.5,
    badge: "Envíos gratis desde $15.000",
    auspiciado: true,
    ciudad: "Rosario",
  },
  {
    id: "panaderia-la-abuela",
    nombre: "Panadería La Abuela",
    categoria: "Panadería",
    imagen: "/assets/negocios/panaderia.jpg",
    rating: 4.7,
    reviews: 75,
    distanciaKm: 0.9,
    badge: "Pan para eventos",
    auspiciado: true,
    ciudad: "Rosario",
  },
  {
    id: "hielo-polar",
    nombre: "Hielo Polar",
    categoria: "Hielo",
    imagen: "/assets/negocios/hielo.jpg",
    rating: 4.9,
    reviews: 60,
    distanciaKm: 1.1,
    badge: "Bolsón 10kg $1.200",
    auspiciado: true,
    ciudad: "Rosario",
  },
];

function getAll() {
  return negocios;
}

function getByCiudad(ciudad) {
  if (!ciudad) return negocios;
  return negocios.filter(
    (n) => n.ciudad.toLowerCase() === String(ciudad).toLowerCase()
  );
}

function getById(id) {
  return negocios.find((n) => n.id === id) || null;
}

function create(data) {
  const nuevo = { id: data.id || `negocio-${Date.now()}`, ...data };
  negocios.push(nuevo);
  return nuevo;
}

function update(id, cambios) {
  const negocio = getById(id);
  if (!negocio) {
    const error = new Error(`No se encontró el negocio "${id}"`);
    error.status = 404;
    throw error;
  }
  Object.assign(negocio, cambios);
  return negocio;
}

function remove(id) {
  const index = negocios.findIndex((n) => n.id === id);
  if (index === -1) {
    const error = new Error(`No se encontró el negocio "${id}"`);
    error.status = 404;
    throw error;
  }
  const [eliminado] = negocios.splice(index, 1);
  return eliminado;
}

module.exports = {
  getAll,
  getByCiudad,
  getById,
  create,
  update,
  remove,
};