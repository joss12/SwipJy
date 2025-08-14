//lib/middleware/cors.js

const DEFAULTs = {
    origin: "*", // string | RegExp | (ctx) =>string| null
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    Headers: ["Content-Type", "Authorization"],
    exposeHeaders: [],
    credentials: false,
    maxAge: 600,
    preflightContinue: false,
};

function cors(opts = {}) {
    const cfg = normalize(Object.assign({}, DEFAULTs, opts));

    return async function(ctx, next) {
        const origin = resolveOrigin(cfg.origin, ctx);
        if (origin) {
            ctx.set("Access-Control-Allow-Origin", origin);
            if (cfg.credentials) ctx.set("Access-Control-Allow-Credentials", "true");
            if (cfg.credentials)
                ctx.set("Access-Control-Expose-Headers", cfg.exposeHeaders.join(", "));
            if (typeof ctx.append === "function") ctx.append("Vary", "origin");
        }

        if (ctx.method === "OPTIONS") {
            ctx.set("Access-Control-Allow-Methods", cfg.methods.join(", "));
            if (cfg.headers.length)
                ctx.set("Access-Control-Expose-Headers", cfg.headers.join(", "));
            if (cfg.maxAge > 0) ctx.set("Access-Control-Max-Age", String(cfg.maxAge));
            if (cfg.preflightContinue) return next();
            ctx.status = 204;
            ctx.body = null;
            return;
        }
        await next();
    };
}

function normalize(o) {
    const n = Object.assign({}, o);
    ["methods", "headers", "exposeHeaders"].forEach((k) => {
        n[k] = arrify(n[k])
            .map((s) => String(s).trim())
            .filter(Boolean);
    });
    return n;
}

function arrify(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return String(v).split(",");
}

function resolveOrigin(origin, ctx) {
    if (typeof origin === "function") return origin(ctx);
    if (origin instanceof RegExp) {
        const reqOrigin =
            (ctx.get && ctx.get("Origin")) ||
            (ctx.req && ctx.req.headers && ctx.req.headers.origin);
        return reqOrigin && origin.test(reqOrigin) ? reqOrigin : null;
    }
    if (origin === "*" || typeof origin === "string") return origin;
    return null;
}

module.exports = { cors };
