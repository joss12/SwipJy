// lib/router.js

// Simple route compiler that supports:
// - :param                → named params
// - :param?               → optional segments
// - *                     → wildcard
// - Trailing slashes      → ignored
//
// Examples:
//   /users/:id
//   /posts/:slug/comments/:cid?
//   /assets/*

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
            // ✅ FIX: .Startswith → .startsWith
            if (seg.startsWith(":")) {
                // <-- fixed
                const isOptional = seg.endsWith("?");
                const name = seg.replace(/^:/, "").replace(/\?$/, "");
                tokens.push({ name });
                return isOptional ? "(?:/([^/]+))?" : "/([^/]+)";
            }
            return "/" + escapeRegex(seg);
        })
        .join("");

    pattern += "/?$"; // allow trailing slash
    // ✅ FIX: kregex → regex
    return { regex: new RegExp(pattern), keys: tokens }; // <-- fixed
}

function createMatcher(routes) {
    // Pre-compile all route patterns
    const compiled = routes.map((r) => {
        const { regex, keys } = compile(r.path);
        return { ...r, regex, keys };
    });

    return function match(method, url) {
        // strip query string
        const pathOnly = normalizePath(url.split("?")[0] || "/");

        for (const r of compiled) {
            if (r.method !== method) continue;
            const m = r.regex.exec(pathOnly);
            if (!m) continue;

            const params = {};
            r.keys.forEach((k, i) => {
                params[k.name] =
                    m[i + 1] === undefined ? undefined : decodeURIComponent(m[i + 1]);
            });

            return { handler: r.handler, params };
        }
        return null;
    };
}

// Public API expected by core.js
function matchRoute(method, url, routes) {
    const matcher = createMatcher(routes);
    return matcher(method, url);
}

module.exports = { matchRoute };
