const express = require("express");
const router = express.Router();
const { generateAIScript } = require("../controllers/scriptController");
const { generateScriptValidation } = require("../validators/scriptValidator");
const expressValidation = require("../middlewares/expressValidation");

router.post("/generate-script", generateScriptValidation , expressValidation , generateAIScript);

module.exports = router;
