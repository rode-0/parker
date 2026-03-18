import { Router, Request, Response } from "express";
import type { CreateQuoteInput, SulfurGrade, SulfurForm, PricingBenchmark } from "../types";
import { createQuote, getQuote, listQuotes, updateQuoteStatus, deleteQuote } from "../services/quotes";
import { calculateQuotePrice } from "../services/pricing";

const router = Router();

// Benchmarks are dynamic based on imported data
const VALID_GRADES = ["bright_yellow", "dark", "recovered"];
const VALID_FORMS = ["molten", "prills", "granular", "blocks"];
const VALID_STATUSES = ["draft", "sent", "accepted", "expired"];

function validateQuoteInput(body: Record<string, unknown>): string | null {
  if (!body.customer_name || typeof body.customer_name !== "string") return "customer_name is required";
  if (!body.customer_company || typeof body.customer_company !== "string") return "customer_company is required";
  if (!body.benchmark || typeof body.benchmark !== "string") return "benchmark is required";
  if (!VALID_GRADES.includes(body.grade as string)) return "Invalid grade";
  if (!VALID_FORMS.includes(body.form as string)) return "Invalid form";
  if (typeof body.quantity_mt !== "number" || body.quantity_mt <= 0) return "quantity_mt must be positive";
  if (typeof body.freight_cents !== "number" || body.freight_cents < 0) return "freight_cents must be non-negative";
  return null;
}

router.get("/", async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  if (status && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ success: false, error: "Invalid status filter" });
    return;
  }
  const quotes = await listQuotes(status);
  res.json({ success: true, data: quotes });
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: "Invalid quote ID" });
    return;
  }
  const quote = await getQuote(id);
  if (!quote) {
    res.status(404).json({ success: false, error: "Quote not found" });
    return;
  }
  res.json({ success: true, data: quote });
});

router.post("/", async (req: Request, res: Response) => {
  const error = validateQuoteInput(req.body);
  if (error) {
    res.status(400).json({ success: false, error });
    return;
  }

  const input: CreateQuoteInput = {
    customer_name: req.body.customer_name,
    customer_company: req.body.customer_company,
    benchmark: req.body.benchmark,
    grade: req.body.grade,
    form: req.body.form,
    quantity_mt: req.body.quantity_mt,
    freight_cents: req.body.freight_cents,
    notes: req.body.notes,
  };

  const quote = await createQuote(input);
  res.status(201).json({ success: true, data: quote });
});

router.post("/preview", async (req: Request, res: Response) => {
  const error = validateQuoteInput(req.body);
  if (error) {
    res.status(400).json({ success: false, error });
    return;
  }

  const pricing = await calculateQuotePrice(
    req.body.benchmark as PricingBenchmark,
    req.body.grade as SulfurGrade,
    req.body.form as SulfurForm,
    req.body.quantity_mt,
    req.body.freight_cents
  );

  res.json({ success: true, data: pricing });
});

router.patch("/:id/status", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: "Invalid quote ID" });
    return;
  }

  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ success: false, error: "Invalid status" });
    return;
  }

  const quote = await updateQuoteStatus(id, status);
  if (!quote) {
    res.status(404).json({ success: false, error: "Quote not found" });
    return;
  }
  res.json({ success: true, data: quote });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: "Invalid quote ID" });
    return;
  }
  const deleted = await deleteQuote(id);
  if (!deleted) {
    res.status(404).json({ success: false, error: "Quote not found" });
    return;
  }
  res.json({ success: true, data: { deleted: true } });
});

export default router;
