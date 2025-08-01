const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const bundle = require("../cli/bundle"); // Make sure this path is correct

async function create([projectName]) {
    if (!projectName) {
        console.error("❌ Usage: swipjy create <project-name>");
        process.exit(1);
    }

    const projectPath = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
        console.error(`❌ Folder "${projectName}" already exists.`);
        process.exit(1);
    }

    // Create folders
    fs.mkdirSync(projectPath);
    fs.mkdirSync(path.join(projectPath, "routes"));
    fs.mkdirSync(path.join(projectPath, "views"));
    fs.mkdirSync(path.join(projectPath, "public"));

    // Create files
    fs.writeFileSync(path.join(projectPath, "app.js"), appTemplate());
    fs.writeFileSync(
        path.join(projectPath, "routes", "home.js"),
        routeTemplate(),
    );
    fs.writeFileSync(path.join(projectPath, "views", "home.jsx"), viewTemplate());
    fs.writeFileSync(
        path.join(projectPath, "views", "home.hydrate.jsx"),
        hydrateTemplate(),
    );
    fs.writeFileSync(
        path.join(projectPath, "package.json"),
        packageJsonTemplate(projectName),
    );
    fs.writeFileSync(path.join(projectPath, ".env"), envTemplate());

    // Step into project
    process.chdir(projectPath);

    try {
        console.log("📦 Installing dependencies...");
        execSync("npm install", { stdio: "inherit" });
        execSync("npm install react react-dom", { stdio: "inherit" });

        console.log("⚙️  Bundling hydration file...");
        await bundle(["view", "home"]);
    } catch (err) {
        console.error("❌ Failed during setup:", err.message);
        process.exit(1);
    }

    console.log(`\n✅ Project "${projectName}" created!\n`);
    console.log(`👉 Next steps:
  cd ${projectName}
  npm start`);
}

// ------------------------------------
// 🔧 TEMPLATES BELOW
// ------------------------------------

function appTemplate() {
    return `const Swipjy = require("swipjy");
const app = new Swipjy();

// Static file serving
app.useStatic("public");

require("./routes/home")(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("🚀 Swipjy running at http://localhost:" + port);
});`;
}

function routeTemplate() {
    return `module.exports = (app) => {
  app.get("/", (req, res) => {
    res.render("home", { name: "Swipjy" });
  });
};`;
}

function viewTemplate() {
    return `function Home(props) {
  return (
    <html>
      <head>
        <title>Swipjy</title>
        <script type="module" src="/home.bundle.js"></script>
      </head>
      <body>
        <h1>Hello, {props.name}!</h1>
        <div id="root"></div>
      </body>
    </html>
  );
}

export default Home;`;
}

function hydrateTemplate() {
    return `import React from "react";
import { createRoot } from "react-dom/client";

function HomeHydrate() {
  return <p>Hydrated on the client side! 🧠</p>;
}

const root = createRoot(document.getElementById("root"));
root.render(<HomeHydrate />);`;
}

function envTemplate() {
    return `# Default Swipjy Environment
PORT=3000
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=swipjy_db
`;
}

function packageJsonTemplate(name) {
    return JSON.stringify(
        {
            name,
            version: "0.1.0",
            main: "app.js",
            type: "commonjs",
            scripts: {
                start: "node app.js",
            },
            dependencies: {
                swipjy: "*",
            },
        },
        null,
        2,
    );
}

module.exports = create;
