// db.js
// Creates a MySQL connection pool using XAMPP credentials.
// Also creates the gridguard database and all three tables
// automatically on first run — you don't need to do anything in phpMyAdmin.

require('dotenv').config();
const mysql = require('mysql2/promise');

// A connection pool reuses database connections instead of
// opening and closing one on every request — much faster.
let pool;

async function initDB() {
  try {
    // Step 1: connect WITHOUT specifying a database
    // so we can create it if it doesn't exist yet
    const tempConn = await mysql.createConnection({
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    // Create the database if it doesn't exist
    await tempConn.execute(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``
    );
    await tempConn.end();

    // Step 2: create the pool connected to our database
    pool = mysql.createPool({
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit:    10   // max 10 simultaneous connections
    });

    // Step 3: create tables if they don't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS gridguard_users (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100)        NOT NULL,
        email      VARCHAR(150) UNIQUE NOT NULL,
        password   VARCHAR(255)        NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS gridguard_scenarios (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT          NOT NULL,
        scenario_id VARCHAR(36)  NOT NULL,
        panels      INT          DEFAULT 0,
        turbines    INT          DEFAULT 0,
        evs         INT          DEFAULT 0,
        event_label VARCHAR(100) DEFAULT 'Normal day',
        supply      INT          DEFAULT 0,
        grid_load   INT          DEFAULT 0,
        balance     INT          DEFAULT 0,
        risk        INT          DEFAULT 0,
        color_state VARCHAR(20)  DEFAULT 'green',
        saved_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES gridguard_users(id) ON DELETE CASCADE
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS gridguard_bills (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT          NOT NULL,
        month_year VARCHAR(7)   NOT NULL,
        kwh        FLOAT        DEFAULT 0,
        sar        FLOAT        DEFAULT 0,
        people     INT          DEFAULT 1,
        panels     INT          DEFAULT 0,
        evs        INT          DEFAULT 0,
        rate       FLOAT        DEFAULT 0.18,
        saved_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_month (user_id, month_year),
        FOREIGN KEY (user_id) REFERENCES gridguard_users(id) ON DELETE CASCADE
      )
    `);

    console.log('MySQL connected. Tables ready.');

  } catch (err) {
    console.error('Database error:', err.message);
    console.error('Make sure XAMPP MySQL is running on port 3306.');
    process.exit(1);
  }
}

// Returns the connection pool so routes can run queries
function getPool() {
  return pool;
}

module.exports = { initDB, getPool };
