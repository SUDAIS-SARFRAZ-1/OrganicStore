/**
 * Centralized Error Handling Middleware (Rule 21)
 * Security Hardening (Item 14):
 * - Masks internal 500 error messages and stack traces in production.
 * - Logs server errors securely.
 */
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || (res.statusCode >= 400 && res.statusCode < 600 ? res.statusCode : 500);

  // Prevent leaking sensitive server or database internals in production
  let message = err.message || 'Internal Server Error';
  if (statusCode === 500 && isProd) {
    message = 'An unexpected internal server error occurred. Please try again later.';
  }

  // Security logging for server-side errors
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(!isProd && { stack: err.stack }),
  });
}

/**
 * 404 Route Not Found Middleware
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
