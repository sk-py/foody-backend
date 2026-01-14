const express = require('express');
const { analyzeResume } = require('../controllers/resume');
const router = express.Router();

router.post('/analyze', analyzeResume)

module.exports = router;