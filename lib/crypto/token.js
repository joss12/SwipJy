const crypto = require("crypto");
const issuedTokens = new Set();

function generateToken(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    issuedTokens.add(token);
    return token;
}

function verifyToken(token) {
    return issuedTokens.has(token);
}

module.exports = { generateToken, verifyToken };
