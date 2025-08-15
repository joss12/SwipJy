"use strict";

// -----------------------------------------------------------------------------
// Router (CommonJS)
// - Minimal, fast
// - Safe path compiler (segment-by-segment) to avoid regex pitfalls
// -----------------------------------------------------------------------------

function Router() {
  this._mws = []; // global middlewares
  this._routes = []; // { method, path, handlers, matcher }
}

// Global or path-scoped middleware
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

// Koa/Connect-style composed middleware
Router.prototype.routes = function routes() {
  var self = this;
  return function routerMiddleware(ctx, next) {
    var stack = [].concat(self._mws);

    // apply path-scoped mws
    for (var i = 0; i < self._routes.length; i++) {
      var r = self._routes[i];
      if (r.method === "USE") {
        var matchUse = r.matcher(ctx.path || ctx.url || "/");
        if (matchUse) stack = stack.concat(r.handlers);
      }
    }

    var matched = false;
    for (var j = 0; j < self._routes.length; j++) {
      var rt = self._routes[j];
      if (rt.method === "USE") continue;
      if (rt.method !== (ctx.method || "GET")) continue;
      var params = rt.matcher(ctx.path || ctx.url || "/");
      if (params) {
        matched = true;
        ctx.params = ctx.params || params;
        stack = stack.concat(rt.handlers);
      }
    }

    var idx = -1;
    function dispatch(k) {
      if (k <= idx)
        return Promise.reject(new Error("next() called multiple times"));
      idx = k;
      var fn = stack[k];
      if (!fn)
        return matched ? Promise.resolve() : next ? next() : Promise.resolve();
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

// -----------------------------------------------------------------------------
// Safe path compiler
// Supports:
//   - Literal segments (escaped safely)
//   - Params:  :id, :slug_123  → ([^/]+) and captures into keys
//   - Wildcard: * (whole segment) → .*
// Notes:
//   - Works even if the original path contained literal parentheses or other
//     regex chars; only our inserted capture groups remain unescaped.
// -----------------------------------------------------------------------------
function compileMatcher(path) {
  // Accept strings only
  var input = String(path || "/");

  // Special-case match-all
  if (input === "*" || input === "/*") {
    return function () {
      return {};
    };
  }

  var keys = [];

  // Normalize leading slash handling
  // Split on '/', compile each segment
  var parts = input.split("/"); // keeps leading '' for paths like '/foo'
  var out = [];

  for (var i = 0; i < parts.length; i++) {
    var seg = parts[i];

    // Keep empty segment (for leading slash)
    if (i === 0 && seg === "") {
      out.push("");
      continue;
    }

    if (seg === "*") {
      out.push(".*"); // segment wildcard
      continue;
    }

    // Param segment like ':id'
    if (seg.charAt(0) === ":" && /^[A-Za-z0-9_]+$/.test(seg.slice(1))) {
      keys.push(seg.slice(1));
      out.push("([^/]+)");
      continue;
    }

    // Otherwise it's a literal: escape all regex metachars
    out.push(escapeRegex(seg));
  }

  var src = "^" + out.join("/") + "$";
  var re = new RegExp(src);

  return function match(urlPath) {
    var p = String(urlPath || "/").split("?")[0];
    var m = re.exec(p);
    if (!m) return null;
    var params = {};
    var idx = 1;
    for (var k = 0; k < keys.length; k++) {
      params[keys[k]] = safeDecode(m[idx++]);
    }
    return params;
  };
}

function escapeRegex(s) {
  // Escape all special regex characters
  // Do NOT escape '/' because we join segments with '/'
  return String(s).replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
}

function safeDecode(v) {
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
