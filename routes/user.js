const express = require("express");
const { handleSignup } = require("../controllers/user");

const router = express.Router();

// router.post("/user/login",)
router.post("/user/signup", handleSignup)

module.exports  = router