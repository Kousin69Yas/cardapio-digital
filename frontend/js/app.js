document.addEventListener("DOMContentLoaded", () => {
  iniciarAplicacao();
});

const state = window.CardapioState;
const api = window.CardapioAPI;

const elements = {
  brandingLogo: document.querySelector(".brand-logo"),

  brandingName: document.querySelector(".brand-text strong"),

  brandingFooterName: document.querySelector(".site-footer strong"),

  brandingSlogan: document.querySelector(".hero-copy p"),

  searchInput: document.querySelector("#search-input"),

  categoryMenu: document.querySelector("#category-menu"),

  productsGrid: document.querySelector("#products-grid"),

  productsLoading: document.querySelector("#products-loading"),

  productsEmpty: document.querySelector("#products-empty"),

  cartCounter: document.querySelector("#cart-counter"),

  orderItems: document.querySelector("#order-items"),

  emptyOrderMessage: document.querySelector("#empty-order-message"),

  customerName: document.querySelector("#customer-name"),

  tableNumber: document.querySelector("#table-number"),

  waiterFeeCheckbox: document.querySelector(
    "#waiter-fee-checkbox"
  ),

  waiterFeeValue: document.querySelector(
    "#waiter-fee-value"
  ),

  subtotalValue: document.querySelector(
    "#subtotal-value"
  ),

  waiterFeeTotal: document.querySelector(
    "#waiter-fee-total"
  ),

  totalValue: document.querySelector(
    "#total-value"
  ),

  finalizeOrderButton: document.querySelector(
    "#finalize-order-button"
  ),

  openOrderButton: document.querySelector(
    "#open-order-button"
  ),

  closeOrderButton: document.querySelector(
    "#close-order-button"
  ),

  goToMenuButton: document.querySelector(
    "#go-to-menu-button"
  ),

  confirmationModal: document.querySelector(
    "#confirmation-modal"
  ),

  confirmationMessage: document.querySelector(
    "#confirmation-message"
  ),

  confirmationItems: document.querySelector(
    "#confirmation-items"
  ),

  confirmationSubtotal: document.querySelector(
    "#confirmation-subtotal"
  ),

  confirmationWaiterFee: document.querySelector(
    "#confirmation-waiter-fee"
  ),

  confirmationTotal: document.querySelector(
    "#confirmation-total"
  ),

  closeModalButton: document.querySelector(
    "#close-modal-button"
  ),

  continueButton: document.querySelector(
    "#continue-button"
  ),

  orderPanel: document.querySelector(
    "#order-panel"
  )
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function iniciarAplicacao() {
  configurarEventos();

  try {
    await carregarDados();

    renderizarBranding();

    renderizarCategorias();

    renderizarProdutos();

    renderizarCarrinho();
  } catch (error) {
    console.error(error);

    mostrarErro(
      "Não foi possível carregar o cardápio. Verifique se o backend está funcionando."
    );
  }
}

async function carregarDados() {
  elements.productsLoading.classList.remove("hidden");

  const [branding, categories, products] =
    await Promise.all([
      api.getBranding(),
      api.getCategories(),
      api.getProducts()
    ]);

  state.setBranding(branding);
  state.setCategories(categories);
  state.setProducts(products);

  elements.productsLoading.classList.add("hidden");
}

function renderizarBranding() {
  const branding = state.branding;

  if (elements.brandingLogo) {
    elements.brandingLogo.src = branding.logo_url;
  }

  if (elements.brandingName) {
    elements.brandingName.textContent =
      branding.restaurant_name;
  }

  if (elements.brandingFooterName) {
    elements.brandingFooterName.textContent =
      branding.restaurant_name;
  }

  if (elements.brandingSlogan) {
    elements.brandingSlogan.textContent =
      "Sabores que acolhem, ingredientes que contam histórias e uma mesa preparada para o seu melhor momento.";
  }

  document.title =
    `${branding.restaurant_name} — Cardápio Digital`;
}

function renderizarCategorias() {
  if (!elements.categoryMenu) {
    return;
  }

  const categories = state.categories || [];

  elements.categoryMenu.innerHTML = `
    <button
      type="button"
      class="category-button active"
      data-category="Todas"
    >
      Todas
    </button>
  `;

  categories.forEach((category) => {
    const categoryName =
      category.name || category.category_name;

    const button = document.createElement("button");

    button.type = "button";

    button.className = "category-button";

    button.dataset.category = categoryName;

    button.textContent = categoryName;

    elements.categoryMenu.appendChild(button);
  });
}

function renderizarProdutos() {
  const products = state.filteredProducts || [];

  if (!elements.productsGrid) {
    return;
  }

  if (products.length === 0) {
    elements.productsGrid.innerHTML = "";

    elements.productsEmpty.classList.remove("hidden");

    return;
  }

  elements.productsEmpty.classList.add("hidden");

  elements.productsGrid.innerHTML = products
    .map((product, index) => {
      return `
        <article
          class="product-card"
          style="animation-delay: ${Math.min(index, 10) * 30}ms"
        >
          <div class="product-image-wrapper">
            <img
              src="${escapeHtml(product.image_url)}"
              alt="${escapeHtml(product.name)}"
              class="product-image"
              loading="lazy"
            >

            <span class="product-category">
              ${escapeHtml(product.category)}
            </span>
          </div>

          <div class="product-content">
            <h3>
              ${escapeHtml(product.name)}
            </h3>

            <p>
              ${escapeHtml(product.description)}
            </p>

            <div class="product-footer">
              <strong>
                ${formatCurrency(product.price)}
              </strong>

              <button
                type="button"
                class="add-product-button"
                data-product-id="${product.id}"
              >
                + Adicionar
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderizarCarrinho() {
  const cartItems = state.getCartItems();

  elements.cartCounter.textContent =
    state.getItemCount();

  const subtotal = state.getSubtotal();

  const waiterFee = state.getWaiterFee();

  const total = state.getTotal();

  elements.subtotalValue.textContent =
    formatCurrency(subtotal);

  elements.waiterFeeValue.textContent =
    formatCurrency(waiterFee);

  elements.waiterFeeTotal.textContent =
    formatCurrency(waiterFee);

  elements.totalValue.textContent =
    formatCurrency(total);

  elements.finalizeOrderButton.disabled =
    cartItems.length === 0;

  if (cartItems.length === 0) {
    elements.emptyOrderMessage.classList.remove("hidden");

    elements.orderItems
      .querySelectorAll(".order-item")
      .forEach((element) => element.remove());

    return;
  }

  elements.emptyOrderMessage.classList.add("hidden");

  const html = cartItems
    .map((item) => {
      const product = item.product;
      const quantity = item.quantity;
      const itemTotal = product.price * quantity;

      return `
        <div class="order-item">
          <img
            src="${escapeHtml(product.image_url)}"
            alt=""
            class="order-item-image"
          >

          <div class="order-item-content">
            <strong>
              ${escapeHtml(product.name)}
            </strong>

            <span>
              ${formatCurrency(product.price)} cada
            </span>

            <div class="order-item-footer">
              <div class="quantity-controls">
                <button
                  type="button"
                  class="quantity-button"
                  data-action="decrease"
                  data-product-id="${product.id}"
                >
                  −
                </button>

                <strong>${quantity}</strong>

                <button
                  type="button"
                  class="quantity-button"
                  data-action="increase"
                  data-product-id="${product.id}"
                >
                  +
                </button>
              </div>

              <strong>
                ${formatCurrency(itemTotal)}
              </strong>
            </div>

            <button
              type="button"
              class="remove-product-button"
              data-action="remove"
              data-product-id="${product.id}"
            >
              Remover
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  elements.orderItems.innerHTML =
    `${html}<div id="empty-order-message" class="hidden"></div>`;
}

function aplicarFiltros() {
  const search = state.search.trim().toLowerCase();

  const category = state.selectedCategory;

  state.filteredProducts = state.products.filter(
    (product) => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search);

      const matchesCategory =
        category === "Todas" ||
        product.category === category;

      return matchesSearch && matchesCategory;
    }
  );

  renderizarProdutos();
}

function configurarEventos() {
  elements.searchInput.addEventListener(
    "input",
    (event) => {
      state.setSearch(event.target.value);

      aplicarFiltros();
    }
  );

  elements.categoryMenu.addEventListener(
    "click",
    (event) => {
      const button =
        event.target.closest(".category-button");

      if (!button) {
        return;
      }

      const category = button.dataset.category;

      state.setSelectedCategory(category);

      document
        .querySelectorAll(".category-button")
        .forEach((item) => {
          item.classList.toggle(
            "active",
            item.dataset.category === category
          );
        });

      aplicarFiltros();
    }
  );

  elements.productsGrid.addEventListener(
    "click",
    (event) => {
      const button =
        event.target.closest(".add-product-button");

      if (!button) {
        return;
      }

      const productId = Number(
        button.dataset.productId
      );

      state.addProduct(productId);

      renderizarCarrinho();

      abrirPainelPedido();
    }
  );

  elements.orderItems.addEventListener(
    "click",
    (event) => {
      const button =
        event.target.closest("[data-action]");

      if (!button) {
        return;
      }

      const action = button.dataset.action;

      const productId = Number(
        button.dataset.productId
      );

      if (action === "increase") {
        state.increaseProduct(productId);
      }

      if (action === "decrease") {
        state.decreaseProduct(productId);
      }

      if (action === "remove") {
        state.removeProduct(productId);
      }

      renderizarCarrinho();
    }
  );

  elements.waiterFeeCheckbox.addEventListener(
    "change",
    (event) => {
      state.setWaiterFeeSelected(
        event.target.checked
      );

      renderizarCarrinho();
    }
  );

  elements.finalizeOrderButton.addEventListener(
    "click",
    finalizarPedido
  );

  elements.openOrderButton.addEventListener(
    "click",
    abrirPainelPedido
  );

  elements.closeOrderButton.addEventListener(
    "click",
    fecharPainelPedido
  );

  elements.goToMenuButton.addEventListener(
    "click",
    () => {
      document
        .querySelector("#menu")
        .scrollIntoView({
          behavior: "smooth"
        });
    }
  );

  elements.closeModalButton.addEventListener(
    "click",
    fecharModal
  );

  elements.continueButton.addEventListener(
    "click",
    fecharModal
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        fecharModal();
        fecharPainelPedido();
      }
    }
  );
}

async function finalizarPedido() {
  const customerName =
    elements.customerName.value.trim();

  const tableNumber =
    Number(elements.tableNumber.value);

  if (!customerName) {
    alert("Digite o nome do cliente.");

    elements.customerName.focus();

    return;
  }

  if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
    alert("Digite um número de mesa válido.");

    elements.tableNumber.focus();

    return;
  }

  if (state.getCartItems().length === 0) {
    alert("Adicione pelo menos um produto.");

    return;
  }

  const orderData = state.getOrderPayload(
    customerName,
    tableNumber
  );

  elements.finalizeOrderButton.disabled = true;

  elements.finalizeOrderButton.textContent =
    "Enviando pedido...";

  try {
    const result =
      await api.createOrder(orderData);

    mostrarConfirmacao(result);

    state.clearCart();

    elements.customerName.value = "";

    elements.tableNumber.value = "";

    elements.waiterFeeCheckbox.checked = false;

    renderizarCarrinho();

    fecharPainelPedido();
  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "Não foi possível finalizar o pedido."
    );
  } finally {
    elements.finalizeOrderButton.textContent =
      "FINALIZAR PEDIDO";

    elements.finalizeOrderButton.disabled =
      state.getCartItems().length === 0;
  }
}

function mostrarConfirmacao(order) {
  const orderId =
    order.id || order.order_id || "";

  const customerName =
    order.customer_name ||
    order.customerName ||
    "cliente";

  const tableNumber =
    order.table_number ||
    order.tableNumber ||
    "";

  const items =
    order.items ||
    order.order_items ||
    [];

  const subtotal =
    Number(order.subtotal || 0);

  const waiterFee =
    Number(
      order.waiter_fee ||
      order.waiterFee ||
      0
    );

  const total =
    Number(order.total || 0);

  elements.confirmationMessage.textContent =
    `Pedido #${String(orderId).padStart(4, "0")} — Mesa ${tableNumber} — ${customerName}`;

  elements.confirmationItems.innerHTML =
    items.map((item) => {
      const name =
        item.name ||
        item.product_name_snapshot ||
        item.productNameSnapshot;

      const quantity =
        Number(item.quantity || 0);

      const itemTotal =
        Number(
          item.item_total ||
          item.itemTotal ||
          0
        );

      return `
        <div class="confirmation-item">
          <span>
            <strong>${quantity}×</strong>
            ${escapeHtml(name)}
          </span>

          <strong>
            ${formatCurrency(itemTotal)}
          </strong>
        </div>
      `;
    }).join("");

  elements.confirmationSubtotal.textContent =
    formatCurrency(subtotal);

  elements.confirmationWaiterFee.textContent =
    formatCurrency(waiterFee);

  elements.confirmationTotal.textContent =
    formatCurrency(total);

  elements.confirmationModal.classList.remove(
    "hidden"
  );
}

function fecharModal() {
  elements.confirmationModal.classList.add(
    "hidden"
  );
}

function abrirPainelPedido() {
  elements.orderPanel.classList.add(
    "order-panel-open"
  );
}

function fecharPainelPedido() {
  elements.orderPanel.classList.remove(
    "order-panel-open"
  );
}

function mostrarErro(message) {
  elements.productsLoading.classList.add("hidden");

  elements.productsEmpty.classList.remove("hidden");

  elements.productsEmpty.textContent = message;
}
