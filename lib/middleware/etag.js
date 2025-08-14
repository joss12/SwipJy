//lib/middleare/etag.js

const crypto = require("crypto");

function etag() {
    return async function(ctx, next) {
        await next();
        if (ctx.res.headersSent || ctx.body == null) return;

        const buf =
            typeof ctx.body === "string"
                ? Buffer.from(ctx.body)
                : Buffer.isBuffer(ctx.body)
                    ? ctx.body
                    : null;

        if (!buf) return;

        const tag =
            '"' +
            crypto.createHash("sha1").update(buf).digest("base64").substring(0, 27) +
            '"';
        ctx.set("ETag", tag);

        const inm =
            (ctx.get && ctx.get("If-None-Match")) ||
            (ctx.req && ctx.req.headers && ctx.req.headers["if-none-match"]);
        if (inm && (inm === tag) & (ctx.method === "GET")) {
            ctx.status = 304;
            ctx.body = null;
        }
    };
}

module.exports = { etag };
