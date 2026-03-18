import app from "./app";
import logger from "./lib/logger";
import { closeDatabase } from "./db";

const PORT = parseInt(process.env.PORT || "3001");

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "Georgia Gulf Internal API started");
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down");
  closeDatabase();
  server.close();
});
