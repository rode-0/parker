import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
    : undefined,
});

export default logger;

export const priceLogger = logger.child({ module: "pricing" });
export const quoteLogger = logger.child({ module: "quotes" });
export const customerLogger = logger.child({ module: "customers" });
export const importLogger = logger.child({ module: "import" });
export const activityLogger = logger.child({ module: "activities" });
export const dbLogger = logger.child({ module: "database" });
export const geocodeLogger = logger.child({ module: "geocoder" });
