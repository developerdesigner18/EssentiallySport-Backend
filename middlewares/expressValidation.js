const { validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return apiResponse.validationErrorWithData(
      res,
      "Validation error",
      errors.array()
    );
  }
  next();
};
