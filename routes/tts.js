const express = require("express");
const router = express.Router();
const { generateTTS } = require("../controllers/ttsController");

router.post("/generate", generateTTS);

module.exports = router;
