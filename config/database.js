// Database configuration and connection pool
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.HEALTH_HOST || "localhost",
  user: process.env.HEALTH_USER || "health_app",
  password: process.env.HEALTH_PASSWORD || "qwertyuiop",
  database: process.env.HEALTH_DATABASE || "health",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
