const Swipjy = require("swipjy");
const { serveStatic } = require("swipjy");
const app = new Swipjy();

// Use the instance method for static files
//app.useStatic("public");
app.use(serveStatic("public"));

app.get("/", (req, res) => {
    res.render("home", { name: "Swipjy" });
});

app.listen(3000, () => {
    console.log("🚀 Swipjy running at http://localhost:3000");
});
