/**
 * Standard error response
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', field = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
  }
}

/**
 * Error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.field && { field: err.field }),
      },
    });
  }
  
  // Database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'This value already exists',
      },
    });
  }
  
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Referenced resource does not exist',
      },
    });
  }
  
  // Default error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
}
