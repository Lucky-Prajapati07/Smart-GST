/**
 * API Constants
 * HTTP status codes, error messages, success messages
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_MESSAGES = {
  // Common
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_INPUT: 'Invalid input provided',
  INTERNAL_ERROR: 'Internal server error',
  CONFLICT: 'Resource already exists',

  // Business
  BUSINESS_NOT_FOUND: 'Business not found',
  BUSINESS_EXISTS: 'Business already exists',

  // Client
  CLIENT_NOT_FOUND: 'Client not found',
  CLIENT_EXISTS: 'Client with this email already exists',

  // Invoice
  INVOICE_NOT_FOUND: 'Invoice not found',
  INVOICE_EXISTS: 'Invoice with this number already exists',

  // Transaction
  TRANSACTION_NOT_FOUND: 'Transaction not found',

  // Expense
  EXPENSE_NOT_FOUND: 'Expense not found',

  // Settings
  SETTINGS_NOT_FOUND: 'Settings not found',

  // GST Filing
  GST_FILING_NOT_FOUND: 'GST filing not found',
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  FETCHED: 'Resource fetched successfully',
} as const;

export const CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
] as const;

export const API_LIMITS = {
  MAX_BODY_SIZE: '5mb',
  MAX_HEADER_SIZE: 16384,
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;
