import pino, { type Logger } from "pino";

const isProd = process.env.NODE_ENV === "production";
const isEdge = process.env.NEXT_RUNTIME === "edge";

const baseConfig = {
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  base: {
    env: process.env.NODE_ENV,
    service: "wealthview-th",
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
};

function createLogger(): Logger {
  if (isEdge || isProd) {
    return pino(baseConfig);
  }
  // Dev: render pretty logs through an in-process pino-pretty stream rather
  // than a `transport` worker thread. Under Next.js dev the worker thread can
  // exit, after which every logger call throws "the worker has exited" and
  // turns into an uncaughtException (a logged error then 500s the request).
  // An in-process stream sidesteps that entirely.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pretty = require("pino-pretty");
    return pino(
      baseConfig,
      pretty({ colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" })
    );
  } catch {
    // pino-pretty unavailable → plain JSON to stdout, still no worker thread.
    return pino(baseConfig);
  }
}

export const logger = createLogger();

export function withContext(ctx: Record<string, unknown>): Logger {
  return logger.child(ctx);
}
