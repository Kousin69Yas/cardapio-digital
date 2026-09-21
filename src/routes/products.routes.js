const express = require("express");

const { query } = require("../db");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET /api/products
|--------------------------------------------------------------------------
| Lista todos os produtos ativos.
|
| Exemplos:
|
| GET /api/products
| GET /api/products?search=chocolate
| GET /api/products?category=Entradas
| GET /api/products?search=chocolate&category=Sobremesas
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    const category = String(
      req.query.category || ""
    ).trim();

    let sql = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.category_id,
        c.name AS category,
        c.slug AS category_slug
      FROM products p
      INNER JOIN categories c
        ON c.id = p.category_id
      WHERE p.active = TRUE
    `;

    const params = [];

    if (search.length > 0) {
      sql += `
        AND (
          LOWER(p.name) LIKE LOWER(?)
          OR LOWER(p.description) LIKE LOWER(?)
        )
      `;

      const searchValue = `%${search}%`;

      params.push(searchValue);
      params.push(searchValue);
    }

    if (category.length > 0 && category !== "Todas") {
      sql += `
        AND (
          c.name = ?
          OR c.slug = ?
        )
      `;

      params.push(category);
      params.push(category);
    }

    sql += `
      ORDER BY c.id ASC, p.id ASC
    `;

    const products = await query(sql, params);

    return res.status(200).json(products);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);

    return res.status(500).json({
      message: "Não foi possível buscar os produtos."
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/products/:id
|--------------------------------------------------------------------------
| Busca um produto específico.
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        message: "ID de produto inválido."
      });
    }

    const sql = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.category_id,
        c.name AS category,
        c.slug AS category_slug
      FROM products p
      INNER JOIN categories c
        ON c.id = p.category_id
      WHERE p.id = ?
        AND p.active = TRUE
      LIMIT 1
    `;

    const products = await query(sql, [productId]);

    if (products.length === 0) {
      return res.status(404).json({
        message: "Produto não encontrado."
      });
    }

    return res.status(200).json(products[0]);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);

    return res.status(500).json({
      message: "Não foi possível buscar o produto."
    });
  }
});

module.exports = router;
