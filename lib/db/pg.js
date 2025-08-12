//db/pg.js

//const { Client } = require("pg");
//
//let client;
//
//async function connect(config) {
//    const { host, port, user, password, database } = config;
//
//    if (!host || !user || !database) {
//        throw new Error("PostgreSQL config must include host, user, and database");
//    }
//
//    try {
//        client = new Client({
//            host,
//            port: port || 5432,
//            user,
//            password,
//            database,
//        });
//        await client.connect();
//        console.log("✅ Connected to PostgreSQL:", database);
//        return client;
//    } catch (err) {
//        console.error("❌ PostgreSQL connection failed:", err.message);
//        throw err;
//    }
//}
//
//function getClient() {
//    if (!client) throw new Error("PostgreSQL client not connected");
//    return client;
//}
//
//async function close() {
//    if (client) {
//        await client.end();
//        console.log("🛑 PostgreSQL connection closed.");
//    }
//}
//
//module.exports = {
//    connect,
//    getClient,
//    close,
//};

//lib/db/pg.js - UPDATED VERSION
const { Client } = require("pg");

let client;

async function connect(config) {
  const { host, port, user, password, database } = config;

  if (!host || !user || !database) {
    throw new Error("PostgreSQL config must include host, user, and database");
  }

  try {
    client = new Client({
      host,
      port: port || 5432,
      user,
      password,
      database,
    });
    await client.connect();
    console.log("✅ Connected to PostgreSQL:", database);
    return client;
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    throw err;
  }
}

function getClient() {
  if (!client) throw new Error("PostgreSQL client not connected");
  return client;
}

async function query(sql, params = []) {
  const result = await getClient().query(sql, params);

  // For INSERT, UPDATE, DELETE queries, return metadata
  if (
    sql.trim().toUpperCase().startsWith("INSERT") ||
    sql.trim().toUpperCase().startsWith("UPDATE") ||
    sql.trim().toUpperCase().startsWith("DELETE")
  ) {
    return {
      rowCount: result.rowCount,
      affectedRows: result.rowCount, // Alias for compatibility with MySQL tests
      insertId: result.rows[0]?.id, // Only available if RETURNING id is used
      rows: result.rows,
    };
  }

  // For SELECT queries, return just the rows
  return result.rows;
}

async function close() {
  if (client) {
    await client.end();
    console.log("🛑 PostgreSQL connection closed.");
  }
}

module.exports = {
  connect,
  getClient,
  query,
  close,
};
