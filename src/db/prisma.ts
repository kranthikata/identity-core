import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { env, isDevelopment } from "../config/env.js";

/**
 * IDENTITY-CORE: Database Access Layer (DAL)
 * ------------------------------------------
 * ARCHITECTURAL PATTERN: Singleton
 * GOAL: Manage the lifecycle of PostgreSQL connections to prevent "Connection Exhaustion."
 * => Why a Singleton?
 * In development, tools like 'tsx' restart the server on every save. Without a singleton,
 * each restart creates a new pool of 20 connections. Eventually, PostgreSQL hits its
 * limit and crashes. This pattern persists one pool across those restarts.
 */

const prismaClientSingleton = () => {
  const DEFAULT_POOL_SIZE = isDevelopment ? 5 : 20;
  // CONFIGURE THE CONNECTION POOL (The "Pipes" to our Data)
  const adapter = new PrismaPg({
    // DATABASE URL:
    connectionString: env.DATABASE_URL,

    // MAX: Concurrency ceiling
    // How many simultaneous conversations can the app have with the DB.
    // DEFAULT_POOL_SIZE is the "Sweet Spot" for high traffic without overloading the DB CPU.
    max: env.DB_POOL_MAX ?? DEFAULT_POOL_SIZE,

    // TIMEOUT: Fail-Fast Strategy
    // If all 20 pipes are busy, how long should a user wait in the "queue"?
    // 5 seconds ensures we don't hang the server during a database spike.
    connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT,

    // IDLE: Resource Optimization
    // If a pipe hasn't been used for 30 seconds, we close it to save DB RAM.
    // This keeps the infrastructure "Elastic" and cost-efficient.
    idleTimeoutMillis: env.DB_IDLE_TIMEOUT,

    // LIFETIME: System Hygiene
    // Every 30 minutes, we retire old pipes and open fresh ones.
    // This prevents memory leaks and helps the app "discover" new DB nodes after a crash.
    maxLifetimeSeconds: env.DB_MAX_LIFETIME,
  });

  return new PrismaClient({
    adapter,
    // Add Logging: Essential for debugging SQL performance
    log: isDevelopment ? ["query", "error", "warn"] : ["error"],
  });
};

// --- GLOBAL BINDING (DEVELOPMENT ONLY) ---
// TypeScript setup to allow attaching a custom property to the NodeJS global object.
// We attach the client to the NodeJS 'global' object so it survives hot-reloads.
declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

// Reuse the existing instance if it exists (Dev mode), otherwise create a new one.
const prisma = isDevelopment
  ? (global.prismaGlobal ?? prismaClientSingleton())
  : prismaClientSingleton();

export default prisma;

/**
 * GRACEFUL SHUTDOWN (The "Clean Exit")
 *
 * SIGINT:
 * - Triggered when manually stop the process (Ctrl + C in terminal)
 * - Common during local development or manual server shutdown
 *
 * SIGTERM:
 * - Sent by process managers (Docker, Kubernetes, Cloud platforms)
 * - Indicates the system is requesting a graceful shutdown before killing the process
 *
 * Why handle these?
 * - Ensure we properly close DB connections
 * - Prevents "zombie connections" in PostgreSQL
 * - Avoids connection leaks during deployments or restarts
 */
let isShuttingDown = false;

const gracefulShutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    await prisma.$disconnect();
    console.log("Registry: Prisma disconnected gracefully.");
    process.exit(0);
  } catch (err) {
    console.error("Prisma failed to disconnect cleanly: ", err);
    process.exit(1);
  }
};

const registerShutdownHooks = () => {
  if (process.listenerCount("SIGINT") === 0) {
    process.on("SIGINT", gracefulShutdown);
  }

  if (process.listenerCount("SIGTERM") === 0) {
    process.on("SIGTERM", gracefulShutdown);
  }
};

registerShutdownHooks();

// In non-production environments, cache the instance on the global object.
if (isDevelopment) {
  global.prismaGlobal = prisma;
}
