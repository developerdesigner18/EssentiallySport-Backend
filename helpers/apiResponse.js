exports.successResponse = (res, msg) => {
  return res.status(200).json({ status: 1, message: msg });
};

exports.successResponseWithData = (res, msg, data = {}) => {
  return res.status(200).json({ status: 1, message: msg, data });
};

exports.errorResponse = (res, msg, statusCode = 500) => {
  return res.status(statusCode).json({ status: 0, message: msg });
};

exports.errorResponseWithData = (res, msg, data = {}) => {
  return res.status(500).json({ status: 0, message: msg, data });
};

exports.notFoundResponse = (res, msg) => {
  return res.status(404).json({ status: 0, message: msg });
};

exports.validationErrorWithData = (res, msg, data = {}) => {
  return res.status(400).json({ status: 0, message: msg, data });
};

exports.unauthorizedResponse = (res, msg) => {
  return res.status(401).json({ status: 0, message: msg });
};

exports.forbiddenResponse = (res, msg) => {
  return res.status(403).json({ status: 0, message: msg });
};
