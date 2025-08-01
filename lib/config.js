const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config(); // Load from .env

// Load environment-specific config
const ENV = process.env.NODE_ENV || "development";
const defaultConfigPath = path.join(process.cwd(), "config.default.json");
const envConfigPath = path.join(process.cwd(), `config.${ENV}.json`);

let config = {};

// Load default config first
if (fs.existsSync(defaultConfigPath)) {
    const defaults = JSON.parse(fs.readFileSync(defaultConfigPath, "utf-8"));
    config = { ...config, ...defaults };
}

// Override with config.{env}.json if available
if (fs.existsSync(envConfigPath)) {
    const envOverrides = JSON.parse(fs.readFileSync(envConfigPath, "utf-8"));
    config = { ...config, ...envOverrides };
}

// Final config object (merged)
config = {
    ...config,
    ...process.env, // .env always wins
};

// Schema validator (optional, extendable)
function validate(key, value, schema) {
    if (!schema) return value;

    if (
        schema.required &&
        (value === undefined || value === null || value === "")
    ) {
        throw new Error(`❌ Missing required config: ${key}`);
    }

    if (schema.allowed && !schema.allowed.includes(value)) {
        throw new Error(`❌ Invalid value for ${key}: ${value}`);
    }

    if (schema.type && typeof value !== schema.type) {
        // try parsing if possible
        if (schema.type === "number") {
            const parsed = parseFloat(value);
            if (isNaN(parsed)) throw new Error(`❌ ${key} must be a number`);
            return parsed;
        }
        if (schema.type === "boolean") {
            if (value === "true") return true;
            if (value === "false") return false;
            throw new Error(`❌ ${key} must be a boolean`);
        }
        throw new Error(`❌ ${key} must be a ${schema.type}`);
    }

    return value;
}

// Load a config value with fallback + optional schema
function load(key, fallback = undefined, schema = undefined) {
    const value = config[key] ?? fallback;
    return validate(key, value, schema);
}

// Expose entire config
module.exports = {
    config,
    load,
    env: ENV,
};
