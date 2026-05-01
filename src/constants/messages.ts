/**
 * Application Messages
 * Centralized message strings for consistency
 */
export const MESSAGES = {
  // Auth Messages
  AUTH: {
    REGISTER_SUCCESS: "User registered successfully",
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    INVALID_CREDENTIALS: "Invalid email or password",
    EMAIL_EXISTS: "Email already registered",
    USER_NOT_FOUND: "User not found",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access forbidden",
    TOKEN_EXPIRED: "Token has expired",
    TOKEN_INVALID: "Invalid token",
    TOKEN_MISSING: "Authentication token required",
  },

  // Validation Messages
  VALIDATION: {
    INVALID_EMAIL: "Please provide a valid email address",
    INVALID_PASSWORD: "Password must be at least 8 characters long",
    REQUIRED_FIELD: (field: string) => `${field} is required`,
    INVALID_FORMAT: (field: string) => `Invalid format for ${field}`,
  },

  // Server Messages
  SERVER: {
    INTERNAL_ERROR: "Internal server error",
    NOT_FOUND: (resource: string) => `${resource} not found`,
    RATE_LIMIT: "Too many requests, please try again later",
    SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  },

  // Success Messages
  SUCCESS: {
    RESOURCE_CREATED: (resource: string) => `${resource} created successfully`,
    RESOURCE_UPDATED: (resource: string) => `${resource} updated successfully`,
    RESOURCE_DELETED: (resource: string) => `${resource} deleted successfully`,
    OPERATION_SUCCESS: "Operation completed successfully",
  },
} as const;
