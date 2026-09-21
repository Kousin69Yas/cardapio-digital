const express = require("express");

const { query } = require("../db");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET /api/categories
|--------------------------------------------------------------------------
| Retorna todas as categorias cadastradas.
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT
        id,
        name,
        slug
      FROM categories
      ORDER BY id
    `;

    const categories = await query(sql);

    return res.status(200).json(categories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);

    return res.status(500).json({
      message: "Não foi possível buscar as categorias."
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/categories/:id
|--------------------------------------------------------------------------
| Retorna uma categoria específica.
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        message: "ID de categoria inválido."
      });
    }

    const sql = `
      SELECT
        id,
        name,
        slug
      FROM categories
      WHERE id = ?
      LIMIT 1
    `;

    const categories = await query(sql, [categoryId]);

    if (categories.length === 0) {
      return res.status(404).json({
        message: "Categoria não encontrada."
      });
    }

    return res.status(200).json(categories[0]);
  } catch (error) {
    console.error("Erro ao buscar categoria:", error);

    return res.status(500).json({
      message: "Não foi possível buscar a categoria."
    });
  }
});

module.exports = router;
