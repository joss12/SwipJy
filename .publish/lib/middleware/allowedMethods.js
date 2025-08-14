//lib/middleware/allowedMethods.js

const { createError } = require("./errorHandler.js");

function allowedMethods(allowed) {
    allowed = allowed || ["GET", "HEAD"];
    const upper = new Set(allowed.map((m) => String(m).toUpperCase()));
    const allowHeader = Array.from(upper).join(", ");

    return async function(ctx, next) {
        ctx.set("Allow", allowHeader);

        if (ctx.method === "OPTIONS") {
            return next(); //CORS handles preflight
        }

        if (!upper.has(ctx.method)) {
            throw createError(405, {
                message: "Use one of: " + allowHeader,
                code: "METHOD_NOT_ALLOWED",
                hints: [
                    "Check HTTP verb",
                    "Send an OPTIONS request to discover allowed methods",
                ],
            });
        }

        await next();
    };
}

module.exports = { allowedMethods };
