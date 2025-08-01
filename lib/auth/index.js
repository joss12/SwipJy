const { hashPassword, verifyPassword } = require("../crypto/hash");
const { generateToken, verifyToken } = require("../crypto/token");

const users = new Map();

function register(req, res) {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).send("Missing username or password");
    }

    if (users.has(username)) {
        return res.status(409).send("Username already exists");
    }

    const passwordHash = hashPassword(password);
    users.set(username, { passwordHash });

    res.status(201).send("User registered successfully");
}

function login(req, res) {
    const { username, password } = req.body || {};
    const user = users.get(username);

    if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).send("Invalid username or password");
    }

    const token = generateToken(username);
    user.token = token;

    res.status(200).json({ token });
}

function requireAuth(req, res, next) {
    const token = req.headers["authorization"];

    if (!token || !verifyToken(token)) {
        return res.status(401).send("Unauthorized");
    }

    next();
}

module.exports = { register, login, requireAuth };
