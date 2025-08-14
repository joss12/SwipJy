// lib/core.js

const http = require("http");
const fs = require("fs");
const path = require("path");

const { attachResponseHelpers } = require("./response");
const { runMiddleware } = require("./middleware");
const { matchRoute, allowedMethods } = require("./router");
const { render } = require("./viewEngine");

// ---------------------------------------------
// Optional imports with safe fallbacks
// ---------------------------------------------
function optionalRequire(p) {
  try {
    return require(p);
  } catch {
    return null;
  }
}

// Try multiple locations / styles for error + logger
const errModA = optionalRequire("./middleware/errorHandler"); // new path
const errModB = optionalRequire("./errorHandler"); // legacy shim (if you add it)
const logModA = optionalRequire("./middleware/logger"); // new path
const logModB = optionalRequire("./logger"); // legacy shim

// Normalize: get a function we can call as errorHandler(err, req, res)
const errorHandler =
  (errModA &&
    typeof errModA.errorHandler === "function" &&
    errModA.errorHandler) ||
  (errModB &&
    typeof errModB.errorHandler === "function" &&
    errModB.errorHandler) ||
  // Fallback JSON formatter (never throw; always end the response)
  function defaultErrorHandler(err, req, res) {
    const status = (err && (err.status || err.statusCode)) || 500;
    const code =
      (err && err.code) || (status >= 500 ? "INTERNAL_ERROR" : "ERROR");
    const body = {
      error:
        err && err.message
          ? err.message
          : status >= 500
            ? "Internal Server Error"
            : "Error",
      code,
      message: err && err.message ? err.message : undefined,
    };
    try {
      if (!res.headersSent) {
        res.statusCode = status;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
      res.end(JSON.stringify(body));
    } catch {
      // last resort
      try {
        res.end();
      } catch {}
    }
  };

// Normalize: get a function we can call as logRequest(req, res, status, ms)
const logRequest =
  (logModA && typeof logModA.logRequest === "function" && logModA.logRequest) ||
  (logModB && typeof logModB.logRequest === "function" && logModB.logRequest) ||
  // Fallback basic logger
  function defaultLogRequest(req, res, status, ms) {
    try {
      const line = {
        time: new Date().toISOString(),
        method: req.method,
        url: req.url,
        status,
        ms: Number(ms).toFixed(1),
      };
      console.log(JSON.stringify(line));
    } catch {
      // ignore logging errors
    }
  };

// ---------------------------------------------
// Core class
// ---------------------------------------------
class Swipjy {
  constructor() {
    this.routes = [];
    this.middlewares = [];
    this.staticDir = null;

    this.server = http.createServer(async (req, res) => {
      const startTime = Date.now();
      attachResponseHelpers(res);

      // Parse URL once; attach query + params
      try {
        const parsed = new URL(req.url, "http://localhost");
        req.query = Object.fromEntries(parsed.searchParams.entries());
      } catch {
        req.query = {};
      }
      req.params = {};

      // View engine helper
      res.render = (viewName, data = {}) => {
        try {
          const html = render(viewName, data);
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
        } catch (err) {
          console.error("🛑 View render failed:", err);
          res.statusCode = 500;
          res.end("🚨 View render error: " + err.message);
        }
      };

      try {
        // Serve static files (GET only)
        if (this.staticDir && req.method === "GET") {
          const staticPath = path.join(process.cwd(), this.staticDir, req.url);
          if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
            const stream = fs.createReadStream(staticPath);
            res.writeHead(200);
            stream.pipe(res);
            return;
          }
        }

        // Run global middlewares
        await runMiddleware(req, res, this.middlewares, (err) => {
          if (err) throw err; // support next(err)
        });

        // OPTIONS auto-response (Allow + basic CORS)
        if (req.method === "OPTIONS") {
          const allow = allowedMethods(req.url, this.routes) || [];
          const allowHeader = [...new Set([...allow, "OPTIONS"])].join(", ");
          res.setHeader("Allow", allowHeader);
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", allowHeader);
          res.setHeader(
            "Access-Control-Allow-Headers",
            req.headers["access-control-request-headers"] || "Content-Type",
          );
          return res.status(204).send("");
        }

        // Route match
        const match = matchRoute(req.method, req.url, this.routes);

        if (!match) {
          const allow = allowedMethods(req.url, this.routes) || [];
          if (allow.length) {
            const allowHeader = [...new Set([...allow, "OPTIONS"])].join(", ");
            res.setHeader("Allow", allowHeader);
            return res.status(405).json({
              error: "Method Not Allowed",
              code: "METHOD_NOT_ALLOWED",
              message: `Use one of: ${allowHeader}`,
              hints: [
                "Check HTTP verb",
                "Send an OPTIONS request to discover allowed methods",
              ],
            });
          }
        }

        if (match) {
          req.params = match.params || {};
          await match.handler(req, res);
        } else {
          res.status(404).send("404 Not Found");
        }
      } catch (err) {
        // Always use normalized error handler
        errorHandler(err, req, res);
      } finally {
        // Ensure a status code is set before logging
        const status = res.statusCode || 200;
        logRequest(req, res, status, Date.now() - startTime);
      }
    });
  }

  // Routing API
  get(path, handler) {
    this.routes.push({ method: "GET", path, handler });
  }
  post(path, handler) {
    this.routes.push({ method: "POST", path, handler });
  }
  put(path, handler) {
    this.routes.push({ method: "PUT", path, handler });
  }
  delete(path, handler) {
    this.routes.push({ method: "DELETE", path, handler });
  }

  // Middleware registration
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // Static dir
  useStatic(dir) {
    this.staticDir = dir;
  }

  // Server listen
  listen(port, callback) {
    this.server.listen(port, callback);
  }
}

module.exports = Swipjy;
