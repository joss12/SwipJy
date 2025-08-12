// test/database/setup-databases.js
//const mysql = require("mysql2/promise");
//const { Client } = require("pg");
//const { MongoClient } = require("mongodb");
//
//class DatabaseSetup {
//    static async setupMySQL() {
//        const config = global.TEST_DB_CONFIG.mysql;
//
//        // Connect without database to create it
//        const connection = await mysql.createConnection({
//            host: config.host,
//            user: config.user,
//            password: config.password,
//        });
//
//        try {
//            await connection.execute(
//                `CREATE DATABASE IF NOT EXISTS ${config.database}`,
//            );
//            console.log(`✅ MySQL test database '${config.database}' ready`);
//        } catch (error) {
//            console.error("❌ MySQL setup failed:", error.message);
//            throw error;
//        } finally {
//            await connection.end();
//        }
//    }
//
//    static async setupPostgreSQL() {
//        const config = global.TEST_DB_CONFIG.postgres;
//
//        // Connect to postgres database to create test database
//        const client = new Client({
//            host: config.host,
//            user: config.user,
//            password: config.password,
//            database: "postgres",
//            port: config.port,
//        });
//
//        try {
//            await client.connect();
//
//            // Check if database exists
//            const result = await client.query(
//                "SELECT 1 FROM pg_database WHERE datname = $1",
//                [config.database],
//            );
//
//            if (result.rows.length === 0) {
//                await client.query(`CREATE DATABASE ${config.database}`);
//                console.log(`✅ PostgreSQL test database '${config.database}' created`);
//            } else {
//                console.log(
//                    `✅ PostgreSQL test database '${config.database}' already exists`,
//                );
//            }
//        } catch (error) {
//            console.error("❌ PostgreSQL setup failed:", error.message);
//            throw error;
//        } finally {
//            await client.end();
//        }
//    }
//
//    static async setupMongoDB() {
//        const config = global.TEST_DB_CONFIG.mongodb;
//
//        const client = new MongoClient(config.uri);
//
//        try {
//            await client.connect();
//            const db = client.db(config.dbName);
//
//            // Create a dummy collection to ensure database exists
//            await db.createCollection("_test");
//            await db.collection("_test").drop();
//
//            console.log(`✅ MongoDB test database '${config.dbName}' ready`);
//        } catch (error) {
//            console.error("❌ MongoDB setup failed:", error.message);
//            throw error;
//        } finally {
//            await client.close();
//        }
//    }
//
//    static async setupAll() {
//        console.log("🔧 Setting up test databases...");
//
//        try {
//            await Promise.all([
//                this.setupMySQL(),
//                this.setupPostgreSQL(),
//                this.setupMongoDB(),
//            ]);
//            console.log("✅ All test databases ready!");
//        } catch (error) {
//            console.error("❌ Database setup failed:", error);
//            process.exit(1);
//        }
//    }
//}
//
//// Run setup if called directly
//if (require.main === module) {
//    // Load test config
//    require("../helpers/setup");
//    DatabaseSetup.setupAll();
//}
//
//module.exports = DatabaseSetup;

// test/database/quick-setup.js
// Standalone database setup script with full console output

// test/database/setup-databases.js
const mysql = require("mysql2/promise");
const { Client } = require("pg");
const { MongoClient } = require("mongodb");

// Store original console before setup.js potentially modifies it
const originalConsole = { ...console };

class DatabaseSetup {
    static async setupMySQL() {
        const config = global.TEST_DB_CONFIG.mysql;

        // Connect without database to create it
        const connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
        });

        try {
            await connection.execute(
                `CREATE DATABASE IF NOT EXISTS ${config.database}`,
            );
            originalConsole.log(`✅ MySQL test database '${config.database}' ready`);
        } catch (error) {
            originalConsole.error("❌ MySQL setup failed:", error.message);
            throw error;
        } finally {
            await connection.end();
        }
    }

    static async setupPostgreSQL() {
        const config = global.TEST_DB_CONFIG.postgres;

        // Connect to postgres database to create test database
        const client = new Client({
            host: config.host,
            user: config.user,
            password: config.password,
            database: "postgres",
            port: config.port,
        });

        try {
            await client.connect();

            // Check if database exists
            const result = await client.query(
                "SELECT 1 FROM pg_database WHERE datname = $1",
                [config.database],
            );

            if (result.rows.length === 0) {
                await client.query(`CREATE DATABASE ${config.database}`);
                originalConsole.log(
                    `✅ PostgreSQL test database '${config.database}' created`,
                );
            } else {
                originalConsole.log(
                    `✅ PostgreSQL test database '${config.database}' already exists`,
                );
            }
        } catch (error) {
            originalConsole.error("❌ PostgreSQL setup failed:", error.message);
            throw error;
        } finally {
            await client.end();
        }
    }

    static async setupMongoDB() {
        const config = global.TEST_DB_CONFIG.mongodb;

        const client = new MongoClient(config.uri);

        try {
            await client.connect();
            const db = client.db(config.dbName);

            // Just ping the database
            await db.admin().ping();

            // List collections to get count
            const collections = await db.listCollections().toArray();
            const testCollections = collections.filter(
                (col) => col.name.startsWith("test_") || col.name === "_test",
            );

            // Clean up test collections from previous runs
            if (testCollections.length > 0) {
                for (const collection of testCollections) {
                    try {
                        await db.collection(collection.name).drop();
                    } catch (error) {
                        // Ignore errors when dropping collections
                    }
                }
            }

            const finalCollections = await db.listCollections().toArray();
            originalConsole.log(
                `✅ MongoDB test database '${config.dbName}' ready (${finalCollections.length} collections)`,
            );
        } catch (error) {
            originalConsole.error("❌ MongoDB setup failed:", error.message);
            throw error;
        } finally {
            await client.close();
        }
    }

    static async setupAll() {
        originalConsole.log("🔧 Setting up test databases...");

        const results = {
            mysql: false,
            postgres: false,
            mongodb: false,
        };

        // Try MySQL
        try {
            await this.setupMySQL();
            results.mysql = true;
        } catch (error) {
            // Error already logged in setupMySQL
        }

        // Try PostgreSQL
        try {
            await this.setupPostgreSQL();
            results.postgres = true;
        } catch (error) {
            // Error already logged in setupPostgreSQL
        }

        // Try MongoDB
        try {
            await this.setupMongoDB();
            results.mongodb = true;
        } catch (error) {
            // Error already logged in setupMongoDB
        }

        // Summary
        const successful = Object.values(results).filter(Boolean).length;
        const total = Object.keys(results).length;

        originalConsole.log(
            `📊 Setup Summary: ${successful}/${total} databases ready`,
        );

        if (results.mysql) originalConsole.log("  ✅ MySQL ready");
        if (results.postgres) originalConsole.log("  ✅ PostgreSQL ready");
        if (results.mongodb) originalConsole.log("  ✅ MongoDB ready");

        if (successful > 0) {
            originalConsole.log("🎉 You can now run database tests!");
            originalConsole.log("Commands:");
            if (results.mysql) originalConsole.log("  npm run test:mysql");
            if (results.postgres) originalConsole.log("  npm run test:postgres");
            if (results.mongodb) originalConsole.log("  npm run test:mongodb");
            originalConsole.log("  npm run test:db  # Test all available databases");
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    // Load test config
    require("../helpers/setup");
    DatabaseSetup.setupAll();
}

module.exports = DatabaseSetup;
