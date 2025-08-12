// lib/db/mysql.js
//const mysql = require("mysql2/promise");
//
//let pool = null;
//
//async function connect(config) {
//    pool = mysql.createPool({
//        host: config.host || "localhost",
//        user: config.user || "root",
//        password: config.password || "",
//        database: config.database || "",
//        waitForConnections: true,
//        connectionLimit: 10,
//        queueLimit: 0,
//    });
//    console.log("✅ Connected to MySQL");
//}
//
//function getPool() {
//    if (!pool)
//        throw new Error("MySQL pool not initialized. Call connect() first.");
//    return pool;
//}
//
//async function query(sql, params = []) {
//    const [rows] = await getPool().execute(sql, params);
//    return rows;
//}
//
//async function close() {
//    if (pool) {
//        await pool.end();
//        console.log("🔌 MySQL connection closed");
//    }
//}
//
//module.exports = {
//    connect,
//    query,
//    close,
//};

// lib/db/mysql.js - UPDATED VERSION
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
    const [rows, fields] = await getPool().execute(sql, params);

    // For INSERT, UPDATE, DELETE queries, return the result metadata
    if (
        sql.trim().toUpperCase().startsWith("INSERT") ||
        sql.trim().toUpperCase().startsWith("UPDATE") ||
        sql.trim().toUpperCase().startsWith("DELETE")
    ) {
        return {
            affectedRows: rows.affectedRows,
            insertId: rows.insertId,
            changedRows: rows.changedRows,
            warningCount: rows.warningCount,
        };
    }

    // For SELECT queries, return just the rows
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
    getPool, // Keep for backward compatibility
};
