const express = require("express");

const { query } = require("../db");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET /api/products
|--------------------------------------------------------------------------
| Lista os produtos da tabela produtos.
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();

    let sql = `
      SELECT
        id,
        nome,
        descricao,
        preco,
        categoria_id
      FROM produtos
      WHERE 1 = 1
    `;

    const params = [];

    if (search.length > 0) {
      sql += `
        AND (
          LOWER(nome) LIKE LOWER(?)
          OR LOWER(descricao) LIKE LOWER(?)
        )
      `;

      const searchValue = `%${search}%`;

      params.push(searchValue, searchValue);
    }

    /*
     * O banco possui categoria_id.
     * Por enquanto, o filtro por categoria usa o ID numérico.
     * Exemplo: /api/products?category=1
     */
    if (category.length > 0 && category !== "Todas") {
      const categoryId = Number(category);

      if (Number.isInteger(categoryId) && categoryId > 0) {
        sql += `
          AND categoria_id = ?
        `;

        params.push(categoryId);
      }
    }

    sql += `
      ORDER BY categoria_id ASC, id ASC
    `;

    const rows = await query(sql, params);

    const products = rows.map((row) => ({
      id: Number(row.id),
      name: row.nome,
      description: row.descricao || "",
      price: Number(row.preco || 0),
      image_url: null,
      category_id: Number(row.categoria_id)
    }));

    return res.status(200).json(products);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);

    return res.status(500).json({
      message: "Não foi possível buscar os produtos.",
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/products/:id
|--------------------------------------------------------------------------
| Busca um produto específico pelo ID.
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

    const rows = await query(
      `
        SELECT
          id,
          nome,
          descricao,
          preco,
          categoria_id
        FROM produtos
        WHERE id = ?
        LIMIT 1
      `,
      [productId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Produto não encontrado."
      });
    }

    const row = rows[0];

    const product = {
      id: Number(row.id),
      name: row.nome,
      description: row.descricao || "",
      price: Number(row.preco || 0),
      image_url: null,
      category_id: Number(row.categoria_id)
    };

    return res.status(200).json(product);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);

    return res.status(500).json({
      message: "Não foi possível buscar o produto.",
      error: error.message
    });
  }
});

module.exports = router;
