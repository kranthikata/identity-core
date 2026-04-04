import "dotenv/config";

const NODE_ENVS = ["development", "production"] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

const parseNodeEnv = (raw: string | undefined): NodeEnv => {
  if (raw === undefined || raw.trim() === "") {
    throw new Error("NODE_ENV is required (development | production).");
  }
  const value = raw.toLowerCase().trim();
  if (!NODE_ENVS.includes(value as NodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV: expected development or production, got ${JSON.stringify(raw)}`,
    );
  }
  return value as NodeEnv;
};

const parsePort = (raw: string | undefined): number => {
  const fallback = 5000;
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const port = Number(raw);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error(
      `PORT must be an integer 1–65535, got ${JSON.stringify(raw)}`,
    );
  }
  if (port !== Math.floor(port)) {
    return Math.floor(port);
  }
  return port;
};

const requireString = (name: string, raw: string | undefined): string => {
  if (raw === undefined || raw.trim() === "") {
    throw new Error(`${name} is required.`);
  }
  return raw.trim();
};

const parsePositiveIntWithFallback = (
  name: string,
  raw: string | number | undefined,
  fallback: number,
  min: number,
): number | undefined => {
  if (raw === undefined || raw === null) {
    return fallback;
  }

  if (typeof raw === "number") {
    return Math.floor(raw);
  }

  if (typeof raw === "string" && raw.trim() === "") {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value < min) {
    throw new Error(
      `${name} must be a number >= ${min}, got ${JSON.stringify(raw)}`,
    );
  }

  if (value !== Math.floor(value)) {
    console.warn(
      `Config value "${value}" is not an integer; truncating to ${Math.floor(value)}.`,
    );
  }
  return Math.floor(value);
};

/**
 * Validated process environment. This module is imported early so `.env` is loaded
 * and invalid configuration fails before the server accepts traffic.
 */
export const env = {
  NODE_ENV: parseNodeEnv(process.env.NODE_ENV),
  PORT: parsePort(process.env.PORT),
  DATABASE_URL: requireString("DATABASE_URL", process.env.DATABASE_URL),
  DB_POOL_MAX: parsePositiveIntWithFallback(
    "DB_POOL_MAX",
    process.env.DB_POOL_MAX,
    20,
    1,
  ),
  DB_CONNECTION_TIMEOUT: parsePositiveIntWithFallback(
    "DB_CONNECTION_TIMEOUT",
    process.env.DB_CONNECTION_TIMEOUT,
    5000,
    1,
  ),
  DB_IDLE_TIMEOUT: parsePositiveIntWithFallback(
    "DB_IDLE_TIMEOUT",
    process.env.DB_IDLE_TIMEOUT,
    30000,
    1,
  ),
  DB_MAX_LIFETIME: parsePositiveIntWithFallback(
    "DB_MAX_LIFETIME",
    process.env.DB_MAX_LIFETIME,
    1800,
    1,
  ),
} as const;

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
