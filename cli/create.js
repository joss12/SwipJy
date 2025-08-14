const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const bundle = require("../cli/bundle"); // keep this if it's your bundler

function appTemplate() {
  // Uses bootstrap if Swipjy.bootstrap exists; falls back if not
  return `const http = require("http");
const Swipjy = require("swipjy");

const app = new Swipjy();

// Optional: router if your package re-exports it; fallback path otherwise
const createRouter = Swipjy.createRouter || (() => {
  try { return require("swipjy/lib/router.js"); } catch { return null; }
})();

if (Swipjy.bootstrap && createRouter) {
  const router = createRouter(app);
  Swipjy.bootstrap(app, router); // wires middleware + /echo + /healthz
} else {
  // Classic style: static + a simple route
  app.useStatic && app.useStatic("public");
  require("./routes/home")(app);
}

const port = process.env.PORT || 3000;
const server = http.createServer(app.handle || app.handler || app.callback || ((req, res) => app.serve(req, res)));

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

function packageJsonTemplate(name) {
  // Use latest to avoid ETARGET; local tarball override handled during install
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
        swipjy: "latest",
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
    },
    null,
    2,
  );
}

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

  // Prefer local tarball if provided (for dev without publishing)
  const localTarball = process.env.SWIPJY_TARBALL
    ? path.resolve(process.env.SWIPJY_TARBALL)
    : null;

  try {
    console.log("📦 Installing dependencies...");
    if (localTarball && fs.existsSync(localTarball)) {
      // Install the local tarball first; it overrides "latest" in package.json
      execSync(`npm install "${localTarball}"`, { stdio: "inherit" });
      // Then install the rest (react, react-dom are already in package.json)
      execSync("npm install", { stdio: "inherit" });
    } else {
      // Normal path: install everything from package.json
      execSync("npm install", { stdio: "inherit" });
    }

    console.log("⚙️  Bundling hydration file...");
    await bundle(["view", "home"]);
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
