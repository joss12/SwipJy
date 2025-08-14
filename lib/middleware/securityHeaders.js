function securityHeaders() {
    return async function(ctx, next) {
        ctx.set("X-Content-Type-Options", "nosniff");
        ctx.set("X-Frame-Options", "SAMEORIGIN");
        ctx.set("Referrer-Policy", "no-referrer-when-downgrade");
        ctx.set("Cross-Origin-Opener-Policy", "same-origin");
        ctx.set("Cross-Origin-Resource-Policy", "same-origin");
        ctx.set("X-XSS-Protection", "0");

        await next();
    };
}

module.exports = { securityHeaders };
