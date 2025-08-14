// CommonJS CORS middleware (no deps).
// Usage:
//   const cors = require('./middleware/cors');
//   app.use(cors({ origin: '*', methods: ['GET','POST','OPTIONS'], headers: ['Content-Type'], maxAge: 600 }));

var DEFAULTS = {
    origin: "*", // string | RegExp | (ctx) => string|null
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    headers: ["Content-Type", "Authorization"],
    exposeHeaders: [],
    credentials: false,
    maxAge: 600,
    preflightContinue: false,
};

function cors(opts) {
    var cfg = normalize(merge(DEFAULTS, opts || {}));

    return function corsMiddleware(ctx, next) {
        var origin = resolveOrigin(cfg.origin, ctx);
        if (origin) {
            setHeader(ctx, "Access-Control-Allow-Origin", origin);
            if (cfg.credentials)
                setHeader(ctx, "Access-Control-Allow-Credentials", "true");
            if (cfg.exposeHeaders.length) {
                setHeader(
                    ctx,
                    "Access-Control-Expose-Headers",
                    cfg.exposeHeaders.join(", "),
                );
            }
            appendVary(ctx, "Origin");
        }

        if ((ctx.method || "").toUpperCase() === "OPTIONS") {
            setHeader(ctx, "Access-Control-Allow-Methods", cfg.methods.join(", "));
            if (cfg.headers.length)
                setHeader(ctx, "Access-Control-Allow-Headers", cfg.headers.join(", "));
            if (cfg.maxAge > 0)
                setHeader(ctx, "Access-Control-Max-Age", String(cfg.maxAge));

            if (cfg.preflightContinue) return next();
            ctx.status = 204;
            ctx.body = null;
            return Promise.resolve();
        }

        return next();
    };
}

/* ----------------------- helpers ----------------------- */

function merge(a, b) {
    var out = {};
    for (var k in a) out[k] = a[k];
    for (var k2 in b) out[k2] = b[k2];
    return out;
}

function normalize(o) {
    var n = merge({}, o);
    n.methods = arrify(n.methods);
    n.headers = arrify(n.headers);
    n.exposeHeaders = arrify(n.exposeHeaders);
    return n;
}

function arrify(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(toStr).map(trim).filter(Boolean);
    return String(v).split(",").map(trim).filter(Boolean);
}

function toStr(x) {
    return String(x);
}
function trim(s) {
    return String(s || "").trim();
}

function resolveOrigin(origin, ctx) {
    if (typeof origin === "function") return origin(ctx);
    if (origin && origin instanceof RegExp) {
        var reqOrigin = getHeader(ctx, "Origin");
        return reqOrigin && origin.test(reqOrigin) ? reqOrigin : null;
    }
    if (origin === "*" || typeof origin === "string") return origin;
    return null;
}

function setHeader(ctx, name, value) {
    if (ctx.set) return ctx.set(name, value);
    if (ctx.res && ctx.res.setHeader) ctx.res.setHeader(name, value);
}

function getHeader(ctx, name) {
    if (ctx.get) return ctx.get(name);
    if (ctx.req && ctx.req.headers) return ctx.req.headers[name.toLowerCase()];
    return undefined;
}

function appendVary(ctx, value) {
    // Best-effort: append to Vary without clobbering
    var existing =
        ctx.res && ctx.res.getHeader ? ctx.res.getHeader("Vary") : null;
    var nextVal = existing ? String(existing) + ", " + value : value;
    setHeader(ctx, "Vary", nextVal);
}

module.exports = cors;
