// lib/router.js
// --------------------------------
// Matches route paths like /user/:id
// --------------------------------

function matchRoute(method, url, routes) {
    for (const route of routes) {
        if (route.method !== method) continue;

        const routeParts = route.path.split("/").filter(Boolean);
        const urlParts = url.split("?")[0].split("/").filter(Boolean);

        if (routeParts.length !== urlParts.length) continue;

        const params = {};
        const isMatch = routeParts.every((part, i) => {
            if (part.startsWith(":")) {
                params[part.slice(1)] = urlParts[i];
                return true;
            }
            return part === urlParts[i];
        });

        if (isMatch) {
            return { ...route, params };
        }
    }

    return null;
}

module.exports = { matchRoute };
