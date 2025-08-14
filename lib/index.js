// lib/index.js
const Swipjy = require("./core");

// Optional utilities
try {
  const { serveStatic } = require("./static");
  Swipjy.serveStatic = serveStatic;
} catch {}

try {
  const { connect, disconnect } = require("./db");
  Swipjy.connect = connect;
  Swipjy.disconnect = disconnect;
} catch {}

try {
  const { load } = require("./config");
  Swipjy.load = load;
} catch {}

// Export the class
module.exports = Swipjy;

// Extra helpers
try {
  module.exports.withValidation = require("./validate").withValidation;
} catch {}

// Prefer new middleware path; fall back to legacy if present
try {
  module.exports.bodyParser = require("./middleware/bodyParser").bodyParser;
} catch {
  try {
    module.exports.bodyParser = require("./bodyParser").bodyParser;
  } catch {}
}

// Optional convenience exports (existence-based)
try {
  module.exports.bootstrap = require("./app-bootstrap.js");
} catch {}
try {
  module.exports.createRouter = require("./router.js");
} catch {}
