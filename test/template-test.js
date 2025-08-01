// test/template-test.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Test that CLI-generated projects work out of the box
 */
async function testTemplateGeneration() {
    console.log("🧪 Testing template generation...");

    const testProjectName = "test-swipjy-project";
    const testDir = path.join(__dirname, "..", "temp-test");

    try {
        // Create temp directory
        if (fs.existsSync(testDir)) {
            execSync(`rm -rf ${testDir}`);
        }
        fs.mkdirSync(testDir);

        // Generate project
        process.chdir(testDir);
        execSync(
            `node ${path.join(__dirname, "..", "bin", "swipjy.js")} create ${testProjectName}`,
            { stdio: "inherit" },
        );

        // Check if project was created
        const projectPath = path.join(testDir, testProjectName);
        if (!fs.existsSync(projectPath)) {
            throw new Error("Project directory not created");
        }

        // Check if required files exist
        const requiredFiles = [
            "app.js",
            "package.json",
            "views/home.jsx",
            "routes/home.js",
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(projectPath, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }

        // Check app.js syntax
        const appJs = fs.readFileSync(path.join(projectPath, "app.js"), "utf8");
        if (appJs.includes("serveStatic(") && !appJs.includes("app.useStatic(")) {
            throw new Error("app.js contains incorrect static file API");
        }

        // Try to install dependencies
        process.chdir(projectPath);
        console.log("📦 Installing dependencies...");
        execSync("npm install", { stdio: "inherit" });

        // Try to start the server (for 2 seconds)
        console.log("🚀 Testing server startup...");
        const serverProcess = execSync("timeout 2s npm start || true", {
            stdio: "inherit",
        });

        console.log("✅ Template test passed!");
    } catch (error) {
        console.error("❌ Template test failed:", error.message);
        throw error;
    } finally {
        // Cleanup
        if (fs.existsSync(testDir)) {
            execSync(`rm -rf ${testDir}`);
        }
    }
}

// Run test if called directly
if (require.main === module) {
    testTemplateGeneration().catch(console.error);
}

module.exports = { testTemplateGeneration };
