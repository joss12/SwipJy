// lib/crypto/hash.js
const crypto = require("crypto");

// Hash a password and return hash:salt
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, salt, 100000, 64, "sha512")
        .toString("hex");
    return `${hash}:${salt}`;
}

// Compare password with stored hash
function verifyPassword(password, storedHash) {
    const [hash, salt] = storedHash.split(":");
    const newHash = crypto
        .pbkdf2Sync(password, salt, 100000, 64, "sha512")
        .toString("hex");
    return newHash === hash;
}

module.exports = { hashPassword, verifyPassword };
