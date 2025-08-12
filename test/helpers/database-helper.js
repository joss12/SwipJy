// test/helpers/database-helper.js - SIMPLIFIED VERSION
require("./setup"); // Load config

const { connect, disconnect, query } = require("../../lib/db");

class DatabaseTestHelper {
    constructor(dbType = "mysql") {
        this.dbType = dbType;
        this.config = global.TEST_DB_CONFIG[dbType];
        this.isConnected = false;
    }

    async setup() {
        await connect(this.dbType, this.config);
        this.isConnected = true;
        await this.createTestTables();
    }

    async cleanup() {
        if (this.isConnected) {
            await this.clearTestData();
            await disconnect();
            this.isConnected = false;
        }
    }

    async createTestTables() {
        if (this.dbType === "mysql") {
            await query(`
                CREATE TABLE IF NOT EXISTS test_users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    age INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } else if (this.dbType === "postgres") {
            await query(`
                CREATE TABLE IF NOT EXISTS test_users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    age INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }
        // MongoDB creates collections automatically
    }

    async clearTestData() {
        if (this.dbType === "mysql" || this.dbType === "postgres") {
            await query("DELETE FROM test_users");
        } else if (this.dbType === "mongodb") {
            const collection = query("test_users");
            await collection.deleteMany({});
        }
    }

    // Helper methods for inserting test data
    async insertTestUser(name, email, age = 25) {
        if (this.dbType === "mysql" || this.dbType === "postgres") {
            // Use the fixed query function - it should now return proper metadata
            return await query(
                "INSERT INTO test_users (name, email, age) VALUES (?, ?, ?)",
                [name, email, age],
            );
        } else if (this.dbType === "mongodb") {
            const collection = query("test_users");
            return await collection.insertOne({ name, email, age });
        }
    }

    async getTestUsers() {
        if (this.dbType === "mysql" || this.dbType === "postgres") {
            return await query("SELECT * FROM test_users ORDER BY id");
        } else if (this.dbType === "mongodb") {
            const collection = query("test_users");
            return await collection.find({});
        }
    }
}

module.exports = { DatabaseTestHelper };
