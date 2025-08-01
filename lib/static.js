// lib/static.j// lib/static.js
const fs = require("fs");
const path = require("path");

function serveStatic(dir) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();
    const filePath = path.join(process.cwd(), dir, req.url);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return next();
    }
    fs.readFile(filePath, (err, content) => {
      if (err) return next(err);
      if (res.headersSent) return;
      try {
        res.writeHead(200);
        res.end(content);
      } catch (e) {
        if (!res.headersSent) {
          res.writeHead(500);
          res.end("Internal Server Error");
        }
      }
    });
  };
}

module.exports = serveStatic; // ← Export function directly, not objecttatic };
