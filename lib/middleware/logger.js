// lib/logger.js

const chalk = require("chalk");

function formatTimestamp() {
    const now = new Date();
    return now.toISOString().replace("T", " ").replace("Z", "");
}

function logRequest(req, res, statusCode, duration) {
    const method = req.method;
    const url = req.url;
    const statusColor =
        statusCode >= 500
            ? chalk.red
            : statusCode >= 400
                ? chalk.yellow
                : statusCode >= 300
                    ? chalk.cyan
                    : chalk.green;

    console.log(
        `${chalk.gray(`[${formatTimestamp()}]`)} ${chalk.bold(
            method,
        )} ${chalk.white(url)} → ${statusColor(statusCode)} (${duration}ms)`,
    );
}

module.exports = { logRequest };
