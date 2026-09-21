const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "/api";

/**
 * Função auxiliar para realizar requisições.
 */
async function request(endpoint, options = {} ) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      "Ocorreu um erro na comunicação com o servidor.";

    throw new Error(message);
  }

  return data;
}

/**
 * Busca os dados da identidade visual.
 *
 * Endpoint esperado:
 * GET /api/branding
 */
async function getBranding() {
  return request("/branding");
}

/**
 * Busca todas as categorias.
 *
 * Endpoint esperado:
 * GET /api/categories
 */
async function getCategories() {
  return request("/categories");
}

/**
 * Busca os produtos.
 *
 * Pode usar:
 *
 * GET /api/products
 * GET /api/products?search=chocolate
 * GET /api/products?category=Entradas
 * GET /api/products?search=chocolate&category=Sobremesas
 */
async function getProducts({ search = "", category = "" } = {}) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (category && category !== "Todas") {
    params.set("category", category);
  }

  const queryString = params.toString();

  const endpoint = queryString
    ? `/products?${queryString}`
    : "/products";

  return request(endpoint);
}

/**
 * Envia um novo pedido para o backend.
 *
 * Endpoint esperado:
 * POST /api/orders
 */
async function createOrder(orderData) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(orderData)
  });
}

/**
 * Busca um pedido específico.
 *
 * Endpoint esperado:
 * GET /api/orders/:id
 */
async function getOrderById(orderId) {
  return request(`/orders/${orderId}`);
}

/**
 * Exporta as funções para o app.js.
 */
window.CardapioAPI = {
  getBranding,
  getCategories,
  getProducts,
  createOrder,
  getOrderById
};
