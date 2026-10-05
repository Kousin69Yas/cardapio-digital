const express = require("express");

const {
  query,
  getConnection
} = require("../db");

const router = express.Router();

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function centsToReais(cents) {
  return roundMoney(Number(cents || 0) / 100);
}

async function ensureOrderItemsTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS itens_pedido (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      pedido_id INT NOT NULL,
      produto_id BIGINT UNSIGNED NOT NULL,
      nome_produto VARCHAR(255) NOT NULL,
      preco_unitario DOUBLE NOT NULL,
      quantidade INT NOT NULL,
      total_item DOUBLE NOT NULL,
      criado_em DATE NOT NULL DEFAULT (CURRENT_DATE),
      INDEX idx_itens_pedido_pedido (pedido_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

router.post("/", async (req, res) => {
  let connection;

  try {
    const {
      customer_name,
      table_number,
      waiter_fee_selected,
      items
    } = req.body || {};

    const customerName = String(customer_name || "").trim();
    const tableNumber = Number(table_number);
    const waiterFeeSelected = Boolean(waiter_fee_selected);

    if (customerName.length < 2) {
      return res.status(400).json({
        message: "Informe o nome do cliente."
      });
    }

    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
      return res.status(400).json({
        message: "Informe um número de mesa válido."
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Adicione pelo menos um produto ao pedido."
      });
    }

    const normalizedItems = items.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity)
    }));

    const hasInvalidItem = normalizedItems.some((item) => (
      !Number.isInteger(item.product_id) ||
      item.product_id <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      item.quantity > 50
    ));

    if (hasInvalidItem) {
      return res.status(400).json({
        message: "Existe um produto ou quantidade inválida."
      });
    }

    const uniqueProductIds = [
      ...new Set(normalizedItems.map((item) => item.product_id))
    ];

    connection = await getConnection();
    await connection.beginTransaction();

    await ensureOrderItemsTable(connection);

    const placeholders = uniqueProductIds.map(() => "?").join(", ");

    const [products] = await connection.execute(
      `
        SELECT
          id,
          nome,
          descricao,
          preco
        FROM produtos
        WHERE id IN (${placeholders})
      `,
      uniqueProductIds
    );

    if (products.length !== uniqueProductIds.length) {
      await connection.rollback();
      return res.status(400).json({
        message: "Um ou mais produtos não estão disponíveis."
      });
    }

    const productsById = new Map(
      products.map((product) => [Number(product.id), product])
    );

    const orderItems = normalizedItems.map((item) => {
      const product = productsById.get(item.product_id);
      const unitPriceCents = Number(product.preco || 0);
      const itemTotalCents = unitPriceCents * item.quantity;

      return {
        product_id: Number(product.id),
        product_name_snapshot: product.nome,
        unit_price_cents: unitPriceCents,
        quantity: item.quantity,
        item_total_cents: itemTotalCents
      };
    });

    const subtotalCents = orderItems.reduce(
      (total, item) => total + item.item_total_cents,
      0
    );

    const waiterFeeCents = waiterFeeSelected
      ? Math.round(subtotalCents * 0.1)
      : 0;

    const totalCents = subtotalCents + waiterFeeCents;

    const [orderResult] = await connection.execute(
      `
        INSERT INTO pedidos (
          cliente,
          mesa,
          subtotal,
          taxa_garcom,
          total,
          criado_em
        )
        VALUES (?, ?, ?, ?, ?, CURRENT_DATE())
      `,
      [
        customerName,
        tableNumber,
        centsToReais(subtotalCents),
        centsToReais(waiterFeeCents),
        centsToReais(totalCents)
      ]
    );

    const orderId = Number(orderResult.insertId);

    for (const item of orderItems) {
      await connection.execute(
        `
          INSERT INTO itens_pedido (
            pedido_id,
            produto_id,
            nome_produto,
            preco_unitario,
            quantidade,
            total_item
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.product_id,
          item.product_name_snapshot,
          centsToReais(item.unit_price_cents),
          item.quantity,
          centsToReais(item.item_total_cents)
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      id: orderId,
      customer_name: customerName,
      table_number: tableNumber,
      waiter_fee_selected: waiterFeeSelected,
      subtotal: subtotalCents,
      waiter_fee: waiterFeeCents,
      total: totalCents,
      items: orderItems.map((item) => ({
        name: item.product_name_snapshot,
        quantity: item.quantity,
        item_total: item.item_total_cents
      }))
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Erro ao desfazer pedido:", rollbackError);
      }
    }

    console.error("Erro ao criar pedido:", error);

    return res.status(500).json({
      message: "Não foi possível finalizar o pedido."
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.get("/:id", async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        message: "ID de pedido inválido."
      });
    }

    const orders = await query(
      `
        SELECT
          id,
          cliente,
          mesa,
          subtotal,
          taxa_garcom,
          total,
          criado_em
        FROM pedidos
        WHERE id = ?
        LIMIT 1
      `,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        message: "Pedido não encontrado."
      });
    }

    const items = await query(
      `
        SELECT
          id,
          pedido_id,
          produto_id,
          nome_produto,
          preco_unitario,
          quantidade,
          total_item
        FROM itens_pedido
        WHERE pedido_id = ?
        ORDER BY id
      `,
      [orderId]
    );

    const order = orders[0];

    return res.status(200).json({
      id: Number(order.id),
      customer_name: order.cliente,
      table_number: Number(order.mesa),
      subtotal: Math.round(Number(order.subtotal || 0) * 100),
      waiter_fee: Math.round(Number(order.taxa_garcom || 0) * 100),
      total: Math.round(Number(order.total || 0) * 100),
      created_at: order.criado_em,
      items: items.map((item) => ({
        id: Number(item.id),
        product_id: Number(item.produto_id),
        name: item.nome_produto,
        quantity: Number(item.quantidade),
        unit_price: Math.round(Number(item.preco_unitario || 0) * 100),
        item_total: Math.round(Number(item.total_item || 0) * 100)
      }))
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);

    return res.status(500).json({
      message: "Não foi possível buscar o pedido."
    });
  }
});

module.exports = router;
