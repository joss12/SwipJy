// lib/middleware.js
const { errorHandler } = require("./errorHandler");

function runMiddleware(req, res, middlewares, done = () => { }) {
    let index = 0;

    function next(err) {
        if (err) {
            return errorHandler(err, req, res);
        }

        if (index >= middlewares.length) return done();

        const current = middlewares[index++];
        try {
            current(req, res, next);
        } catch (error) {
            next(error); // Pass error to error handler
        }
    }

    next();
}

module.exports = { runMiddleware };
