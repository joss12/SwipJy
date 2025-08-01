// lib/db/mysql.js
const mysql = require("mysql2/promise");

let pool = null;

async function connect(config) {
    pool = mysql.createPool({
        host: config.host || "localhost",
        user: config.user || "root",
        password: config.password || "",
        database: config.database || "",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
    console.log("✅ Connected to MySQL");
}

function getPool() {
    if (!pool)
        throw new Error("MySQL pool not initialized. Call connect() first.");
    return pool;
}

async function query(sql, params = []) {
    const [rows] = await getPool().execute(sql, params);
    return rows;
}

async function close() {
    if (pool) {
        await pool.end();
        console.log("🔌 MySQL connection closed");
    }
}

module.exports = {
    connect,
    query,
    close,
};
