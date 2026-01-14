const express = require("express");
const { generateToken, fetchDashboards } = require("../controllers/superset");

const router = express.Router();

router.get("/guest-token", generateToken);
router.get("/get-dashboards", fetchDashboards);

module.exports = router;