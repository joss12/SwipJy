// test/database/crud-operations.test.js
require("../helpers/setup"); // ← ADD THIS LINE

const { DatabaseTestHelper } = require("../helpers/database-helper");
const { sampleUsers } = require("../fixtures/sample-data");

const dbTypes = ["mysql", "postgres", "mongodb"];

dbTypes.forEach((dbType) => {
    describe(`${dbType.toUpperCase()} CRUD Operations`, () => {
        let helper;

        beforeAll(async () => {
            helper = new DatabaseTestHelper(dbType);
            await helper.setup();
        });

        afterAll(async () => {
            await helper.cleanup();
        });

        beforeEach(async () => {
            // Clear data before each test
            await helper.clearTestData();
        });

        describe("Create Operations", () => {
            test("should insert a single user", async () => {
                const user = sampleUsers[0];
                const result = await helper.insertTestUser(
                    user.name,
                    user.email,
                    user.age,
                );

                if (dbType === "mysql" || dbType === "postgres") {
                    expect(result.affectedRows || result.rowCount).toBe(1);
                    expect(result.insertId || result.insertedId).toBeDefined();
                } else if (dbType === "mongodb") {
                    expect(result.insertedId).toBeDefined();
                }
            });

            test("should insert multiple users", async () => {
                for (const user of sampleUsers) {
                    await helper.insertTestUser(user.name, user.email, user.age);
                }

                const users = await helper.getTestUsers();
                expect(users).toHaveLength(3);
            });
        });

        describe("Read Operations", () => {
            beforeEach(async () => {
                // Insert test data
                for (const user of sampleUsers) {
                    await helper.insertTestUser(user.name, user.email, user.age);
                }
            });

            test("should fetch all users", async () => {
                const users = await helper.getTestUsers();
                expect(users).toHaveLength(3);
                expect(users[0].name).toBe("John Doe");
            });

            test("should fetch user by email", async () => {
                const { query } = require("../../lib/db");

                if (dbType === "mysql" || dbType === "postgres") {
                    const users = await query(
                        "SELECT * FROM test_users WHERE email = ?",
                        ["jane@example.com"],
                    );
                    expect(users).toHaveLength(1);
                    expect(users[0].name).toBe("Jane Smith");
                } else if (dbType === "mongodb") {
                    const collection = query("test_users");
                    const users = await collection.find({ email: "jane@example.com" });
                    expect(users).toHaveLength(1);
                    expect(users[0].name).toBe("Jane Smith");
                }
            });
        });

        describe("Update Operations", () => {
            let userId;

            beforeEach(async () => {
                const result = await helper.insertTestUser(
                    "Update Test",
                    "update@example.com",
                    25,
                );
                userId = result.insertId || result.insertedId;
            });

            test("should update user data", async () => {
                const { query } = require("../../lib/db");

                if (dbType === "mysql" || dbType === "postgres") {
                    const updateResult = await query(
                        "UPDATE test_users SET name = ?, age = ? WHERE id = ?",
                        ["Updated Name", 30, userId],
                    );
                    expect(updateResult.affectedRows || updateResult.rowCount).toBe(1);

                    const users = await query("SELECT * FROM test_users WHERE id = ?", [
                        userId,
                    ]);
                    expect(users[0].name).toBe("Updated Name");
                    expect(users[0].age).toBe(30);
                } else if (dbType === "mongodb") {
                    const collection = query("test_users");
                    const updateResult = await collection.update(
                        { _id: userId },
                        { name: "Updated Name", age: 30 },
                    );
                    expect(updateResult.modifiedCount).toBe(1);

                    const users = await collection.find({ _id: userId });
                    expect(users[0].name).toBe("Updated Name");
                    expect(users[0].age).toBe(30);
                }
            });
        });

        describe("Delete Operations", () => {
            let userId;

            beforeEach(async () => {
                const result = await helper.insertTestUser(
                    "Delete Test",
                    "delete@example.com",
                    25,
                );
                userId = result.insertId || result.insertedId;
            });

            test("should delete user", async () => {
                const { query } = require("../../lib/db");

                if (dbType === "mysql" || dbType === "postgres") {
                    const deleteResult = await query(
                        "DELETE FROM test_users WHERE id = ?",
                        [userId],
                    );
                    expect(deleteResult.affectedRows || deleteResult.rowCount).toBe(1);

                    const users = await query("SELECT * FROM test_users WHERE id = ?", [
                        userId,
                    ]);
                    expect(users).toHaveLength(0);
                } else if (dbType === "mongodb") {
                    const collection = query("test_users");
                    const deleteResult = await collection.delete({ _id: userId });
                    expect(deleteResult.deletedCount).toBe(1);

                    const users = await collection.find({ _id: userId });
                    expect(users).toHaveLength(0);
                }
            });
        });
    });
});
