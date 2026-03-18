import express from "express";
import cors from "cors";
import pricesRouter from "./routes/prices";
import quotesRouter from "./routes/quotes";
import importRouter from "./routes/import";
import customersRouter from "./routes/customers";
import { closeDatabase } from "./db";

const app = express();
const PORT = parseInt(process.env.PORT || "3001");

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "gg-internal-api" });
});

app.use("/api/prices", pricesRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/import", importRouter);
app.use("/api/customers", customersRouter);

const server = app.listen(PORT, () => {
  process.stdout.write(`Georgia Gulf Internal API running on port ${PORT}\n`);
});

process.on("SIGTERM", () => {
  closeDatabase();
  server.close();
});

export default app;
