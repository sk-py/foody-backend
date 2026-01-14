const webpush = require('web-push');
require('dotenv').config();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const mailto = process.env.MAILTO_ADDRESS;

if (!publicVapidKey || !privateVapidKey) {
    throw new Error("VAPID Keys are missing in .env file");
}

webpush.setVapidDetails(
    mailto,
    publicVapidKey,
    privateVapidKey
);

module.exports = webpush;