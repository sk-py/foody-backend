const express = require("express");
const router = express.Router();
const { handleCall } = require("../controllers/call");

router.post("/makecall", handleCall);

module.exports = router;
