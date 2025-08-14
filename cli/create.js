const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ------------------------------
// Templates
// ------------------------------
function appTemplate() {
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

// If you want to force GitHub for generated apps, run with SWIPJY_GIT=1
function packageJsonTemplate(name) {
  const fromGit = !!process.env.SWIPJY_GIT;
  const swipjyDep = fromGit
    ? "git+https://github.com/joss12/SwipJy.git"
    : "latest";

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
        swipjy: swipjyDep,
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
      devDependencies: {
        esbuild: "^0.21.4",
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

  // Step into project
  process.chdir(projectPath);

  // Prefer local tarball if provided (for dev without publishing)
  const localTarball = process.env.SWIPJY_TARBALL
    ? path.resolve(process.env.SWIPJY_TARBALL)
    : null;

  try {
    console.log("📦 Installing dependencies...");

    // Ensure swipjy gets installed so the app runs after generation
    if (localTarball && fs.existsSync(localTarball)) {
      console.log(`➡️  Using local tarball: ${localTarball}`);
      execSync(`npm install "${localTarball}"`, { stdio: "inherit" });
    } else {
      try {
        console.log("➡️  Installing swipjy@latest from npm…");
        execSync("npm install swipjy@latest", { stdio: "inherit" });
      } catch {
        console.log(
          "⚠️  npm install swipjy@latest failed. Falling back to GitHub…",
        );
        execSync("npm install git+https://github.com/joss12/SwipJy.git", {
          stdio: "inherit",
        });
      }
    }

    // Install the rest (react, react-dom, esbuild)
    execSync("npm install", { stdio: "inherit" });

    // Verify swipjy is actually installed; if not, install from GitHub as fallback
    try {
      require.resolve("swipjy");
    } catch {
      console.log(
        "⚠️  'swipjy' not found locally. Installing from GitHub fallback…",
      );
      execSync("npm install git+https://github.com/joss12/SwipJy.git", {
        stdio: "inherit",
      });
    }

    // Build the client bundle using the project's own esbuild
    console.log("⚙️  Building client bundle...");
    execSync("npm run build:client", { stdio: "inherit" });
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
