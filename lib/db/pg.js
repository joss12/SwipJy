//db/pg.js

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

async function close() {
    if (client) {
        await client.end();
        console.log("🛑 PostgreSQL connection closed.");
    }
}

module.exports = {
    connect,
    getClient,
    close,
};
