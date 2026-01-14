// utils/db.js
const { createClient } = require('@libsql/client');

const tursoDb = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize the table automatically
(async () => {
    try {
        await tursoDb.execute(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                userId TEXT,
                endpoint TEXT PRIMARY KEY,
                p256dh TEXT,
                auth TEXT
            )
        `);
        console.log("Connected to Turso DB & checked table.");
    } catch (err) {
        console.error("Turso Connection Failed:", err);
    }
})();

module.exports = tursoDb;