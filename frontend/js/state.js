const CardapioState = {
  branding: {
    restaurant_name: "Sabor & Mesa",
    slogan: "Seu momento começa no primeiro sabor.",
    logo_url: "./assets/logo.png"
  },

  categories: [],

  products: [],

  filteredProducts: [],

  selectedCategory: "Todas",

  search: "",

  cart: {},

  waiterFeeSelected: false,

  setBranding(branding) {
    this.branding = {
      restaurant_name:
        branding.restaurant_name ||
        branding.restaurantName ||
        "Sabor & Mesa",

      slogan:
        branding.slogan ||
        "Seu momento começa no primeiro sabor.",

      logo_url:
        branding.logo_url ||
        branding.logoUrl ||
        "./assets/logo.png"
    };
  },

  setCategories(categories) {
    this.categories = categories || [];
  },

  setProducts(products) {
    this.products = (products || []).map((product) => {
      return {
        id: Number(product.id),

        name: product.name,

        description: product.description,

        price: Number(product.price),

        category:
          product.category ||
          product.category_name ||
          "",

        category_id:
          Number(
            product.category_id ||
            product.categoryId ||
            0
          ),

        image_url:
          product.image_url ||
          product.imageUrl ||
          "./assets/logo.png"
      };
    });

    this.filteredProducts = [...this.products];
  },

  setSearch(search) {
    this.search = search;
  },

  setSelectedCategory(category) {
    this.selectedCategory = category;
  },

  setWaiterFeeSelected(value) {
    this.waiterFeeSelected = Boolean(value);
  },

  addProduct(productId) {
    const id = Number(productId);

    if (!this.cart[id]) {
      this.cart[id] = 0;
    }

    this.cart[id] += 1;
  },

  increaseProduct(productId) {
    const id = Number(productId);

    if (!this.cart[id]) {
      this.cart[id] = 0;
    }

    this.cart[id] += 1;
  },

  decreaseProduct(productId) {
    const id = Number(productId);

    if (!this.cart[id]) {
      return;
    }

    this.cart[id] -= 1;

    if (this.cart[id] <= 0) {
      delete this.cart[id];
    }
  },

  removeProduct(productId) {
    const id = Number(productId);

    delete this.cart[id];
  },

  clearCart() {
    this.cart = {};
    this.waiterFeeSelected = false;
  },

  getCartItems() {
    return Object.entries(this.cart)
      .map(([productId, quantity]) => {
        const product = this.products.find(
          (item) => item.id === Number(productId)
        );

        if (!product) {
          return null;
        }

        return {
          product,
          quantity: Number(quantity)
        };
      })
      .filter(Boolean);
  },

  getItemCount() {
    return Object.values(this.cart).reduce(
      (total, quantity) => total + Number(quantity),
      0
    );
  },

  getSubtotal() {
    return this.getCartItems().reduce(
      (total, item) => {
        return total + item.product.price * item.quantity;
      },
      0
    );
  },

  getWaiterFee() {
    if (!this.waiterFeeSelected) {
      return 0;
    }

    return this.getSubtotal() * 0.1;
  },

  getTotal() {
    return this.getSubtotal() + this.getWaiterFee();
  },

  getOrderPayload(customerName, tableNumber) {
    return {
      customer_name: customerName.trim(),

      table_number: Number(tableNumber),

      waiter_fee_selected: this.waiterFeeSelected,

      items: this.getCartItems().map((item) => {
        return {
          product_id: item.product.id,
          quantity: item.quantity
        };
      })
    };
  }
};

window.CardapioState = CardapioState;
