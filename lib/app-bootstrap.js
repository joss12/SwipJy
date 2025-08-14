// lib/app-bootstrap.js (CommonJS)

// Pull everything from the barrel so callers don't care about file paths
const {
  // errors & core
  errorHandler,
  requestId,
  logger,
  securityHeaders,
  cors,
  bodyParser,
  etag,
  compress,
  allowedMethods,
} = require("./middleware.js");

/**
 * Bootstraps a SwipJy app with built-in middleware and default routes.
 *
 * @param {Object} app    - SwipJy app instance (must support app.use(fn))
 * @param {Object} router - SwipJy router instance (supports use/get/post, etc.)
 * @returns {Object} app  - The same app instance, fully configured
 *
 * Usage (example):
 *   const { createApp } = require('./core');   // your app factory
 *   const { createRouter } = require('./router');
 *   const bootstrap = require('./app-bootstrap');
 *
 *   const app = createApp();
 *   const router = createRouter(app);
 *   bootstrap(app, router);
 *   app.listen(3000);
 */
function bootstrap(app, router) {
  // -----------------------------
  // 1) Safety & observability
  // -----------------------------
  app.use(errorHandler()); // must be first to catch downstream errors
  app.use(requestId()); // adds ctx.id and x-request-id
  app.use(logger()); // structured JSON logs per request
  app.use(securityHeaders()); // baseline security headers

  // -----------------------------
  // 2) Cross-origin policy
  // -----------------------------
  app.use(
    cors({
      origin: "*", // adjust as needed
      methods: ["GET", "POST", "OPTIONS"], // global default
      headers: ["Content-Type", "Authorization"],
      credentials: false,
      maxAge: 600, // preflight cached 10m
    }),
  );

  // -----------------------------
  // 3) Body parsing & caching
  // -----------------------------
  app.use(bodyParser({ jsonLimit: 1024 * 1024 })); // 1MB JSON limit
  app.use(etag()); // enables 304 with If-None-Match
  app.use(compress()); // gzip/br when acceptable & large enough

  // -----------------------------
  // 4) Default health endpoints
  // -----------------------------
  router.get("/healthz", function (ctx) {
    ctx.json({ ok: true, status: "healthy", time: new Date().toISOString() });
  });

  router.get("/readyz", function (ctx) {
    // TODO: add checks (DB, cache, queue) and set ready accordingly
    ctx.json({ ok: true, ready: true });
  });

  // -----------------------------
  // 5) Example /echo route
  // -----------------------------
  // Per-route CORS overrides (optional)
  router.use(
    "/echo",
    cors({
      methods: ["GET", "POST", "OPTIONS"],
      headers: ["Content-Type"],
      maxAge: 300,
    }),
  );

  // Enforce allowed methods and advertise Allow header
  router.use("/echo", allowedMethods(["GET", "POST", "OPTIONS"]));

  // GET /echo -> echoes query + params
  router.get("/echo", function (ctx) {
    ctx.json({
      ok: true,
      query: ctx.query || {},
      params: ctx.params || {},
    });
  });

  // POST /echo -> echoes parsed body + content type
  router.post("/echo", function (ctx) {
    const ct = (
      (ctx.get && ctx.get("Content-Type")) ||
      (ctx.req && ctx.req.headers && ctx.req.headers["content-type"]) ||
      ""
    ).split(";")[0];
    ctx.json({
      ok: true,
      contentType: ct,
      body: ctx.body == null ? null : ctx.body,
    });
  });

  // Done
  return app;
}

module.exports = bootstrap;
