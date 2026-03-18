import express from "express";
import cors from "cors";
import pricesRouter from "./routes/prices";
import quotesRouter from "./routes/quotes";
import { closeDatabase } from "./db";

const app = express();
const PORT = parseInt(process.env.PORT || "3001");

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "parker-api" });
});

app.use("/api/prices", pricesRouter);
app.use("/api/quotes", quotesRouter);

const server = app.listen(PORT, () => {
  process.stdout.write(`Parker API running on port ${PORT}\n`);
});

process.on("SIGTERM", () => {
  closeDatabase();
  server.close();
});

export default app;
