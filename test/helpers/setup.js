//test / helpers / setup.js;
const { warn } = require("console");
const path = require("path");

// Set test environment
process.env.NODE_ENV = "test";

//// Global test configurations for each database
global.TEST_DB_CONFIG = {
    mysql: {
        host: process.env.TEST_MYSQL_HOST || "localhost",
        user: process.env.TEST_MYSQL_USER || "egs",
        password: process.env.TEST_MYSQL_PASSWORD || "eg12",
        database: process.env.TEST_MYSQL_DATABASE || "swipjy_test",
    },
    postgres: {
        host: process.env.TEST_PG_HOST || "localhost",
        user: process.env.TEST_PG_USER || "egs",
        password: process.env.TEST_PG_PASSWORD || "eg12",
        database: process.env.TEST_PG_DATABASE || "swipjy_test",
        port: process.env.TEST_PG_PORT || 5432,
    },
    mongodb: {
        uri: process.env.TEST_MONGO_URI || "mongodb://localhost:27017",
        dbName: process.env.TEST_MONGO_DB || "swipjy_test7",
    },
};
//
// Quiet console output during tests - only when jest is available
// Debug: Log that setup is running (only in Jest)
if (typeof jest !== "undefined") {
    console.log("🔧 Test setup loaded - Database configs available");
}

// Only quiet console output during Jest tests (not setup scripts)
const isJestRunning = typeof jest !== "undefined";
const isSetupScript = process.argv.some(
    (arg) =>
        arg.includes("setup-databases.js") ||
        arg.includes("simple-setup.js") ||
        arg.includes("quick-setup.js"),
);

if (process.env.NODE_ENV === "test" && isJestRunning && !isSetupScript) {
    // Only suppress console during Jest tests, not setup
    global.console = {
        ...console,
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: console.error, // Keep errors visible
    };
}

// Export for manual require if needed
module.exports = {
    TEST_DB_CONFIG: global.TEST_DB_CONFIG,
};
