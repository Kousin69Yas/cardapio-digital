const express = require("express");
const { query } = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        id,
        nome
      FROM categorias
      ORDER BY id
    `);

    const categories = rows.map((row) => ({
      id: Number(row.id),
      name: row.nome,
      slug: String(row.nome)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    }));

    return res.status(200).json(categories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);

    return res.status(500).json({
      message: "Não foi possível buscar as categorias.",
      error: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID de categoria inválido."
      });
    }

    const rows = await query(
      `
        SELECT
          id,
          nome
        FROM categorias
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Categoria não encontrada."
      });
    }

    return res.status(200).json({
      id: Number(rows[0].id),
      name: rows[0].nome,
      slug: String(rows[0].nome)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    });
  } catch (error) {
    console.error("Erro ao buscar categoria:", error);

    return res.status(500).json({
      message: "Não foi possível buscar a categoria.",
      error: error.message
    });
  }
});

module.exports = router;

