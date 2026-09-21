const express = require("express");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET /api/branding
|--------------------------------------------------------------------------
| Retorna a identidade visual do restaurante.
|
| Como o banco antigo não possui a tabela restaurant_branding,
| estes dados ficam definidos nesta rota.
|--------------------------------------------------------------------------
*/

router.get("/", (req, res) => {
  return res.status(200).json({
    restaurant_name: "Sabor & Mesa",

    slogan: "Seu momento começa no primeiro sabor.",

    logo_url: "/assets/logo.png"
  });
});

module.exports = router;
