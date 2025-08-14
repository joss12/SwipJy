#!/usr/bin/env node

// bin/swipjy.js
// --------------------------
// Swipjy CLI entry point
// Parses CLI arguments and routes to command modules
// --------------------------

const [, , command, ...args] = process.argv;

switch (command) {
    case "create":
        require("../cli/create")(args);
        break;

    case "generate":
        require("../cli/generate")(args);
        break;

    case "bundle":
        require("../cli/bundle")(args);
        break;

    case "help":
    case undefined:
        showHelp();
        break;

    default:
        console.log(`❌ Unknown command: "${command}"`);
        showHelp();
}

// --------------------------
// CLI usage instructions
// --------------------------
function showHelp() {
    console.log(`🧱 Swipjy CLI Usage:

  swipjy create <app-name>        Create a new Swipjy project
  swipjy generate route <name>    Generate a route file
  swipjy generate view <name>     Generate a view (JSX)
  swipjy help                     Show this help message

`);
}
