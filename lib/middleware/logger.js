"use strict";

let chalk;
try {
    chalk = require("chalk"); // optional dependency
} catch (_) {
    chalk = null;
}

const c = chalk
    ? {
        dim: chalk.dim,
        green: chalk.green,
        yellow: chalk.yellow,
        red: chalk.red,
        cyan: chalk.cyan,
    }
    : {
        dim: (s) => s,
        green: (s) => s,
        yellow: (s) => s,
        red: (s) => s,
        cyan: (s) => s,
    };

function logger() {
    return function swipjyLogger(ctx, next) {
        const t0 = process.hrtime.bigint();
        return Promise.resolve()
            .then(next)
            .then(function() {
                const t1 = process.hrtime.bigint();
                const ms = Number(t1 - t0) / 1e6;
                const status = ctx.status || 200;

                const line =
                    c.dim(new Date().toISOString()) +
                    " " +
                    (status >= 500
                        ? c.red(status)
                        : status >= 400
                            ? c.yellow(status)
                            : c.green(status)) +
                    " " +
                    (ctx.method || "GET") +
                    " " +
                    (ctx.url || ctx.path || "/") +
                    " " +
                    c.cyan(ms.toFixed(1) + "ms");

                const meta = {
                    id: ctx.id,
                    length:
                        typeof ctx.body === "string"
                            ? Buffer.byteLength(ctx.body)
                            : (ctx.body && ctx.body.length) || undefined,
                };

                if (meta.id) {
                    process.stdout.write(line + " " + c.dim("(id:" + meta.id + ")\n"));
                } else {
                    process.stdout.write(line + "\n");
                }
            });
    };
}

module.exports = logger;
