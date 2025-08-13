// lib/router.js

// Simple route compiler that supports:
// - :param, :param?, * wildcard, trailing slashes
function normalizePath(p) {
    if (!p) return "/";
    if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
    return p;
}
function escapeRegex(str) {
    return str.replace(/([.+^=!:${}()|[\]/\\])/g, "\\$1");
}
function compile(path) {
    const tokens = [];
    const parts = normalizePath(path).split("/").filter(Boolean);

    let pattern = "^";
    if (parts.length === 0) {
        pattern += "/?$";
        return { regex: new RegExp(pattern), keys: tokens };
    }

    pattern += parts
        .map((seg) => {
            if (seg === "*") {
                tokens.push({ name: "wildcard" });
                return "(?:/(.*))?"; // optional to allow base path too
            }
            if (seg.startsWith(":")) {
                const isOptional = seg.endsWith("?");
                const name = seg.replace(/^:/, "").replace(/\?$/, "");
                tokens.push({ name });
                return isOptional ? "(?:/([^/]+))?" : "/([^/]+)";
            }
            return "/" + escapeRegex(seg);
        })
        .join("");

    pattern += "/?$"; // allow trailing slash
    return { regex: new RegExp(pattern), keys: tokens };
}

// [GPT-5 Thinking] cache compiled routes per routes-array to avoid recompiling each request
const _compiledCache = new WeakMap();
function getCompiled(routes) {
    let compiled = _compiledCache.get(routes);
    if (compiled) return compiled;
    compiled = routes.map((r) => {
        const { regex, keys } = compile(r.path);
        return { ...r, regex, keys };
    });
    _compiledCache.set(routes, compiled);
    return compiled;
}

// Public API expected by core.js
function matchRoute(method, url, routes) {
    const compiled = getCompiled(routes);

    // [GPT-5 Thinking] robust URL parsing (handles querystrings)
    let pathname = "/";
    try {
        const u = new URL(url, "http://localhost");
        pathname = normalizePath(u.pathname || "/");
    } catch {
        pathname = normalizePath(url.split("?")[0] || "/");
    }

    for (const r of compiled) {
        if (r.method !== method) continue;
        const m = r.regex.exec(pathname);
        if (!m) continue;

        const params = {};
        r.keys.forEach((k, i) => {
            const val = m[i + 1];
            if (val !== undefined) params[k.name] = decodeURIComponent(val);
        });

        return { handler: r.handler, params };
    }
    return null;
}

function allowedMethods(url, routes) {
    //strip query string + normalize
    const pathOnly = normalizePath(url.split("?")[0] || "/");
    const seen = new Set();
    for (const r of routes) {
        const { regex } = compile(r.path);
        if (regex.test(pathOnly)) seen.add(r.method);
    }
    return Array.from(seen);
}

module.exports = { matchRoute, allowedMethods };
