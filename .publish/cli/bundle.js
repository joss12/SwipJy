// commands/bundle.js
const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

module.exports = async function bundle(args) {
    const [type, name] = args;

    if (type !== "view" || !name) {
        console.error("❌ Usage: swipjy bundle view <viewName>");
        process.exit(1);
    }

    const entryPath = path.join(process.cwd(), "views", `${name}.hydrate.jsx`);
    const outFile = path.join(process.cwd(), "public", `${name}.bundle.js`);

    if (!fs.existsSync(entryPath)) {
        console.error(`❌ Entry file not found: ${entryPath}`);
        process.exit(1);
    }

    try {
        await esbuild.build({
            entryPoints: [entryPath],
            bundle: true,
            outfile: outFile,
            platform: "browser",
            format: "esm",
            minify: true,
        });

        console.log(`✅ Hydration bundle created: public/${name}.bundle.js`);
    } catch (err) {
        console.error("❌ Bundling error:", err.message);
    }
};
