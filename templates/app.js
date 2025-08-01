const Swipjy = require("swipjy");
const app = new Swipjy();

// Now this should work!
app.use(Swipjy.serveStatic("public"));

app.get("/", (req, res) => {
    res.render("home", { name: "Swipjy" });
});

app.listen(3000, () => {
    console.log("🚀 Swipjy running at http://localhost:3000");
});
