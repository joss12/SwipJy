// lib/core.js

const http = require("http");
const fs = require("fs");
const path = require("path");

const { attachResponseHelpers } = require("./response");
const { runMiddleware } = require("./middleware");
const { matchRoute } = require("./router");
const { render } = require("./viewEngine");
const { errorHandler } = require("./errorHandler");
const { logRequest } = require("./logger");

class Swipjy {
    constructor() {
        this.routes = [];
        this.middlewares = [];
        this.staticDir = null;

        this.server = http.createServer(async (req, res) => {
            const startTime = Date.now();
            attachResponseHelpers(res);

            // ✅ ADDED: parse URL once and attach query (works for every handler)
            // --------------------------------------------------------------------------------
            try {
                const parsed = new URL(req.url, "http://localhost");
                req.query = Object.fromEntries(parsed.searchParams.entries()); // ✅ ADDED
            } catch {
                req.query = {}; // ✅ ADDED fallback
            }
            req.params = {}; // ✅ ADD: default so handlers never crash
            // --------------------------------------------------------------------------------

            // view engine setup
            res.render = (viewName, data = {}) => {
                try {
                    const html = render(viewName, data);
                    res.setHeader("Content-Type", "text/html");
                    res.end(html);
                } catch (err) {
                    console.error("🛑 View render failed:", err); // ✅ ADDED: shows full error in terminal
                    res.statusCode = 500;
                    res.end("🚨 View render error: " + err.message);
                }
            };

            try {
                // Serve static files
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
                    // ✅ supports next(err)
                    if (err) throw err;
                });

                // Match routes
                const match = matchRoute(req.method, req.url, this.routes);

                // ✅ ADDED: attach params to req when route matches
                // --------------------------------------------------------------------------------
                if (match) {
                    req.params = match.params || {}; // ✅ ADDED
                    await match.handler(req, res);
                } else {
                    res.status(404).send("404 Not Found");
                }
                // --------------------------------------------------------------------------------
            } catch (err) {
                errorHandler(err, req, res);
            } finally {
                logRequest(req, res, res.statusCode, Date.now() - startTime);
            }
        });
    }

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

    use(middleware) {
        this.middlewares.push(middleware);
    }

    useStatic(dir) {
        this.staticDir = dir;
    }

    listen(port, callback) {
        this.server.listen(port, callback);
    }
}

module.exports = Swipjy;
