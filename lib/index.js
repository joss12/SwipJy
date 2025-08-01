const Swipjy = require("./core");
const serveStatic = require("./static"); // static.js exports a function directly
const { connect, disconnect } = require("./db");
const { load } = require("./config");

module.exports = {
    Swipjy,
    serveStatic, // ✅ directly the function
    connect,
    disconnect,
    load,
};
