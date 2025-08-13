// swipjy/lib/validate.js
// Zero-dep validator wrapper. Works with Zod if present, or plain functions.

function _pick(schema) {
    if (!schema) return (v) => ({ success: true, data: v });
    if (typeof schema.safeParse === "function") return (v) => schema.safeParse(v);
    if (typeof schema.parse === "function") {
        return (v) => {
            try {
                return { success: true, data: schema.parse(v) };
            } catch (e) {
                return { success: false, error: e };
            }
        };
    }
    if (typeof schema === "function") {
        return (v) => {
            try {
                return { success: true, data: schema(v) };
            } catch (e) {
                return { success: false, error: e };
            }
        };
    }
    return (v) => ({ success: true, data: v });
}

/** withValidation({ params?, query?, body? }, handler) -> validated handler */
function withValidation(schemas, handler) {
    const P = _pick(schemas?.params);
    const Q = _pick(schemas?.query);
    const B = _pick(schemas?.body);

    return async (req, res, ctx) => {
        const pr = P(req.params || {});
        const qr = Q(req.query || {});
        const br = B(req.body || {});
        if (pr.success && qr.success && br.success) {
            req.params = pr.data;
            req.query = qr.data;
            req.body = br.data;
            return handler(req, res, ctx);
        }
        const details = {
            params: !pr.success ? _format(pr.error) : null,
            query: !qr.success ? _format(qr.error) : null,
            body: !br.success ? _format(br.error) : null,
        };
        const err = new Error("Invalid request");
        err.status = 400;
        err.code = "VALIDATION_ERROR";
        err.details = details;
        throw err; // your errorHandler will format this
    };
}

function _format(err) {
    if (err && Array.isArray(err.issues)) {
        return err.issues.map((i) => ({
            path: Array.isArray(i.path) ? i.path.join(".") : String(i.path || ""),
            message: i.message,
            code: i.code,
        }));
    }
    return String(err && err.message ? err.message : err);
}

module.exports = { withValidation };
