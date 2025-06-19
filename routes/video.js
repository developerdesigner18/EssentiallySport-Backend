const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");

router.post("/generate", videoController.createVideo);

module.exports = router;
