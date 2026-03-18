import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import logger from "./lib/logger";
import pricesRouter from "./routes/prices";
import quotesRouter from "./routes/quotes";
import importRouter from "./routes/import";
import customersRouter from "./routes/customers";
import activitiesRouter from "./routes/activities";

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => (req as unknown as { url: string }).url === "/api/health" } }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "gg-internal-api" });
});

app.use("/api/prices", pricesRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/import", importRouter);
app.use("/api/customers", customersRouter);
app.use("/api/activities", activitiesRouter);

export default app;
