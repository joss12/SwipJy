// db/index.js
const mysql = require("./mysql");
const postgres = require("./pg");
const mongodb = require("./mongodb");

let activeDriver = null;

async function connect(type, config) {
    switch (type.toLowerCase()) {
        case "mysql":
            activeDriver = mysql;
            return mysql.connect(config);

        case "postgres":
        case "postgresql":
        case "pg":
            activeDriver = postgres;
            return postgres.connect(config);

        case "mongodb":
        case "mongo":
            activeDriver = mongodb;
            return mongodb.connect(config);

        default:
            throw new Error(`Unknown DB type: ${type}`);
    }
}

function get() {
    if (!activeDriver) {
        throw new Error("No database connected. Call connect(type, config) first.");
    }

    // Return a generic accessor
    return {
        mysql: activeDriver.getConnection,
        pg: activeDriver.getClient,
        mongo: activeDriver.getClient,
    };
}

async function close() {
    if (activeDriver && activeDriver.close) {
        await activeDriver.close();
    }
}

module.exports = {
    connect,
    get,
    close,
};
