// lib/middleware.js
async function runMiddleware(req, res, middlewares) {
    for (const mw of middlewares) {
        // Stop if response already sent
        if (res.writableEnded) return;

        await new Promise((resolve, reject) => {
            let finished = false;

            const done = (err) => {
                if (finished) return;
                finished = true;
                err ? reject(err) : resolve();
            };

            try {
                const maybePromise = mw(req, res, done);
                // Support async middlewares that return a promise instead of using next()
                if (maybePromise && typeof maybePromise.then === "function") {
                    maybePromise.then(() => done()).catch(done);
                }
            } catch (e) {
                done(e);
            }
        });
    }
}

module.exports = { runMiddleware };
