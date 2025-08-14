const Swipjy = require("swipjy");
const app = new Swipjy();

// Static file serving
app.useStatic("public");

app.get("/", (req, res) => {
    res.render("home", { name: "Swipjy" });
});

app.listen(3000, () => {
    console.log("🚀 Swipjy running at http://localhost:3000");
});
