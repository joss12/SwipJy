// CommonJS Router with a factory. Minimal, fast, and framework-agnostic.
// Exposes: class Router, function createRouter()
// Usage in apps: const { createRouter } = require('swipjy');

function Router() {
  this._mws = []; // global middlewares (no path)
  this._routes = []; // { method, path, handlers, matcher }
}

/** Register global middleware or path-scoped middleware */
Router.prototype.use = function use(pathOrMw /*, ...mws */) {
  if (typeof pathOrMw === "string") {
    var path = pathOrMw;
    var mws = Array.prototype.slice.call(arguments, 1).flat();
    if (!mws.length) return this;
    this._routes.push({
      method: "USE",
      path: path,
      handlers: mws,
      matcher: compileMatcher(path),
    });
    return this;
  }
  // global middlewares
  var mws2 = Array.prototype.slice.call(arguments).flat();
  for (var i = 0; i < mws2.length; i++) this._mws.push(mws2[i]);
  return this;
};

["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].forEach(
  function (method) {
    Router.prototype[method.toLowerCase()] = function (
      path /*, ...handlers */,
    ) {
      var handlers = Array.prototype.slice.call(arguments, 1).flat();
      if (!handlers.length)
        throw new Error(method + " " + path + " requires a handler");
      this._routes.push({
        method: method,
        path: path,
        handlers: handlers,
        matcher: compileMatcher(path),
      });
      return this;
    };
  },
);

/** Koa/Connect-style middleware that runs the router */
Router.prototype.routes = function routes() {
  var self = this;
  return function routerMiddleware(ctx, next) {
    // Build the execution stack for this request
    var stack = [].concat(self._mws);

    // Path-scoped "use"
    for (var i = 0; i < self._routes.length; i++) {
      var r = self._routes[i];
      if (r.method === "USE") {
        var matchUse = r.matcher(ctx.path || ctx.url || "/");
        if (matchUse) stack = stack.concat(r.handlers);
      }
    }

    // Method+path routes
    var matched = false;
    for (var j = 0; j < self._routes.length; j++) {
      var rt = self._routes[j];
      if (rt.method === "USE") continue;
      if (rt.method !== (ctx.method || "GET")) continue;
      var params = rt.matcher(ctx.path || ctx.url || "/");
      if (params) {
        matched = true;
        // attach params (don’t overwrite if already set)
        ctx.params = ctx.params || params;
        stack = stack.concat(rt.handlers);
      }
    }

    // Compose the middleware stack
    var idx = -1;
    function dispatch(k) {
      if (k <= idx)
        return Promise.reject(new Error("next() called multiple times"));
      idx = k;
      var fn = stack[k];
      if (!fn) {
        // If nothing matched, fall through to outer "next"
        return matched ? Promise.resolve() : next ? next() : Promise.resolve();
      }
      try {
        return Promise.resolve(
          fn(ctx, function nextFn() {
            return dispatch(k + 1);
          }),
        );
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0);
  };
};

// Simple path-to-regexp-lite compiler supporting /users/:id and wildcards *
function compileMatcher(path) {
  if (path === "*" || path === "/*") {
    return function () {
      return {};
    };
  }
  var keys = [];
  var reSrc =
    "^" +
    path
      .replace(/([.+?^=!:${}()|[\]\/\\])/g, "\\$1") // escape regex
      .replace(/\*/g, ".*") // wildcard *
      .replace(/:(\w+)/g, function (_, key) {
        // params :id
        keys.push(key);
        return "([^\\/]+)";
      }) +
    "$";
  var re = new RegExp(reSrc);
  return function match(urlPath) {
    // strip query if any
    var p = String(urlPath || "/").split("?")[0];
    var m = re.exec(p);
    if (!m) return null;
    var out = {};
    for (var i = 0; i < keys.length; i++)
      out[keys[i]] = decodeComponent(m[i + 1]);
    return out;
  };
}

function decodeComponent(v) {
  try {
    return decodeURIComponent(v);
  } catch (_) {
    return v;
  }
}

function createRouter() {
  return new Router();
}

module.exports = { Router: Router, createRouter: createRouter };
