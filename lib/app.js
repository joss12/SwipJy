"use strict";

const http = require("node:http");

// Minimal Koa-style compose
function compose(middleware) {
  return function run(ctx) {
    let index = -1;
    function dispatch(i) {
      if (i <= index)
        return Promise.reject(new Error("next() called multiple times"));
      index = i;
      const fn = middleware[i];
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(
          fn(ctx, function next() {
            return dispatch(i + 1);
          }),
        );
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0);
  };
}

// Build a minimal ctx for handlers/middleware
function createCtx(req, res) {
  const urlObj = new URL(req.url || "/", "http://localhost");

  const ctx = {
    req,
    res,
    method: req.method,
    url: req.url,
    path: urlObj.pathname,
    query: Object.fromEntries(urlObj.searchParams),
    status: 200,
    body: null,

    set(name, value) {
      res.setHeader(name, value);
    },
    get(name) {
      return req.headers[String(name).toLowerCase()];
    },

    json(obj, status) {
      if (status) ctx.status = status;
      if (!res.headersSent)
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      ctx.body = obj;
    },

    send(payload, status) {
      if (status) ctx.status = status;
      if (
        payload != null &&
        typeof payload === "object" &&
        !Buffer.isBuffer(payload)
      ) {
        if (!res.headersSent)
          res.setHeader("Content-Type", "application/json; charset=utf-8");
        ctx.body = payload;
      } else {
        ctx.body = payload;
      }
    },
  };

  return ctx;
}

// PUBLIC FACTORY
function createApp() {
  const mws = [];
  const run = compose(mws);

  const server = http.createServer(async (req, res) => {
    const ctx = createCtx(req, res);

    try {
      await run(ctx);

      if (res.writableEnded) return;

      if (ctx.body != null) {
        res.statusCode = ctx.status || res.statusCode || 200;

        if (Buffer.isBuffer(ctx.body)) return res.end(ctx.body);
        if (typeof ctx.body === "string") return res.end(ctx.body);

        if (!res.headersSent)
          res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.end(JSON.stringify(ctx.body));
      }

      // No body set -> 404 JSON
      res.statusCode = ctx.status || 404;
      if (!res.headersSent)
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Not Found" }));
    } catch (err) {
      if (!res.headersSent)
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.statusCode = err.status || 500;
      res.end(JSON.stringify({ error: err.message || "Internal Error" }));
    }
  });

  const app = {
    use(fn) {
      mws.push(fn);
      return app;
    },
    listen(port, cb) {
      return server.listen(port, cb);
    },
    server,
  };

  return app;
}

module.exports = { createApp };
