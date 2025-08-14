//db/mongodb.js
const { MongoClient } = require("mongodb");

let client;
let db;

async function connect(config) {
    const { uri, dbName } = config;

    if (!uri || !dbName) {
        throw new Error("MongoDB config must include 'uri' and 'dbName'");
    }

    try {
        client = new MongoClient(uri, { useUnifiedTopology: true });
        await client.connect();
        db = client.db(dbName);
        console.log("✅ Connected to MongoDB:", dbName);
        return db;
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        throw err;
    }
}

function getDB() {
    if (!db) throw new Error("MongoDB is not connected yet");
    return db;
}

function close() {
    return client?.close();
}

module.exports = {
    connect,
    getDB,
    close,
};
