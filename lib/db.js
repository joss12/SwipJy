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
        mongoDb = mongoClient.db(options.database || "swipjy");
        console.log("✅ Connected to MongoDB");
    } else {
        throw new Error(`❌ Unsupported DB type: ${type}`);
    }
}

/**
 * Query dispatcher
 * @param {string} sqlOrCollection - SQL or Mongo collection name
 * @param {Array|undefined} params
 */
function query(sqlOrCollection, params = []) {
    if (!dbType) throw new Error("❌ DB not connected");

    if (dbType === "mysql") return pool.execute(sqlOrCollection, params);
    if (dbType === "postgres") return pool.query(sqlOrCollection, params);

    if (dbType === "mongodb") {
        const collection = mongoDb.collection(sqlOrCollection);
        return {
            find: (filter = {}) => collection.find(filter).toArray(),
            insert: (doc) => collection.insertOne(doc),
            update: (filter, update) =>
                collection.updateOne(filter, { $set: update }),
            delete: (filter) => collection.deleteOne(filter),
        };
    }

    throw new Error(`❌ Query not supported for dbType: ${dbType}`);
}

/**
 * Disconnect from the database
 */
async function disconnect() {
    if (dbType === "mysql" || dbType === "postgres") {
        await pool.end();
    }

    if (dbType === "mongodb" && mongoClient) {
        await mongoClient.close();
    }

    console.log(`🔌 Disconnected from ${dbType}`);
}

module.exports = {
    connect,
    query,
    disconnect,
};
