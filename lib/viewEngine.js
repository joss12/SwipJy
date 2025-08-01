// lib/viewEngine.js
const fs = require("fs");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const esbuild = require("esbuild");

// Cache for compiled components
const componentCache = new Map();

function render(viewName, data = {}) {
    console.log(`🔧 Rendering view: ${viewName} with data:`, data);

    // Try to load JSX file first, fallback to hardcoded component
    let Component;

    try {
        Component = loadJSXComponent(viewName);
        console.log(`✅ Loaded JSX component: ${viewName}`);
    } catch (error) {
        console.warn(
            `⚠️  Could not load JSX file for ${viewName}: ${error.message}`,
        );
        console.log(`🔄 Using fallback component for ${viewName}`);
        Component = getFallbackComponent(viewName);
    }

    if (typeof Component !== "function") {
        throw new Error(
            `Expected React component function, got: ${typeof Component}`,
        );
    }

    // Sanitize props
    const sanitizedData = sanitizeProps(data);

    // Create and render element
    const element = React.createElement(Component, sanitizedData);
    const html = ReactDOMServer.renderToStaticMarkup(element);

    return "<!DOCTYPE html>" + html;
}

function loadJSXComponent(viewName) {
    const viewPath = path.join(process.cwd(), "views", `${viewName}.jsx`);

    if (!fs.existsSync(viewPath)) {
        throw new Error(`View file not found: ${viewPath}`);
    }

    // Check cache first
    const stats = fs.statSync(viewPath);
    const cacheKey = `${viewPath}:${stats.mtime.getTime()}`;

    if (componentCache.has(cacheKey)) {
        return componentCache.get(cacheKey);
    }

    // Clear old cache entries for this file
    for (const key of componentCache.keys()) {
        if (key.startsWith(viewPath + ":")) {
            componentCache.delete(key);
        }
    }

    // Read the file content - NO React injection!
    let fileContent = fs.readFileSync(viewPath, "utf8");

    if (!fileContent || fileContent.trim().length === 0) {
        throw new Error(`View file is empty: ${viewPath}`);
    }

    console.log(`📄 Original file content (${fileContent.length} chars)`);

    // Only transform exports, don't touch React imports
    fileContent = transformExports(fileContent);

    console.log(`🔧 Prepared content for compilation (no React injection)`);

    // Compile with esbuild - it will create React.createElement calls
    let result;
    try {
        result = esbuild.transformSync(fileContent, {
            jsx: "transform",
            jsxFactory: "React.createElement",
            jsxFragment: "React.Fragment",
            loader: "jsx",
            format: "cjs",
            target: "node14",
            sourcemap: false,
        });
    } catch (esbuildError) {
        throw new Error(`ESBuild compilation failed: ${esbuildError.message}`);
    }

    console.log(`✅ ESBuild compiled successfully for ${viewName}`);

    // Execute with React provided through context
    const Component = executeWithReactContext(result.code, viewPath, viewName);

    // Cache the component
    componentCache.set(cacheKey, Component);

    return Component;
}

function transformExports(content) {
    // Only handle export transformations, don't touch React

    // export default ComponentName;
    content = content.replace(
        /export\s+default\s+(\w+)\s*;?\s*$/gm,
        "module.exports = $1;",
    );

    // export default function ComponentName() { ... }
    if (content.includes("export default function")) {
        content = content.replace(
            /export\s+default\s+function\s+(\w+)/g,
            "function $1",
        );

        // Find the function name and add module.exports
        const functionMatch = content.match(/function\s+(\w+)/);
        if (functionMatch) {
            content += `\nmodule.exports = ${functionMatch[1]};`;
        }
    }

    // export { ComponentName as default };
    content = content.replace(
        /export\s*{\s*(\w+)\s+as\s+default\s*}\s*;?\s*$/gm,
        "module.exports = $1;",
    );

    return content;
}

function executeWithReactContext(compiledCode, filePath, viewName) {
    try {
        console.log(`🚀 Executing with React context for ${viewName}...`);

        // Create execution context with React available
        const context = {
            module: { exports: {} },
            exports: {},
            require: require,
            console: console,
            __filename: filePath,
            __dirname: path.dirname(filePath),
            global: global,
            process: process,
            // Provide React through context
            React: React,
        };

        // Extract parameter names and values
        const paramNames = Object.keys(context);
        const paramValues = Object.values(context);

        // Execute the compiled code with React in scope
        const execFunction = new Function(
            ...paramNames,
            compiledCode + "\nreturn module.exports;",
        );
        const result = execFunction(...paramValues);

        console.log(`✅ Code executed successfully for ${viewName}`);

        // Extract the component
        const Component = result.default || result;

        if (typeof Component !== "function") {
            throw new Error(`Component is not a function, got: ${typeof Component}`);
        }

        return Component;
    } catch (error) {
        console.error(`❌ Execution error for ${viewName}:`, error.message);

        // Check for specific error types and provide helpful messages
        if (error.message.includes("React is not defined")) {
            throw new Error(
                `React is not available in component context. This is a framework bug.`,
            );
        }

        if (
            error.message.includes("Identifier") &&
            error.message.includes("already been declared")
        ) {
            throw new Error(
                `Variable declaration conflict in JSX compilation. Try using different variable names.`,
            );
        }

        throw new Error(`Failed to execute compiled JSX: ${error.message}`);
    }
}

function getFallbackComponent(viewName) {
    switch (viewName) {
        case "home":
            return function Home(props) {
                return React.createElement(
                    "html",
                    null,
                    React.createElement(
                        "head",
                        null,
                        React.createElement("title", null, "Swipjy"),
                        React.createElement("script", {
                            type: "module",
                            src: "/home.bundle.js",
                        }),
                    ),
                    React.createElement(
                        "body",
                        null,
                        React.createElement("h1", null, `Hello, ${props.name || "World"}!`),
                        React.createElement("p", null, "Welcome to Swipjy! 🚀"),
                        React.createElement(
                            "p",
                            null,
                            `Create or fix your views/${viewName}.jsx file to customize this page.`,
                        ),
                        React.createElement("div", { id: "root" }),
                    ),
                );
            };

        default:
            return function DefaultView(props) {
                return React.createElement(
                    "html",
                    null,
                    React.createElement(
                        "head",
                        null,
                        React.createElement("title", null, `${viewName} - Swipjy`),
                    ),
                    React.createElement(
                        "body",
                        null,
                        React.createElement("h1", null, `${viewName} page`),
                        React.createElement(
                            "p",
                            null,
                            `Create a views/${viewName}.jsx file to customize this page.`,
                        ),
                        React.createElement("div", { id: "root" }),
                    ),
                );
            };
    }
}

function sanitizeProps(props) {
    const sanitized = {};

    for (const [key, value] of Object.entries(props)) {
        if (value && typeof value === "object" && value.$$typeof) {
            console.warn(
                `⚠️  Swipjy: Prop "${key}" contains a React element, converting to string`,
            );
            sanitized[key] = "[ReactElement]";
        } else if (typeof value === "function") {
            console.warn(`⚠️  Swipjy: Prop "${key}" contains a function, skipping`);
        } else if (typeof value === "object" && value !== null) {
            try {
                JSON.stringify(value);
                sanitized[key] = value;
            } catch (error) {
                console.warn(
                    `⚠️  Swipjy: Prop "${key}" contains circular reference, converting to string`,
                );
                sanitized[key] = String(value);
            }
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

module.exports = { render };
