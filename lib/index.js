"use strict";

function safeRequire(p) {
  try {
    return require(p);
  } catch (_) {
    return null;
  }
}

// Constructor returns an app instance
function Swipjy() {
  const appMod = safeRequire("./app");
  if (!appMod || typeof appMod.createApp !== "function") {
    throw new Error("Swipjy: ./lib/app.js must export createApp() (CommonJS).");
  }
  return appMod.createApp();
}

// Attach statics (factories)
const appMod = safeRequire("./app");
if (appMod && typeof appMod.createApp === "function") {
  Swipjy.createApp = appMod.createApp;
}

const routerMod = safeRequire("./router");
if (routerMod) {
  if (typeof routerMod.Router === "function") Swipjy.Router = routerMod.Router;
  if (typeof routerMod.createRouter === "function")
    Swipjy.createRouter = routerMod.createRouter;
}

// Attach db
const dbMod =
  safeRequire("./db/index") ||
  safeRequire("./db") ||
  safeRequire("./lib/db/index");

if (dbMod) {
  Swipjy.db = dbMod;
}

// Middlewares
const mwMod = safeRequire("./middleware");
if (mwMod && typeof mwMod === "object") {
  Swipjy.middleware = mwMod;
  Object.assign(Swipjy, mwMod);
}

module.exports = Swipjy;
