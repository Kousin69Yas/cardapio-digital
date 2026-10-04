const express = require("express");
const cors = require("cors");

require("dotenv").config();

const {
  testConnection
} = require("./db");

const brandingRoutes = require("./routes/branding.routes");
const categoriesRoutes = require("./routes/categories.routes");
const productsRoutes = require("./routes/products.routes");
const ordersRoutes = require("./routes/orders.routes");

const app = express();

const PORT = Number(process.env.PORT || 3000);

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API do Cardápio Digital está online.",
    endpoints: [
      "/api/health",
      "/api/branding",
      "/api/categories",
      "/api/products",
      "/api/orders"
    ]
  });
});

app.use("/api/branding", brandingRoutes);

app.use("/api/categories", categoriesRoutes);

app.use("/api/products", productsRoutes);

app.use("/api/orders", ordersRoutes);

app.get("/api/health", async (req, res) => {
  try {
    await testConnection();

    return res.status(200).json({
      success: true,
      database: "online"
    });
  } catch (error) {
    console.error("Erro no health check:", error);

    return res.status(500).json({
      success: false,
      database: "offline",
      error: error.message
    });
  }
});

app.use("/api", (req, res) => {
  return res.status(404).json({
    success: false,
    message: "Rota da API não encontrada."
  });
});

app.use((error, req, res, next) => {
  console.error("Erro interno:", error);

  return res.status(500).json({
    success: false,
    message: "Erro interno do servidor."
  });
});

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Servidor iniciado na porta ${PORT}`);

  try {
    await testConnection();

    console.log(
      "Conexão com o MySQL realizada com sucesso."
    );
  } catch (error) {
    console.error(
      "Erro ao conectar ao MySQL:",
      error.message
    );
  }
});
