// routes/pushRoutes.js
const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushService');

// Save subscription
router.post('/subscribe', pushController.subscribe);

// Send to EVERYONE
router.post('/broadcast', pushController.sendBroadcast);

// Send to ONE USER
router.post('/send-user', pushController.sendToSpecificUser);

// Unsubscribe THIS device only
router.post('/unsubscribe/device', pushController.unsubscribeDevice);

// Unsubscribe ALL devices for a USER
router.post('/unsubscribe/user', pushController.unsubscribeUser);

module.exports = router;