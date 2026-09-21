const express = require("express");

const { query } = require("../db");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET /api/branding
|--------------------------------------------------------------------------
| Retorna os dados da identidade visual do restaurante.
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT
        id,
        restaurant_name,
        slogan,
        logo_url
      FROM restaurant_branding
      ORDER BY id
      LIMIT 1
    `;

    const rows = await query(sql);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Dados da identidade visual não encontrados."
      });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar branding:", error);

    return res.status(500).json({
      message: "Não foi possível buscar a identidade visual."
    });
  }
});

module.exports = router;
