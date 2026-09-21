const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

function createDatabasePool() {
  if (process.env.DATABASE_URL) {
    const databaseUrl = new URL(process.env.DATABASE_URL);

    return mysql.createPool({
      host: databaseUrl.hostname,
      port: Number(databaseUrl.port || 3306),
      user: decodeURIComponent(databaseUrl.username),
      password: decodeURIComponent(databaseUrl.password),
      database: databaseUrl.pathname.replace("/", ""),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4"
    });
  }

  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "cardapio_digital",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4"
  });
}

pool = createDatabasePool();

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);

  return rows;
}

async function getConnection() {
  return pool.getConnection();
}

async function testConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();

    console.log("Conexão com o banco SQL realizada com sucesso.");
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  getConnection,
  testConnection
};
