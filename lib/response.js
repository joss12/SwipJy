// response.js
const statusCodes = require("./statusCodes");
const { render } = require("./viewEngine"); // 👈 ADDED: import render function from view.js

function attachResponseHelpers(res) {
    res.statusCode = 200;

    res.status = function(code) {
        res.statusCode = code;
        const reason = statusCodes[code];
        if (reason) {
            res.statusMessage = reason;
        }
        return res;
    };

    res.send = function(data) {
        const type = typeof data;
        if (type === "object") {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
        } else {
            res.setHeader("Content-Type", "text/plain");
            res.end(data);
        }
    };

    res.json = function(obj) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(obj));
    };

    res.set = function(key, value) {
        res.setHeader(key, value);
        return res;
    };

    // 👇 ADDED: render() support for JSX view engine
    res.render = function(viewName, data) {
        try {
            const html = render(viewName, data);
            res.setHeader("Content-Type", "text/html");
            res.end(html);
        } catch (err) {
            res.status(500).send(`View render error: ${err.message}`);
        }
    };

    return res;
}

module.exports = { attachResponseHelpers };
