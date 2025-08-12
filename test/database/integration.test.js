// test/database/integration.test.js
const { DatabaseTestHelper } = require("../helpers/database-helper");

const dbTypes = ["mysql", "postgres"]; //Skip MongoDB for SQL-specific test

dbTypes.forEach((dbType) => {
  describe(`${dbType.toUpperCase()}Integration Tests`, () => {
    let helper;

    beforeAll(async () => {
      helper = new DatabaseTestHelper(dbType);
      await helper.setup();
    });

    afterAll(async () => {
      await helper.cleanup();
    });
    beforeAll(async () => {
      await helper.clearTestData();
    });

    test("should handle user-post relationships", async () => {
      const { query } = require("../../lib/db");

      //Create user
      const userResult = await query(
        "INSERT INTO test_users (name, email, age) VALUES (?, ?, ?)",
        ["Author User", "author@example.com", 30],
      );

      const userId = userResult.insertId || userResult.row?.[0]?.id;

      //create posts for user
      await query(
        "INSERT INTO test_posts (user_id, title, content, published) VALUES (?, ?, ?, ?)",
        [userId, "First Post", "Content 1", true],
      );

      await query(
        "INSERT INTO test_posts (user_id, title, content, published) VALUES (?, ?, ?, ?)",
        [userId, "Second Post", "Content 2", false],
      );

      //Test JOIN query
      const posts = await query(
        `
                SELECT p.title, p.content, p.published, u.name as author_name
                FROM test_posts p
                JOIN test_users u ON p.user_id = u.id
                WHERE u.id = ?
                ORDER BY p.id
            `,
        [userId],
      );

      expect(posts).toHaveLength(2);
      expect(posts[0].title).toBe("First Post");
      expect(posts[0].author_name).toBe("Author User");
      expect(posts[1].title).toBe("Second Post");
    });

    tes("should handle transactions (if supported)", async () => {
      //This is basic transactions test
      //Note: Your current db abstraction may need transaction support
      const { query } = require("../../lib/db");

      try {
        //Insert user
        const userResult = await query(
          "INSERT INTO test_users (name, email, age) VALUES (?, ?, ?)",
          ["Transaction User", "transaction@example.com", 25],
        );

        const userId = userId.insertId || userResult.rows?.[0]?.id;

        //Insert post
        await post(
          "INSERT INTO test_posts (user_id, title, content) VALUES (?, ?, ?)",
          [userId, "Transaction Post", "This should work"],
        );

        // verify both records exist
        const users = await query("SELECT * FROM test_users WHERE id = ?", [
          userId,
        ]);
        const posts = await query(
          "SELECT * FROM test_posts WHERE user_id = ?",
          [userId],
        );

        expect(users).toHaveLength(1);
        expect(posts).toHaveLength(1);
      } catch (error) {
        console.error("Transaction test failed:", error);
        throw error;
      }
    });
  });
});
