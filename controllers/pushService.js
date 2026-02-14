const pushService = require('../services/pushService');

// 1. SUBSCRIBE
const subscribe = async (req, res) => {
    try {
        const { subscription, userId } = req.body;
        
        // Basic validation
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Subscription object is required' });
        }

        // We allow userId to be optional for anonymous subscribers for broadcasts only
        const idToSave = userId || 'anonymous'; 

        await pushService.saveSubscription(idToSave, subscription);

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
};

// 2. BROADCAST (To All)
const sendBroadcast = async (req, res) => {
    try {
        const { title, body, url, icon } = req.body;

        const payload = {
            title: title || 'Announcement',
            body: body || 'Check out our latest update!',
            icon: icon || '/icon.png',
            data: { url: url || '/' }
        };

        await pushService.sendNotificationToAll(payload);

        res.status(200).json({ message: 'Broadcast sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to broadcast' });
    }
};

// 3. TARGETED (To Specific User)
const sendToSpecificUser = async (req, res) => {
    try {
        const { userId, title, body, url, icon } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Target userId is required' });
        }

        const payload = {
            title: title || 'Private Message',
            body: body || 'You have a new notification',
            icon: icon || '/icon.png',
            data: { url: url || '/' }
        };

        await pushService.sendNotificationToUser(userId, payload);

        res.status(200).json({ message: `Notification sent to ${userId}` });
    } catch (error) {
        // Return 404 if user found in DB, 500 for other errors
        if (error.message.includes('No subscriptions found')) {
            return res.status(404).json({ error: 'User not found or not subscribed' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to send direct message' });
    }
};

// 4. Unsubscribe THIS device only
const unsubscribeDevice = async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) return res.status(400).json({ error: "Endpoint is required" });

        await pushService.deleteDeviceSubscription(endpoint);
        res.status(200).json({ message: "This device has been unsubscribed." });
    } catch (error) {
        res.status(500).json({ error: "Failed to unsubscribe device" });
    }
};

// 5. Unsubscribe ALL devices for this user
const unsubscribeUser = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "UserId is required" });

        await pushService.deleteAllUserSubscriptions(userId);
        res.status(200).json({ message: "All devices for this user have been unsubscribed." });
    } catch (error) {
        res.status(500).json({ error: "Failed to unsubscribe user" });
    }
};

module.exports = {
    subscribe,
    sendBroadcast,
    sendToSpecificUser,
    unsubscribeDevice,
    unsubscribeUser
};