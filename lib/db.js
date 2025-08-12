//const mysql = require("mysql2/promise");
//const { Pool: PgPool } = require("pg");
//const { MongoClient } = require("mongodb");
//const { config } = require("./config");
//
//let pool = null;
//let dbType = null;
//let mongoClient = null;
//let mongoDb = null;
//
///**
// * Connect to a database
// * @param {"mysql"|"postgres"|"mongodb"} type
// * @param {object} options
// */
//async function connect(type = "mysql", options = config.db) {
//    dbType = type;
//
//    if (type === "mysql") {
//        pool = mysql.createPool({
//            host: options.host,
//            user: options.user,
//            password: options.password,
//            database: options.database,
//            waitForConnections: true,
//            connectionLimit: 10,
//            queueLimit: 0,
//        });
//        await pool.getConnection();
//        console.log("✅ Connected to MySQL");
//    } else if (type === "postgres") {
//        pool = new PgPool({
//            host: options.host,
//            user: options.user,
//            password: options.password,
//            database: options.database,
//            port: options.port || 5432,
//        });
//        await pool.connect();
//        console.log("✅ Connected to PostgreSQL");
//    } else if (type === "mongodb") {
//        const uri = options.uri || "mongodb://localhost:27017";
//        mongoClient = new MongoClient(uri);
//        await mongoClient.connect();
//        mongoDb = mongoClient.db(options.database || "swipjy");
//        console.log("✅ Connected to MongoDB");
//    } else {
//        throw new Error(`❌ Unsupported DB type: ${type}`);
//    }
//}
//
///**
// * Query dispatcher
// * @param {string} sqlOrCollection - SQL or Mongo collection name
// * @param {Array|undefined} params
// */
//function query(sqlOrCollection, params = []) {
//    if (!dbType) throw new Error("❌ DB not connected");
//
//    if (dbType === "mysql") return pool.execute(sqlOrCollection, params);
//    if (dbType === "postgres") return pool.query(sqlOrCollection, params);
//
//    if (dbType === "mongodb") {
//        const collection = mongoDb.collection(sqlOrCollection);
//        return {
//            find: (filter = {}) => collection.find(filter).toArray(),
//            insert: (doc) => collection.insertOne(doc),
//            update: (filter, update) =>
//                collection.updateOne(filter, { $set: update }),
//            delete: (filter) => collection.deleteOne(filter),
//        };
//    }
//
//    throw new Error(`❌ Query not supported for dbType: ${dbType}`);
//}
//
///**
// * Disconnect from the database
// */
//async function disconnect() {
//    if (dbType === "mysql" || dbType === "postgres") {
//        await pool.end();
//    }
//
//    if (dbType === "mongodb" && mongoClient) {
//        await mongoClient.close();
//    }
//
//    console.log(`🔌 Disconnected from ${dbType}`);
//}
//
//module.exports = {
//    connect,
//    query,
//    disconnect,
//};

// lib/db.js - FIXED VERSION
const mysql = require("mysql2/promise");
const { Pool: PgPool } = require("pg");
const { MongoClient } = require("mongodb");
const { config } = require("./config");

let pool = null;
let dbType = null;
let mongoClient = null;
let mongoDb = null;

/**
 * Connect to a database
 * @param {"mysql"|"postgres"|"mongodb"} type
 * @param {object} options
 */
async function connect(type = "mysql", options = config.db) {
  dbType = type;

  if (type === "mysql") {
    pool = mysql.createPool({
      host: options.host,
      user: options.user,
      password: options.password,
      database: options.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    await pool.getConnection();
    console.log("✅ Connected to MySQL");
  } else if (type === "postgres") {
    pool = new PgPool({
      host: options.host,
      user: options.user,
      password: options.password,
      database: options.database,
      port: options.port || 5432,
    });
    await pool.connect();
    console.log("✅ Connected to PostgreSQL");
  } else if (type === "mongodb") {
    const uri = options.uri || "mongodb://localhost:27017";
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    mongoDb = mongoClient.db(options.database || options.dbName || "swipjy");
    console.log("✅ Connected to MongoDB");
  } else {
    throw new Error(`❌ Unsupported DB type: ${type}`);
  }
}

/**
 * Query dispatcher - FIXED to return proper metadata
 * @param {string} sqlOrCollection - SQL or Mongo collection name
 * @param {Array|undefined} params
 */
function query(sqlOrCollection, params = []) {
  if (!dbType) throw new Error("❌ DB not connected");

  if (dbType === "mysql") {
    return executeMySQL(sqlOrCollection, params);
  }

  if (dbType === "postgres") {
    return executePostgreSQL(sqlOrCollection, params);
  }

  if (dbType === "mongodb") {
    const collection = mongoDb.collection(sqlOrCollection);
    return {
      find: (filter = {}) => collection.find(filter).toArray(),
      insert: (doc) => collection.insertOne(doc),
      insertOne: (doc) => collection.insertOne(doc),
      update: (filter, update) =>
        collection.updateOne(filter, { $set: update }),
      updateOne: (filter, update) =>
        collection.updateOne(filter, { $set: update }),
      delete: (filter) => collection.deleteOne(filter),
      deleteOne: (filter) => collection.deleteOne(filter),
      deleteMany: (filter) => collection.deleteMany(filter),
    };
  }

  throw new Error(`❌ Query not supported for dbType: ${dbType}`);
}

/**
 * Execute MySQL queries with proper result handling
 */
async function executeMySQL(sql, params = []) {
  const [rows, fields] = await pool.execute(sql, params);

  // For INSERT, UPDATE, DELETE queries, return the result metadata
  const sqlUpper = sql.trim().toUpperCase();
  if (
    sqlUpper.startsWith("INSERT") ||
    sqlUpper.startsWith("UPDATE") ||
    sqlUpper.startsWith("DELETE")
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

/**
 * Execute PostgreSQL queries with proper result handling
 */
async function executePostgreSQL(sql, params = []) {
  const result = await pool.query(sql, params);

  // For INSERT, UPDATE, DELETE queries, return metadata
  const sqlUpper = sql.trim().toUpperCase();
  if (
    sqlUpper.startsWith("INSERT") ||
    sqlUpper.startsWith("UPDATE") ||
    sqlUpper.startsWith("DELETE")
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

/**
 * Disconnect from the database
 */
async function disconnect() {
  if (dbType === "mysql" || dbType === "postgres") {
    if (pool) {
      await pool.end();
    }
  }

  if (dbType === "mongodb" && mongoClient) {
    await mongoClient.close();
  }

  console.log(`🔌 Disconnected from ${dbType}`);

  // Reset connection state
  pool = null;
  dbType = null;
  mongoClient = null;
  mongoDb = null;
}

module.exports = {
  connect,
  query,
  disconnect,
};
