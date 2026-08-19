/**
 * Error handling middleware and custom error classes
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(400, message, code);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(404, message, code);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, code = 'UNAUTHORIZED') {
    super(401, message, code);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code = 'FORBIDDEN') {
    super(403, message, code);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(409, message, code);
    this.name = 'ConflictError';
  }
}

/**
 * Handle errors in API routes
 */
export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    };
  }

  return {
    success: false,
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}
