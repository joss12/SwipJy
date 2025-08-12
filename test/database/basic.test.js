// test/database/basic.test.js - UPDATED VERSION
//require("../helpers/setup");
//
//const { DatabaseTestHelper } = require("../helpers/database-helper");
//
//describe("Basic Database Tests", () => {
//    let helper;
//
//    beforeAll(async () => {
//        helper = new DatabaseTestHelper("mysql");
//        await helper.setup();
//    });
//
//    afterAll(async () => {
//        if (helper) {
//            await helper.cleanup();
//        }
//    });
//
//    beforeEach(async () => {
//        // Clear data before each test
//        if (helper && helper.isConnected) {
//            await helper.clearTestData();
//        }
//    });
//
//    test("should connect to database", () => {
//        expect(helper.isConnected).toBe(true);
//        expect(helper.config).toBeDefined();
//        expect(helper.config.database).toBe("swipjy_test");
//    });
//
//    test("should insert and fetch user", async () => {
//        const { query } = require("../../lib/db");
//
//        // Insert using the helper method (handles database differences)
//        const result = await helper.insertTestUser(
//            "Test User",
//            "test@example.com",
//            30,
//        );
//
//        // Verify insert result
//        expect(result.affectedRows).toBe(1);
//        expect(result.insertId).toBeDefined();
//
//        // Fetch user
//        const users = await query("SELECT * FROM test_users WHERE email = ?", [
//            "test@example.com",
//        ]);
//
//        expect(users).toHaveLength(1);
//        expect(users[0].name).toBe("Test User");
//        expect(users[0].email).toBe("test@example.com");
//        expect(users[0].age).toBe(30);
//    });
//
//    test("should handle multiple users", async () => {
//        // Insert multiple users
//        await helper.insertTestUser("User 1", "user1@example.com", 25);
//        await helper.insertTestUser("User 2", "user2@example.com", 30);
//        await helper.insertTestUser("User 3", "user3@example.com", 35);
//
//        // Fetch all users
//        const users = await helper.getTestUsers();
//
//        expect(users).toHaveLength(3);
//        expect(users[0].name).toBe("User 1");
//        expect(users[1].name).toBe("User 2");
//        expect(users[2].name).toBe("User 3");
//    });
//
//    test("should update user", async () => {
//        const { query } = require("../../lib/db");
//
//        // Insert user first
//        const insertResult = await helper.insertTestUser(
//            "Original Name",
//            "update@example.com",
//            25,
//        );
//
//        // Update user
//        const updateResult = await query(
//            "UPDATE test_users SET name = ?, age = ? WHERE id = ?",
//            ["Updated Name", 30, insertResult.insertId],
//        );
//
//        expect(updateResult.affectedRows).toBe(1);
//
//        // Verify update
//        const users = await query("SELECT * FROM test_users WHERE id = ?", [
//            insertResult.insertId,
//        ]);
//        expect(users[0].name).toBe("Updated Name");
//        expect(users[0].age).toBe(30);
//    });
//
//    test("should delete user", async () => {
//        const { query } = require("../../lib/db");
//
//        // Insert user first
//        const insertResult = await helper.insertTestUser(
//            "Delete Me",
//            "delete@example.com",
//            25,
//        );
//
//        // Delete user
//        const deleteResult = await query("DELETE FROM test_users WHERE id = ?", [
//            insertResult.insertId,
//        ]);
//
//        expect(deleteResult.affectedRows).toBe(1);
//
//        // Verify deletion
//        const users = await query("SELECT * FROM test_users WHERE id = ?", [
//            insertResult.insertId,
//        ]);
//        expect(users).toHaveLength(0);
//    });
//});

// test/database/basic.test.js - FIXED VERSION
require("../helpers/setup");

const { DatabaseTestHelper } = require("../helpers/database-helper");

describe("Basic Database Tests", () => {
    let helper;

    beforeAll(async () => {
        helper = new DatabaseTestHelper("mysql");
        await helper.setup();
    });

    afterAll(async () => {
        if (helper) {
            await helper.cleanup();
        }
    });

    beforeEach(async () => {
        // Clear data before each test
        if (helper && helper.isConnected) {
            await helper.clearTestData();
        }
    });

    test("should connect to database", () => {
        expect(helper.isConnected).toBe(true);
        expect(helper.config).toBeDefined();
        expect(helper.config.database).toBe("swipjy_test");
    });

    test("should insert and fetch user", async () => {
        // Insert using the helper method (handles database differences)
        const result = await helper.insertTestUser(
            "Test User",
            "test@example.com",
            30,
        );

        // Verify insert result
        expect(result).toBeDefined();
        expect(result.affectedRows).toBe(1);
        expect(result.insertId).toBeDefined();

        // Fetch user using helper method
        const users = await helper.getTestUsers();

        expect(users).toHaveLength(1);
        expect(users[0].name).toBe("Test User");
        expect(users[0].email).toBe("test@example.com");
        expect(users[0].age).toBe(30);
    });

    test("should handle multiple users", async () => {
        // Insert multiple users
        await helper.insertTestUser("User 1", "user1@example.com", 25);
        await helper.insertTestUser("User 2", "user2@example.com", 30);
        await helper.insertTestUser("User 3", "user3@example.com", 35);

        // Fetch all users
        const users = await helper.getTestUsers();

        expect(users).toHaveLength(3);
        expect(users[0].name).toBe("User 1");
        expect(users[1].name).toBe("User 2");
        expect(users[2].name).toBe("User 3");
    });

    test("should update user", async () => {
        const { query } = require("../../lib/db");

        // Insert user first
        const insertResult = await helper.insertTestUser(
            "Original Name",
            "update@example.com",
            25,
        );
        expect(insertResult.insertId).toBeDefined();

        // Update user
        const updateResult = await query(
            "UPDATE test_users SET name = ?, age = ? WHERE id = ?",
            ["Updated Name", 30, insertResult.insertId],
        );

        expect(updateResult.affectedRows).toBe(1);

        // Verify update
        const users = await query("SELECT * FROM test_users WHERE id = ?", [
            insertResult.insertId,
        ]);
        expect(users).toHaveLength(1);
        expect(users[0].name).toBe("Updated Name");
        expect(users[0].age).toBe(30);
    });

    test("should delete user", async () => {
        const { query } = require("../../lib/db");

        // Insert user first
        const insertResult = await helper.insertTestUser(
            "Delete Me",
            "delete@example.com",
            25,
        );
        expect(insertResult.insertId).toBeDefined();

        // Delete user
        const deleteResult = await query("DELETE FROM test_users WHERE id = ?", [
            insertResult.insertId,
        ]);

        expect(deleteResult.affectedRows).toBe(1);

        // Verify deletion
        const users = await query("SELECT * FROM test_users WHERE id = ?", [
            insertResult.insertId,
        ]);
        expect(users).toHaveLength(0);
    });
});
