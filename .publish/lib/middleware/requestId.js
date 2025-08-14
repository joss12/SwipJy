function requesteId(header = "x-request-id") {
    return async function(ctx, next) {
        const incoming =
            (ctx.get && ctx.get(header)) ||
            (ctx.req && ctx.req.headers && ctx.req.headers[header]);
        const id = incoming || gen();
        ctx.id = id;
        ctx.set(header, id);
        await next();
    };
}

function gen() {
    const rnd = Math.random().toString(16).slice(2);
    return Date.now().toString(36) + "-" + rnd;
}

module.exports = { requesteId };
