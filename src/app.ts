import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { HTTP } from "./constants/http.js";

const app: Application = express();

/**
 * ==========================================
 * GLOBAL MIDDLEWARE
 * ==========================================
 */

// Parse JSON request bodies
app.use(express.json());

// Log all incoming requests
app.use(requestLogger);

/**
 * ==========================================
 * HEALTH CHECK ROUTE
 * ==========================================
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(HTTP.OK).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

/**
 * ==========================================
 * ERROR HANDLING
 * ==========================================
 */

// Handle 404 for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * ==========================================
 * SERVER STARTUP
 * ==========================================
 */
const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server up and running at http://localhost:${PORT}`);
});
