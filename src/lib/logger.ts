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
  if (isEdge) {
    return pino(baseConfig);
  }
  if (isProd) {
    return pino(baseConfig);
  }
  return pino({
    ...baseConfig,
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
    },
  });
}

export const logger = createLogger();

export function withContext(ctx: Record<string, unknown>): Logger {
  return logger.child(ctx);
}
