const calculosModel = require("../models/calculosModel");

function calcular(req, res) {
  const { adultos = 0, ninos = 0, menu = [], bebidas = [] } = req.body;

  if (!Array.isArray(bebidas) || bebidas.length === 0) {
    return res.status(400).json({ message: "Elegí al menos una bebida." });
  }
  if (!Array.isArray(menu)) {
    return res.status(400).json({ message: "El menú tiene que ser una lista." });
  }

  const adultosNum = Number(adultos) || 0;
  const ninosNum = Number(ninos) || 0;
  const personas = adultosNum + ninosNum;

  if (personas <= 0) {
    return res
      .status(400)
      .json({ message: "La cantidad de personas debe ser mayor a 0." });
  }

  const { resumen, consejo } = calculosModel.calcular({
    adultos: adultosNum,
    ninos: ninosNum,
    menu,
    bebidas,
  });

  return res.json({ personas, resumen, consejo, menu, bebidas });
}

module.exports = { calcular };
