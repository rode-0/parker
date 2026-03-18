import { Router, Request, Response } from "express";
import multer from "multer";
import {
  listCustomers, getCustomer, createCustomer, updateCustomer,
  deleteCustomer, getCustomersForMap, updateCustomerCoords,
} from "../services/customers";
import { previewImport, importCustomers } from "../services/customer-import";
import { geocodeAddress } from "../services/geocoder";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const VALID_TYPES = ["refinery", "fertilizer", "chemical", "mining", "other"];
const VALID_PRIORITIES = ["high", "medium", "low"];

router.get("/", async (req: Request, res: Response) => {
  const customers = await listCustomers({
    search: req.query.search as string | undefined,
    state: req.query.state as string | undefined,
    customer_type: req.query.customer_type as string | undefined,
    priority: req.query.priority as string | undefined,
  });
  res.json({ success: true, data: customers });
});

router.get("/map", async (req: Request, res: Response) => {
  const customers = await getCustomersForMap({
    customer_type: req.query.customer_type as string | undefined,
    priority: req.query.priority as string | undefined,
  });
  res.json({ success: true, data: customers });
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: "Invalid customer ID" });
    return;
  }
  const customer = await getCustomer(id);
  if (!customer) {
    res.status(404).json({ success: false, error: "Customer not found" });
    return;
  }
  res.json({ success: true, data: customer });
});

router.post("/", async (req: Request, res: Response) => {
  const { company_name, address, city, state } = req.body;
  if (!company_name || !address || !city || !state) {
    res.status(400).json({ success: false, error: "company_name, address, city, and state are required" });
    return;
  }
  const customer = await createCustomer(req.body);
  res.status(201).json({ success: true, data: customer });
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: "Invalid customer ID" });
    return;
  }
  const customer = await updateCustomer(id, req.body);
  if (!customer) {
    res.status(404).json({ success: false, error: "Customer not found" });
    return;
  }
  res.json({ success: true, data: customer });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: "Invalid customer ID" });
    return;
  }
  const deleted = await deleteCustomer(id);
  if (!deleted) {
    res.status(404).json({ success: false, error: "Customer not found" });
    return;
  }
  res.json({ success: true, data: { deleted: true } });
});

router.post("/import/preview", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "No file uploaded" });
    return;
  }
  const ext = req.file.originalname.toLowerCase();
  if (!ext.endsWith(".xlsx") && !ext.endsWith(".csv") && !ext.endsWith(".xls")) {
    res.status(400).json({ success: false, error: "File must be .xlsx, .xls, or .csv" });
    return;
  }
  try {
    const preview = previewImport(req.file.buffer, req.file.originalname);
    res.json({ success: true, data: preview });
  } catch (e) {
    res.status(400).json({ success: false, error: e instanceof Error ? e.message : "Failed to parse file" });
  }
});

router.post("/import", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "No file uploaded" });
    return;
  }
  const mappingStr = req.body.mapping;
  if (!mappingStr) {
    res.status(400).json({ success: false, error: "Column mapping is required" });
    return;
  }
  let mapping: Record<string, string>;
  try {
    mapping = JSON.parse(mappingStr);
  } catch {
    res.status(400).json({ success: false, error: "Invalid mapping JSON" });
    return;
  }
  if (!mapping.company_name) {
    res.status(400).json({ success: false, error: "company_name mapping is required" });
    return;
  }
  try {
    const result = await importCustomers(req.file.buffer, req.file.originalname, mapping);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : "Import failed" });
  }
});

router.post("/:id/geocode", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: "Invalid customer ID" });
    return;
  }
  const customer = await getCustomer(id);
  if (!customer) {
    res.status(404).json({ success: false, error: "Customer not found" });
    return;
  }
  const geo = await geocodeAddress(
    customer.address, customer.city, customer.state, customer.zip, customer.country
  );
  if (!geo) {
    res.status(422).json({ success: false, error: "Could not geocode address" });
    return;
  }
  await updateCustomerCoords(id, geo.latitude, geo.longitude);
  const updated = await getCustomer(id);
  res.json({ success: true, data: updated });
});

export default router;
