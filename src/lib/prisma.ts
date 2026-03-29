import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

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

// Fail Fast: Check for the connection string immediately
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. System startup aborted.");
}

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV is not defined. System startup aborted.");
}

const parsePositiveIntOrDefault = (
  value: string | number | undefined,
  fallback: number,
  min = 1,
) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }

  if (parsed !== Math.floor(parsed)) {
    console.warn(
      `Config value "${value}" is not an integer; truncating to ${Math.floor(parsed)}.`,
    );
  }

  return Math.floor(parsed);
};

const ALL_NODE_ENV = ["development", "production"] as const;

type NodeEnv = (typeof ALL_NODE_ENV)[number];

const raw = process.env.NODE_ENV.toLowerCase().trim();

if (!ALL_NODE_ENV.includes(raw as NodeEnv)) {
  throw new Error(
    `Invalid NODE_ENV value, expected: development or production, found: ${process.env.NODE_ENV}`,
  );
}

const nodeEnv = raw as NodeEnv;
const isDevelopment = nodeEnv === "development";

const prismaClientSingleton = () => {
  const DEFAULT_POOL_SIZE = isDevelopment ? 5 : 20;
  // CONFIGURE THE CONNECTION POOL (The "Pipes" to our Data)
  const adapter = new PrismaPg({
    // DATABASE URL:
    connectionString: process.env.DATABASE_URL,

    // MAX: Concurrency ceiling
    // How many simultaneous conversations can the app have with the DB.
    // DEFAULT_POOL_SIZE is the "Sweet Spot" for high traffic without overloading the DB CPU.
    max: parsePositiveIntOrDefault(process.env.DB_POOL_MAX, DEFAULT_POOL_SIZE),

    // TIMEOUT: Fail-Fast Strategy
    // If all 20 pipes are busy, how long should a user wait in the "queue"?
    // 5 seconds ensures we don't hang the server during a database spike.
    connectionTimeoutMillis: parsePositiveIntOrDefault(
      process.env.DB_CONNECTION_TIMEOUT,
      5000,
    ),

    // IDLE: Resource Optimization
    // If a pipe hasn't been used for 30 seconds, we close it to save DB RAM.
    // This keeps the infrastructure "Elastic" and cost-efficient.
    idleTimeoutMillis: parsePositiveIntOrDefault(
      process.env.DB_IDLE_TIMEOUT,
      30000,
    ),

    // LIFETIME: System Hygiene
    // Every 30 minutes, we retire old pipes and open fresh ones.
    // This prevents memory leaks and helps the app "discover" new DB nodes after a crash.
    maxLifetimeSeconds: parsePositiveIntOrDefault(
      process.env.DB_MAX_LIFETIME,
      1800,
    ),
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
