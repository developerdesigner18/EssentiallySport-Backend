const express = require("express");
const router = express.Router();
const { generateReel } = require("../controllers/reelController");

router.post("/reel", generateReel);

module.exports = router;
