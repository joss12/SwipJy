// lib/bodyParser.js

function bodyParser(req, res, next) {
    const method = req.method.toUpperCase();

    // Only parse POST, PUT, PATCH requests
    if (!["POST", "PUT", "PATCH"].includes(method)) {
        return next();
    }

    let body = "";

    req.on("data", (chunk) => {
        body += chunk.toString();
    });

    req.on("end", () => {
        const contentType = req.headers["content-type"];

        try {
            if (contentType === "application/json") {
                req.body = JSON.parse(body);
            } else if (contentType === "application/x-www-form-urlencoded") {
                req.body = parseFormEncoded(body);
            } else {
                req.body = {}; // unknown content type
            }
        } catch (err) {
            req.body = {}; // fallback on bad JSON
        }

        next(); // continue with parsed body
    });
}

function parseFormEncoded(str) {
    return str.split("&").reduce((acc, pair) => {
        const [key, value] = pair.split("=");
        acc[decodeURIComponent(key)] = decodeURIComponent(value || "");
        return acc;
    }, {});
}

module.exports = { bodyParser };
