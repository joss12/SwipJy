// lib/errorHandler.js
const chalk = require("chalk");

// Middleware for 404 - route not matched
function notFound(req, res, next) {
    const message = `404 Not Found: The route "${req.method} ${req.url}" does not exist.`;
    console.log(chalk.yellow(`⚠️  ${message}`));
    res.status(404).json({
        error: "Not Found",
        message: message,
        suggestions: [
            "Check if the route is defined in your app.js",
            "Verify the HTTP method (GET, POST, etc.)",
            "Check for typos in the URL path",
        ],
    });
}

// Middleware for 500 - errors thrown in routes or middleware
function errorHandler(err, req, res, next) {
    console.error(chalk.red("🚨 Swipjy Error:"), err.stack || err);

    // Provide helpful error messages based on error type
    let message = "Internal Server Error";
    let suggestions = [];

    if (err.message.includes("Cannot read prop")) {
        message = "Property access error - check if your data exists";
        suggestions = [
            "Check if the variable is defined before using it",
            "Use optional chaining: obj?.prop instead of obj.prop",
            "Verify data is passed correctly to your route",
        ];
    } else if (err.message.includes("is not a function")) {
        message = "Function call error - method does not exist";
        suggestions = [
            "Check if the function is imported correctly",
            "Verify the function name spelling",
            "Check the framework documentation for correct API usage",
        ];
    } else if (err.message.includes("ENOENT")) {
        message = "File not found error";
        suggestions = [
            "Check if the file path is correct",
            "Verify the file exists in your project",
            "Check file permissions",
        ];
    } else if (err.message.includes("JSX") || err.message.includes("React")) {
        message = "JSX/React rendering error";
        suggestions = [
            "Check your JSX syntax in view files",
            "Verify React components are exported correctly",
            "Check if props are passed correctly to components",
        ];
    }

    res.status(500).json({
        error: "Internal Server Error",
        message: message,
        suggestions: suggestions,
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
}

module.exports = { notFound, errorHandler };
