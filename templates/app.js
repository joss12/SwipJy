// app.js
const { createApp, createRouter } = require("swipjy");

const app = createApp(); // ✅ create an app instance
const router = createRouter();

// mount routes
router.get("/", (ctx) => {
  ctx.send("Hello from Swipjy");
});

// attach router to app depending on your framework API
app.use(router.routes());

// start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
