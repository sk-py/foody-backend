const express = require("express");
const { handleFaceLogin, handleFaceRegister } = require("../controllers/face");
const multer = require('multer');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});

const upload = multer({ storage: storage });

const router = express.Router();

// Route for registration with file upload
router.post("/api/register", upload.single("file"), handleFaceRegister);

// Route for face login with file upload
router.post("/api/login", upload.single("file"), handleFaceLogin);

module.exports = router;
