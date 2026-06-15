/**
 * Frontend Error Handling Utilities
 * Provides centralized error logging, formatting, and user feedback
 */

/**
 * Error severity levels for categorization
 */
export const ERROR_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Error codes for specific scenarios
 */
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // Authentication errors
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Not found errors
  NOT_FOUND: 'NOT_FOUND',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Conflict errors
  CONFLICT: 'CONFLICT',
  
  // Client errors
  BAD_REQUEST: 'BAD_REQUEST',
  
  // Unknown error
  UNKNOWN: 'UNKNOWN',
};

/**
 * Custom error class with enhanced functionality
 */
export class APIError extends Error {
  constructor(message, statusCode = null, errorCode = null, details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode || ERROR_CODES.UNKNOWN;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage() {
    const userMessages = {
      [ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
      [ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again.',
      [ERROR_CODES.UNAUTHENTICATED]: 'You are not logged in. Please login to continue.',
      [ERROR_CODES.UNAUTHORIZED]: 'You do not have permission to perform this action.',
      [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please login again.',
      [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
      [ERROR_CODES.SERVER_ERROR]: 'An unexpected error occurred. Please try again later.',
      [ERROR_CODES.CONFLICT]: 'This action conflicts with the current state. Please refresh and try again.',
      [ERROR_CODES.BAD_REQUEST]: 'Invalid request. Please check your input.',
    };

    return userMessages[this.errorCode] || this.message || 'An unexpected error occurred.';
  }

  /**
   * Get error level based on status code
   */
  getLevel() {
    if (this.statusCode >= 500) return ERROR_LEVELS.CRITICAL;
    if (this.statusCode >= 400) return ERROR_LEVELS.ERROR;
    return ERROR_LEVELS.WARNING;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      details: this.details,
      timestamp: this.timestamp,
      level: this.getLevel(),
    };
  }
}

/**
 * Map HTTP status codes to error codes
 */
function mapStatusToErrorCode(status) {
  switch (status) {
    case 400:
      return ERROR_CODES.BAD_REQUEST;
    case 401:
      return ERROR_CODES.UNAUTHENTICATED;
    case 403:
      return ERROR_CODES.UNAUTHORIZED;
    case 404:
      return ERROR_CODES.NOT_FOUND;
    case 409:
      return ERROR_CODES.CONFLICT;
    case 422:
      return ERROR_CODES.VALIDATION_ERROR;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_CODES.SERVER_ERROR;
    default:
      return ERROR_CODES.UNKNOWN;
  }
}

/**
 * Parse error response from API
 */
export function parseAPIError(response, errorData = null) {
  const statusCode = response.status;
  const errorCode = mapStatusToErrorCode(statusCode);
  
  let message = errorData?.message || 'An error occurred.';
  let details = null;

  // Extract validation errors
  if (errorData?.errors) {
    details = errorData.errors;
  }

  return new APIError(message, statusCode, errorCode, details);
}

/**
 * Handle network errors
 */
export function handleNetworkError(error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new APIError(
      'Network connection failed.',
      null,
      ERROR_CODES.NETWORK_ERROR,
      error.message
    );
  }

  if (error.name === 'AbortError') {
    return new APIError(
      'Request timed out.',
      null,
      ERROR_CODES.TIMEOUT,
      error.message
    );
  }

  return error;
}

/**
 * Log error with context
 */
export function logError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: error.getLevel?.() || ERROR_LEVELS.ERROR,
    message: error.message,
    code: error.errorCode,
    statusCode: error.statusCode,
    details: error.details,
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  if (import.meta.env.DEV) {
    console.error('[ErrorHandler]', errorLog);
  }

  // In production, send to error tracking service (e.g., Sentry)
  if (import.meta.env.PROD) {
    // TODO: Send to error tracking service
    // sendToErrorTrackingService(errorLog);
  }

  return errorLog;
}

/**
 * Determine if error is recoverable
 */
export function isRecoverableError(error) {
  const recoverableErrorCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT,
    ERROR_CODES.SERVER_ERROR,
  ];

  return recoverableErrorCodes.includes(error.errorCode);
}

/**
 * Determine if error requires re-authentication
 */
export function requiresReAuth(error) {
  return error.errorCode === ERROR_CODES.UNAUTHENTICATED || 
         error.errorCode === ERROR_CODES.TOKEN_EXPIRED;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors) {
  if (!errors || typeof errors !== 'object') {
    return [];
  }

  return Object.entries(errors).map(([field, messages]) => ({
    field,
    messages: Array.isArray(messages) ? messages : [messages],
  }));
}
