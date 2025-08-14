"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { createRequire } = require("module");

// Channel switch:
//   DEV (default): installs swipjy from GitHub main
//   STABLE: installs from npm (version uses SWIPJY_VERSION or 1.0.27)
// Usage example:
//   SWIPJY_CHANNEL=stable SWIPJY_VERSION=1.0.27 npx swipjy create my-app
const CHANNEL = (process.env.SWIPJY_CHANNEL || "dev").toLowerCase();
const SWIPJY_DEP =
  CHANNEL === "stable"
    ? process.env.SWIPJY_VERSION
      ? `^${process.env.SWIPJY_VERSION}`
      : "^1.0.27"
    : "github:joss12/SwipJy#main";

// ------------------------------
// Templates
// ------------------------------
function appTemplate() {
  return `const http = require("http");
const Swipjy = require("swipjy");

const app = new Swipjy();

// Optional: router if your package re-exports it; fallback path otherwise
const createRouter = Swipjy.createRouter || (() => {
  try { return require("swipjy/lib/router.js").createRouter; } catch { return null; }
})();

if (createRouter) {
  const router = createRouter(app);
  if (typeof Swipjy.bootstrap === "function") {
    Swipjy.bootstrap(app, router);
  } else {
    router.get("/", (ctx) => ctx.send("Hello, Swipjy!"));
    app.use(router.routes());
  }
} else {
  app.use((ctx) => ctx.send("Hello, Swipjy (no router)!"));
}

const port = process.env.PORT || 3000;
const server = http.createServer(
  app.handle || app.handler || app.callback || ((req, res) => app.serve(req, res))
);

server.listen(port, () => {
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

// package.json written into the generated app
function packageJsonTemplate(name) {
  return JSON.stringify(
    {
      name,
      version: "0.1.0",
      main: "app.js",
      type: "commonjs",
      scripts: {
        start: "node app.js",
        "build:client":
          "esbuild views/home.hydrate.jsx --bundle --format=esm --outfile=public/home.bundle.js",
      },
      dependencies: {
        swipjy: SWIPJY_DEP,
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
      devDependencies: {
        esbuild: "^0.21.4",
      },
      engines: {
        node: ">=18.0.0",
      },
    },
    null,
    2,
  );
}

// ------------------------------
// Create Command
// ------------------------------
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

  try {
    console.log("📦 Installing dependencies...");
    // IMPORTANT: Single plain install; do NOT force git/tarball
    execSync("npm install", { stdio: "inherit", cwd: projectPath });

    // Verify swipjy is resolvable FROM THE PROJECT (not from the CLI)
    const projectRequire = createRequire(path.join(projectPath, "app.js"));
    projectRequire.resolve("swipjy");

    // Build client bundle using the project's esbuild
    console.log("⚙️  Building client bundle...");
    execSync("npm run build:client", { stdio: "inherit", cwd: projectPath });
  } catch (err) {
    console.error("❌ Failed during setup:", err.message || err);
    process.exit(1);
  }

  console.log(`\n✅ Project "${projectName}" created!\n`);
  console.log(`👉 Next steps:
  cd ${projectName}
  npm start
`);
}

module.exports = create;
