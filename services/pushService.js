// // services/pushService.js
// const webpush = require('../utils/webpush');

// // DATA STRUCTURE:
// // [ { userId: 'user_123', subscription: { endpoint: '...', keys: '...' } }, ... ]
// let dummyDbStore = [];

// const saveSubscription = async (userId, subscription) => {
//     // 1. Clean up: Remove old subscription for this device if it exists to prevent duplicates
//     dummyDbStore = dummyDbStore.filter(item => item.subscription.endpoint !== subscription.endpoint);

//     // 2. Save new link between User ID and Subscription
//     // If userId is null (anonymous user), we can still save them just for broadcasts
//     dummyDbStore.push({ userId, subscription });
    
//     console.log(`Saved subscription. Total subscribers: ${dummyDbStore.length}`);
//     return true;
// };

// // FEATURE 1: Send to EVERYONE
// const sendNotificationToAll = async (payload) => {
//     const subscriptions = dummyDbStore.map(item => item.subscription);

//     const notifications = subscriptions.map(sub => {
//         return webpush.sendNotification(sub, JSON.stringify(payload))
//             .catch(err => {
//                 if (err.statusCode === 410 || err.statusCode === 404) {
//                     // Cleanup dead subscription
//                     dummyDbStore = dummyDbStore.filter(item => item.subscription.endpoint !== sub.endpoint);
//                 }
//                 console.error('Broadcast error:', err.statusCode);
//             });
//     });

//     return Promise.all(notifications);
// };

// // FEATURE 2: Send to SPECIFIC USER
// const sendNotificationToUser = async (targetUserId, payload) => {
//     // Find all devices for this specific user
//     const userSubscriptions = dummyDbStore
//         .filter(item => item.userId === targetUserId)
//         .map(item => item.subscription);

//     if (userSubscriptions.length === 0) {
//         throw new Error(`No subscriptions found for user ${targetUserId}`);
//     }

//     const notifications = userSubscriptions.map(sub => {
//         return webpush.sendNotification(sub, JSON.stringify(payload))
//             .catch(err => {
//                 if (err.statusCode === 410 || err.statusCode === 404) {
//                     dummyDbStore = dummyDbStore.filter(item => item.subscription.endpoint !== sub.endpoint);
//                 }
//                 console.error(`Targeted send error for ${targetUserId}:`, err.statusCode);
//             });
//     });

//     return Promise.all(notifications);
// };

// module.exports = {
//     saveSubscription,
//     sendNotificationToAll,
//     sendNotificationToUser
// };


const webpush = require('../utils/webpush');
const tursoDb = require('../utils/tursodb');

// 1. SAVE SUBSCRIPTION
const saveSubscription = async (userId, sub) => {
    try {
        // SQLite syntax: INSERT OR REPLACE handles updates automatically
        await tursoDb.execute({
            sql: `INSERT OR REPLACE INTO subscriptions (userId, endpoint, p256dh, auth) 
                  VALUES (?, ?, ?, ?)`,
            args: [userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
        });
        
        console.log(`Saved subscription for user: ${userId}`);
        return true;
    } catch (err) {
        console.error("Turso Save Error:", err);
        return false;
    }
};

// 2. DELETE SUBSCRIPTION
const deleteSubscription = async (endpoint) => {
    try {
        await tursoDb.execute({
            sql: "DELETE FROM subscriptions WHERE endpoint = ?",
            args: [endpoint]
        });
        console.log("Deleted subscription from Turso.");
        return true;
    } catch (err) {
        console.error("Turso Delete Error:", err);
        return false;
    }
};

// 3. SEND NOTIFICATION
const sendNotificationToUser = async (targetUserId, payload) => {
    try {
        // Fetch users from Turso
        const result = await tursoDb.execute({
            sql: "SELECT * FROM subscriptions WHERE userId = ?",
            args: [targetUserId]
        });

        const rows = result.rows; // Turso returns rows in a .rows property

        if (rows.length === 0) {
            console.log(`User ${targetUserId} has no subscriptions.`);
            return;
        }

        const notifications = rows.map(row => {
            const subscription = {
                endpoint: row.endpoint,
                keys: { p256dh: row.p256dh, auth: row.auth }
            };

            return webpush.sendNotification(subscription, JSON.stringify(payload))
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log('Cleaning up dead device...');
                        deleteSubscription(row.endpoint); // Auto-delete from Turso
                    }
                });
        });

        return Promise.all(notifications);
    } catch (err) {
        console.error("Error fetching subs from Turso:", err);
    }
};

// DELETE SUBSCRIPTIONS

// A. Device Level (The "Logout" button logic)
const deleteDeviceSubscription = async (endpoint) => {
    try {
        await tursoDb.execute({
            sql: "DELETE FROM subscriptions WHERE endpoint = ?",
            args: [endpoint]
        });
        console.log("Device unsubscribed successfully.");
        return true;
    } catch (err) {
        console.error("Error deleting device sub:", err);
        throw err;
    }
};

// B. User Level (The "Turn off all notifications" logic)
const deleteAllUserSubscriptions = async (userId) => {
    try {
        await tursoDb.execute({
            sql: "DELETE FROM subscriptions WHERE userId = ?",
            args: [userId]
        });
        console.log(`All devices for user ${userId} have been unsubscribed.`);
        return true;
    } catch (err) {
        console.error("Error deleting user subs:", err);
        throw err;
    }
};

module.exports = {
    saveSubscription,
    deleteSubscription,
    sendNotificationToUser,
    deleteDeviceSubscription,
    deleteAllUserSubscriptions
};