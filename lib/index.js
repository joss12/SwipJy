"use strict";

/**
 * Swipjy public entry (CommonJS only)
 * Supports BOTH:
 *   - Constructor: const Swipjy = require('swipjy'); const app = new Swipjy();
 *   - Factory:     const { createApp, createRouter } = require('swipjy');
 */

// -------- safe require (so missing pieces don’t crash) --------
function safeRequire(p) {
  try {
    return require(p);
  } catch (_) {
    return null;
  }
}

// -------- Constructor --------
// `new Swipjy()` returns an app instance created by createApp()
function Swipjy() {
  const appMod = safeRequire("./app");
  if (!appMod || typeof appMod.createApp !== "function") {
    throw new Error("Swipjy: ./lib/app.js must export createApp() (CommonJS).");
  }
  // Returning an object from a constructor makes `new Swipjy()` effectively a factory.
  return appMod.createApp();
}

// -------- Static / named exports compatibility --------
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

const mwMod = safeRequire("./middleware");
if (mwMod && typeof mwMod === "object") {
  // Namespaced middlewares: Swipjy.middleware.cors, etc.
  Swipjy.middleware = mwMod;
  // Also flatten for convenience: Swipjy.cors, Swipjy.errorHandler, ...
  Object.assign(Swipjy, mwMod);
}

module.exports = Swipjy;
