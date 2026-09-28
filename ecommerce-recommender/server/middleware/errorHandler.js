function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(error, req, res, _next) {
  const status = error.status || error.statusCode || 500;
  const message = status === 500 ? "An unexpected server error occurred." : error.message;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
