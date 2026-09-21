const express = require("express");

const {
  query,
  getConnection
} = require("../db");

const router = express.Router();

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/*
|--------------------------------------------------------------------------
| POST /api/orders
|--------------------------------------------------------------------------
| Cria um novo pedido.
|--------------------------------------------------------------------------
|
| Formato esperado:
|
| {
|   "customer_name": "Maria Silva",
|   "table_number": 12,
|   "waiter_fee_selected": true,
|   "items": [
|     {
|       "product_id": 1,
|       "quantity": 2
|     }
|   ]
| }
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  let connection;

  try {
    const {
      customer_name,
      table_number,
      waiter_fee_selected,
      items
    } = req.body;

    const customerName = String(
      customer_name || ""
    ).trim();

    const tableNumber = Number(table_number);

    const waiterFeeSelected =
      Boolean(waiter_fee_selected);

    if (customerName.length < 2) {
      return res.status(400).json({
        message: "Informe o nome do cliente."
      });
    }

    if (customerName.length > 140) {
      return res.status(400).json({
        message: "O nome do cliente é muito grande."
      });
    }

    if (
      !Number.isInteger(tableNumber) ||
      tableNumber <= 0
    ) {
      return res.status(400).json({
        message: "Informe um número de mesa válido."
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Adicione pelo menos um produto ao pedido."
      });
    }

    const normalizedItems = items.map((item) => {
      return {
        product_id: Number(item.product_id),
        quantity: Number(item.quantity)
      };
    });

    const hasInvalidItem = normalizedItems.some(
      (item) => {
        return (
          !Number.isInteger(item.product_id) ||
          item.product_id <= 0 ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0 ||
          item.quantity > 50
        );
      }
    );

    if (hasInvalidItem) {
      return res.status(400).json({
        message: "Existe um produto ou quantidade inválida."
      });
    }

    const uniqueProductIds = [
      ...new Set(
        normalizedItems.map(
          (item) => item.product_id
        )
      )
    ];

    connection = await getConnection();

    await connection.beginTransaction();

    const placeholders = uniqueProductIds
      .map(() => "?")
      .join(", ");

    const productSql = `
      SELECT
        id,
        name,
        price,
        image_url
      FROM products
      WHERE active = TRUE
        AND id IN (${placeholders})
    `;

    const [products] = await connection.execute(
      productSql,
      uniqueProductIds
    );

    if (products.length !== uniqueProductIds.length) {
      await connection.rollback();

      return res.status(400).json({
        message:
          "Um ou mais produtos não estão disponíveis."
      });
    }

    const productsById = new Map(
      products.map((product) => [
        Number(product.id),
        product
      ])
    );

    const orderItems = normalizedItems.map(
      (item) => {
        const product = productsById.get(
          item.product_id
        );

        const unitPrice = Number(product.price);

        const itemTotal = roundMoney(
          unitPrice * item.quantity
        );

        return {
          product_id: Number(product.id),
          product_name_snapshot: product.name,
          unit_price: unitPrice,
          quantity: item.quantity,
          item_total: itemTotal,
          image_url: product.image_url
        };
      }
    );

    const subtotal = roundMoney(
      orderItems.reduce(
        (total, item) => total + item.item_total,
        0
      )
    );

    const waiterFee = waiterFeeSelected
      ? roundMoney(subtotal * 0.1)
      : 0;

    const total = roundMoney(
      subtotal + waiterFee
    );

    const insertOrderSql = `
      INSERT INTO orders (
        customer_name,
        table_number,
        waiter_fee_selected,
        subtotal,
        waiter_fee,
        total,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'finished')
    `;

    const [orderResult] =
      await connection.execute(
        insertOrderSql,
        [
          customerName,
          tableNumber,
          waiterFeeSelected,
          subtotal.toFixed(2),
          waiterFee.toFixed(2),
          total.toFixed(2)
        ]
      );

    const orderId = Number(
      orderResult.insertId
    );

    const insertItemSql = `
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name_snapshot,
        unit_price,
        quantity,
        item_total
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const item of orderItems) {
      await connection.execute(
        insertItemSql,
        [
          orderId,
          item.product_id,
          item.product_name_snapshot,
          item.unit_price.toFixed(2),
          item.quantity,
          item.item_total.toFixed(2)
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      id: orderId,
      customer_name: customerName,
      table_number: tableNumber,
      waiter_fee_selected: waiterFeeSelected,
      subtotal,
      waiter_fee: waiterFee,
      total,
      items: orderItems
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
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

/*
|--------------------------------------------------------------------------
| GET /api/orders/:id
|--------------------------------------------------------------------------
| Busca um pedido e seus itens.
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        message: "ID de pedido inválido."
      });
    }

    const orderSql = `
      SELECT
        id,
        customer_name,
        table_number,
        waiter_fee_selected,
        subtotal,
        waiter_fee,
        total,
        status,
        created_at
      FROM orders
      WHERE id = ?
      LIMIT 1
    `;

    const orders = await query(orderSql, [
      orderId
    ]);

    if (orders.length === 0) {
      return res.status(404).json({
        message: "Pedido não encontrado."
      });
    }

    const itemsSql = `
      SELECT
        id,
        order_id,
        product_id,
        product_name_snapshot,
        unit_price,
        quantity,
        item_total
      FROM order_items
      WHERE order_id = ?
      ORDER BY id
    `;

    const items = await query(itemsSql, [
      orderId
    ]);

    return res.status(200).json({
      ...orders[0],
      items
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);

    return res.status(500).json({
      message: "Não foi possível buscar o pedido."
    });
  }
});

module.exports = router;
