// lib/bodyParser.js

function toBytes(limit = "1mb") {
    if (typeof limit === "number") return limit;
    const m = String(limit)
        .trim()
        .match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/i);
    if (!m) return 1024 * 1024;
    const n = parseFloat(m[1]); // <-- fixed: parseFloat (capital F)
    const u = (m[2] || "b").toLowerCase();
    const K = 1024;
    return u === "gb"
        ? n * K * K * K
        : u === "mb"
            ? n * K * K
            : u === "kb"
                ? n * K
                : n;
}

function bodyParser(options = {}) {
    const max = toBytes(options.limit || "1mb");
    const types = options.types || [
        "application/json",
        "application/x-www-form-urlencoded",
    ];

    return function(req, _res, next) {
        const method = (req.method || "").toUpperCase();
        if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return next();

        const ctRaw = String(req.headers["content-type"] || "").toLowerCase();
        const ct = ctRaw.split(";")[0].trim();
        if (!types.includes(ct)) {
            req.body = undefined; // let routes handle other content types
            return next();
        }

        let received = 0;
        const chunks = [];

        const fail = (code, status, message, cause) => {
            const err = new Error(message);
            err.code = code;
            err.status = status;
            if (cause) err.cause = cause;
            return next(err);
        };

        req.on("data", (chunk) => {
            received += chunk.length;
            if (received > max) {
                try {
                    req.pause();
                } catch { }
                return fail("PAYLOAD_TOO_LARGE", 413, "Payload Too Large");
            }
            chunks.push(chunk);
        });

        req.on("end", () => {
            const buf = Buffer.concat(chunks);
            try {
                if (ct === "application/json") {
                    req.body = buf.length ? JSON.parse(buf.toString("utf8")) : {};
                } else {
                    // x-www-form-urlencoded
                    const sp = new URLSearchParams(buf.toString("utf8"));
                    const out = {};
                    for (const [k, v] of sp) {
                        if (Object.prototype.hasOwnProperty.call(out, k)) {
                            const cur = out[k];
                            out[k] = Array.isArray(cur) ? [...cur, v] : [cur, v];
                        } else {
                            out[k] = v;
                        }
                    }
                    req.body = out;
                }
                return next();
            } catch (e) {
                return fail("INVALID_BODY", 400, "Invalid request body", e);
            }
        });

        req.on("error", (e) =>
            fail("STREAM_ERROR", 400, "Request stream error", e),
        );
    };
}

module.exports = { bodyParser };
