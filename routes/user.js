const express = require("express");
const { handleSignup, handlesignIn } = require("../controllers/user");

const router = express.Router();

// router.post("/user/login",)
router.post("/user/signup", handleSignup)

router.post("/user/signin", handlesignIn)

module.exports  = router