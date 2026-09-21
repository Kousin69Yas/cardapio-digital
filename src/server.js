const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { testConnection } = require("./db");

const productsRoutes = require("./routes/products.routes");
const categoriesRoutes = require("./routes/categories.routes");
const ordersRoutes = require("./routes/orders.routes");
const brandingRoutes = require("./routes/branding.routes");

const app = express();

const PORT = Number(process.env.PORT || 3000);

const frontendPath = path.resolve(
  __dirname,
  "../../frontend"
);

/*
|--------------------------------------------------------------------------
| Configurações básicas
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Arquivos estáticos do frontend
|--------------------------------------------------------------------------
*/

app.use(express.static(frontendPath));

/*
|--------------------------------------------------------------------------
| Rotas da API
|--------------------------------------------------------------------------
*/

app.use("/api/products", productsRoutes);

app.use("/api/categories", categoriesRoutes);

app.use("/api/orders", ordersRoutes);

app.use("/api/branding", brandingRoutes);

/*
|--------------------------------------------------------------------------
| Rota de teste do servidor
|--------------------------------------------------------------------------
*/

app.get("/api/health", async (req, res) => {
  try {
    await testConnection();

    res.status(200).json({
      success: true,
      message: "Servidor e banco funcionando corretamente.",
      database: "online"
    });
  } catch (error) {
    console.error("Erro no health check:", error);

    res.status(500).json({
      success: false,
      message: "Servidor funcionando, mas o banco está indisponível.",
      database: "offline"
    });
  }
});

/*
|--------------------------------------------------------------------------
| Rota inicial do frontend
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.sendFile(
    path.join(frontendPath, "index.html")
  );
});

/*
|--------------------------------------------------------------------------
| Tratamento de rota inexistente da API
|--------------------------------------------------------------------------
*/

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota da API não encontrada."
  });
});

/*
|--------------------------------------------------------------------------
| Tratamento geral de erros
|--------------------------------------------------------------------------
*/

app.use((error, req, res, next) => {
  console.error("Erro interno:", error);

  res.status(500).json({
    success: false,
    message: "Erro interno do servidor."
  });
});

/*
|--------------------------------------------------------------------------
| Inicialização
|--------------------------------------------------------------------------
*/

app.listen(PORT, async () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}` );
  console.log(`API: http://localhost:${PORT}/api` );

  try {
    await testConnection();
  } catch (error) {
    console.error(
      "Aviso: não foi possível conectar ao banco SQL."
    );
  }
});
