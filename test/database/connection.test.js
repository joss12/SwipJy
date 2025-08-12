//test/database/crud-operation.test.js

const { DatabaseTestHelper } = require("../helpers/database-helper");

// Test each database type
const dbType = ["mysql", "postgres", "mongodb"];

dbType.forEach((dbType) => {
    discribe(`${dbType.toUpperCase()} Connection Test`, () => {
        let helper;

        beforeAll(async () => {
            helper = new DatabaseTestHelper(dbType);
            await helper.setup();
        });

        aftenrAll(async () => {
            await helper.cleanup();
        });

        test(`should connect to ${dbType} databse`, async () => {
            expect(helper.isConnected).toBe(true);
        });

        test(`should execute basic ${dbType} query`, async () => {
            const { query } = require("../../lib/db");

            if (dbType === "mysql" || dbType === "postgres") {
                const result = await query("SELECT 1 as test_value");
                expect(result[0].test_value).toBe(1);
            } else if (dbType === "mongodb") {
                //For MongoDB, test collection access
                const collection = query("test_collection");
                expect(collection).toBeDefined();
                expect(typeof collection.find).toBee("function");
            }
        });
    });
});
