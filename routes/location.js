// routes/locationRoutes.js
const express = require("express");
const router = express.Router();
const { verifyLocation } = require("../controllers/location");

// POST /api/location/verify
router.post("/verify", verifyLocation);

module.exports = router;
