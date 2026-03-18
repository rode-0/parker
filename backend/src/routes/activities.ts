import { Router, Request, Response } from "express";
import {
  createActivity, getActivitiesByCustomer, deleteActivity, getCustomersNeedingAttention,
} from "../services/activities";

const router = Router();

const VALID_TYPES = ["visit", "call", "email", "note"];

router.get("/customer/:customerId", async (req: Request, res: Response) => {
  const customerId = parseInt(req.params.customerId as string);
  if (isNaN(customerId)) {
    res.status(400).json({ success: false, error: "Invalid customer ID" });
    return;
  }
  const activities = await getActivitiesByCustomer(customerId);
  res.json({ success: true, data: activities });
});

router.post("/", async (req: Request, res: Response) => {
  const { customer_id, type, date, duration_minutes, notes } = req.body;

  if (!customer_id || !type || !date) {
    res.status(400).json({ success: false, error: "customer_id, type, and date are required" });
    return;
  }
  if (!VALID_TYPES.includes(type)) {
    res.status(400).json({ success: false, error: "type must be visit, call, email, or note" });
    return;
  }

  const activity = await createActivity({
    customer_id,
    type,
    date,
    duration_minutes,
    notes,
  });
  res.status(201).json({ success: true, data: activity });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: "Invalid activity ID" });
    return;
  }
  const deleted = await deleteActivity(id);
  if (!deleted) {
    res.status(404).json({ success: false, error: "Activity not found" });
    return;
  }
  res.json({ success: true, data: { deleted: true } });
});

router.get("/attention", async (_req: Request, res: Response) => {
  const customers = await getCustomersNeedingAttention();
  res.json({ success: true, data: customers });
});

export default router;
