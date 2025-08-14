"use strict";

module.exports = {
  cors: require("./middleware/cors"),
  allowedMethods: require("./middleware/allowedMethods"),
  errorHandler: require("./middleware/errorHandler"),
  bodyParser: require("./middleware/bodyParser"),
  requestId: require("./middleware/requestId"),
  logger: require("./middleware/logger"),
  securityHeaders: require("./middleware/securityHeaders"),
  etag: require("./middleware/etag"),
  compress: require("./middleware/compress"),
};
