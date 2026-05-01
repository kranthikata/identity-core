import type { Request, Response, NextFunction } from "express";
import { isDevelopment } from "../config/env.js";

/**
 * Request Logger Middleware
 * Logs incoming requests with timing information
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();
  const { method, path, ip } = req;

  // Log request start in development
  if (isDevelopment) {
    console.log(`→ ${method} ${path} - ${new Date().toISOString()}`);
  }

  // Capture response finish
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusSymbol = statusCode >= 400 ? "✗" : "✓";

    const logMessage = `${statusSymbol} ${method} ${path} ${statusCode} - ${duration}ms`;

    if (isDevelopment) {
      console.log(logMessage);
    } else {
      // In production, log as structured JSON for log aggregation
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          method,
          path,
          statusCode,
          duration,
          ip,
        }),
      );
    }
  });

  next();
};
