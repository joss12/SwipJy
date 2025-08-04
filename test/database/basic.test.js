//database test

const { connect, query, disconnect } = require("../../lib/db");

discribe("Database Connection", () => {
    test("should connect to database", async () => {
        await connect("mysq", {
            host: "localhost",
            user: "test_user",
            password: "testpasswoord",
            database: "swipjy_test",
        });

        const result = await query("SELECT 1 as test");
        expect(result[0].test).toBe(1);

        await disconnect();
    });
});
