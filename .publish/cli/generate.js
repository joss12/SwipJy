// commands/generate.js
// ---------------------
// Swipjy CLI: Generate Route or View
// ---------------------

const fs = require("fs");
const path = require("path");

function generate([type, name]) {
    if (!type || !name) {
        console.error("❌ Usage: swipjy generate <route|view> <name>");
        process.exit(1);
    }

    const fileName = `${name}.js`;
    const jsxName = `${name}.jsx`;

    if (type === "route") {
        const routesDir = path.join(process.cwd(), "routes");
        const filePath = path.join(routesDir, fileName);

        if (!fs.existsSync(routesDir)) fs.mkdirSync(routesDir);
        if (fs.existsSync(filePath)) {
            console.error(`❌ Route "${name}" already exists.`);
            process.exit(1);
        }

        fs.writeFileSync(filePath, routeTemplate(name));
        console.log(`✅ Route created: routes/${fileName}`);
    } else if (type === "view") {
        const viewsDir = path.join(process.cwd(), "views");
        const filePath = path.join(viewsDir, jsxName);

        if (!fs.existsSync(viewsDir)) fs.mkdirSync(viewsDir);
        if (fs.existsSync(filePath)) {
            console.error(`❌ View "${name}" already exists.`);
            process.exit(1);
        }

        fs.writeFileSync(filePath, viewTemplate(name));
        console.log(`✅ View created: views/${jsxName}`);
    } else {
        console.error(`❌ Unknown generate type: "${type}"`);
        process.exit(1);
    }
}

// ---------------------
// Templates
// ---------------------

function routeTemplate(name) {
    return `// routes/${name}.js
module.exports = (app) => {
  app.get('/${name}', (req, res) => {
    res.send('This is the ${name} route!');
  });
};
`;
}

function viewTemplate(name) {
    return `// views/${name}.jsx
function ${capitalize(name)}() {
  return (
    <html>
      <head><title>${name} view</title></head>
      <body>
        <h1>This is the ${name} view</h1>
      </body>
    </html>
  );
}

module.exports = ${capitalize(name)};
`;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = generate;
