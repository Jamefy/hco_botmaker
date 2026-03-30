function notFoundHandler(req, res) {
  res.status(404).json({
    status: "error",
    message: "not_found"
  });
}

function errorHandler(logger) {
  return (err, req, res, next) => {
    logger.error("Request failed", serializeError(err, req));
    res.status(err.status || 500).json({
      status: "error",
      message: err.message || "internal_error",
      body: err.body || ""
    });
  };
}

function serializeError(error, req) {
  return {
    message: error.message,
    status: error.status,
    body: error.body,
    method: req?.method,
    path: req?.originalUrl,
    stack: error.stack
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  serializeError
};
