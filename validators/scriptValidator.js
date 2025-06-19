const { body } = require("express-validator");

exports.generateScriptValidation = [
  body("celebrity")
    .trim()
    .notEmpty()
    .withMessage("Celebrity name is required")
    .isLength({ max: 100 })
    .withMessage("Celebrity name must be under 100 characters"),
];
