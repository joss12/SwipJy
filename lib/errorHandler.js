// lib/errors.js

// Middleware for 404 - route not matched
function notFound(req, res, next) {
    res.status(404).send("404 Not Found: The requested route does not exist.");
}

// Middleware for 500 - errors thrown in routes or middleware
function errorHandler(err, req, res, next) {
    console.error("🚨 Internal Error:", err.stack || err);
    res.status(500).send("500 Internal Server Error: Something went wrong.");
}

module.exports = { notFound, errorHandler };
