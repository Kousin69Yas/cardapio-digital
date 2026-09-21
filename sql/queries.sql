USE cardapio_digital;

-- Quantidade de produtos por categoria.
SELECT c.id, c.name AS category, COUNT(p.id) AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
GROUP BY c.id, c.name
ORDER BY c.id;

-- Total geral de produtos.
SELECT COUNT(*) AS total_products
FROM products
WHERE active = TRUE;

-- Lista de produtos com categoria.
SELECT
  p.id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  c.name AS category,
  c.id AS category_id
FROM products p
INNER JOIN categories c ON c.id = p.category_id
WHERE p.active = TRUE
ORDER BY c.id, p.id;

-- Pesquisa por nome.
SELECT
  p.id, p.name, p.description, p.price, p.image_url,
  c.name AS category, c.id AS category_id
FROM products p
INNER JOIN categories c ON c.id = p.category_id
WHERE p.active = TRUE
  AND LOWER(p.name) LIKE LOWER(CONCAT('%', ?, '%'))
ORDER BY p.name;

-- Filtro por categoria.
SELECT
  p.id, p.name, p.description, p.price, p.image_url,
  c.name AS category, c.id AS category_id
FROM products p
INNER JOIN categories c ON c.id = p.category_id
WHERE p.active = TRUE
  AND c.name = ?
ORDER BY p.name;

-- Identidade visual.
SELECT restaurant_name, slogan, logo_url
FROM restaurant_branding
ORDER BY id
LIMIT 1;

-- Resumo de um pedido.
SELECT
  o.id,
  o.customer_name,
  o.table_number,
  o.waiter_fee_selected,
  o.subtotal,
  o.waiter_fee,
  o.total,
  o.status,
  o.created_at
FROM orders o
WHERE o.id = ?;

-- Itens de um pedido.
SELECT
  oi.product_id,
  oi.product_name_snapshot,
  oi.unit_price,
  oi.quantity,
  oi.item_total
FROM order_items oi
WHERE oi.order_id = ?
ORDER BY oi.id;

-- Últimos pedidos do restaurante.
SELECT id, customer_name, table_number, subtotal, waiter_fee, total, status, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 50;
