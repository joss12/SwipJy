// lib/index.js
const Swipjy = require("./core");
const { serveStatic } = require("./static");
const { connect, disconnect } = require("./db");
const { load } = require("./config");

// ✅ Attach utilities as static members of the class
Swipjy.serveStatic = serveStatic;
Swipjy.connect = connect;
Swipjy.disconnect = disconnect;
Swipjy.load = load;

module.exports = Swipjy; // ✅ Export the class directly
module.exports.withValidation = require("./validate").withValidation;
module.exports.bodyParser = require("./bodyParser").bodyParser;
