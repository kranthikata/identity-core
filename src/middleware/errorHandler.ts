import type { ErrorRequestHandler, RequestHandler } from "express";
import { HTTP } from "../constants/http.js";
import { MESSAGES } from "../constants/messages.js";
import { isDevelopment } from "../config/env.js";

/**
 * Custom Application Error
 * Standardized error class for the application
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized response
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req,
  res,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next,
): void => {
  // Default error response
  const errorResponse: {
    success: boolean;
    message: string;
    stack?: string | undefined;
  } = {
    success: false,
    message: MESSAGES.SERVER.INTERNAL_ERROR,
  };

  let statusCode: number = HTTP.INTERNAL_SERVER_ERROR;

  // Handle AppError instances (operational errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse.message = err.message;
  }

  // Handle specific error types
  if (err.name === "SyntaxError" && "body" in err) {
    statusCode = HTTP.BAD_REQUEST;
    errorResponse.message = "Invalid JSON payload";
  }

  // Include stack trace in development only
  if (isDevelopment) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(HTTP.NOT_FOUND).json({
    success: false,
    message: MESSAGES.SERVER.NOT_FOUND("Resource"),
  });
};
