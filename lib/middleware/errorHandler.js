//lib/middleware/errorHandler.js

function HttpError(status, message, opts = {}) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = "HttpError";
    this.status = status;
    this.message = message || defaultMessage(status);
    this.code = opts.code || defaultCode(status);
    this.details = opts.details;
    this.hints = opts.hints;
}

HttpError.prototype = Object.create(Error.prototype);

function createError(status, opts = {}) {
    return new HttpError(status, opts.message, opts);
}

function defaultMessage(status) {
    switch (status) {
        case 400:
            return "Bad Request";
        case 401:
            return "Unauthorized";
        case 403:
            return "Fobidden";
        case 404:
            return "Not Found";
        case 405:
            return "Method Not Allowed";
        case 413:
            return "Payload Too Large";
        case 415:
            return "Unsupporrted Media Type";
        case 422:
            return "Unprocessable Entity";
        case 429:
            return "Too Many Requests";
        default:
            return status >= 500 ? "Internal Server Error" : "Error";
    }
}

function defaultCode(status) {
    switch (status) {
        case 400:
            return "BAD_REQUEST";
        case 401:
            return "UNAUTHORIZED";
        case 403:
            return "FORBIDDEN";
        case 404:
            return "NOT_FOUND";
        case 405:
            return "METHOD_NOT_ALLOWED";
        case 413:
            return "PAYLOAD_TOO_LARGE";
        case 415:
            return "UNSUPPORTED_MEDIA_TYPE";
        case 422:
            return "UNPROCESSABLE_ENTITY";
        case 429:
            return "RATE_LIMITED";
        default:
            return status >= 500 ? "INTERNAL_ERROR" : "ERROR";
    }
}

function errorHandler() {
    return async function(ctx, next) {
        try {
            await next();
            if (ctx.res.writableEnded) return;
            if (ctx.body == null) {
                ctx.status = 404;
                ctx.set("Content-Type", "application/json; charset=utf-8");
                ctx.body = payload(new HttpError(404));
            }
        } catch (err) {
            const e =
                err instanceof HttpError
                    ? err
                    : new HttpError(500, err && err.message, {
                        code: "INTERNAL_ERROR",
                        details:
                            process.env.NODE_ENV === "development"
                                ? { stack: err && err.stack }
                                : undefined,
                    });
            ctx.status = e.status || 500;
            ctx.set("Content-Type", "application/json; charset=utf-8");
            ctx.body = payload(e);
        }
    };
}

module.exports = {
    HttpError,
    createError,
    errorHandler,
};
