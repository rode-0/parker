import { Router, Request, Response } from "express";
import multer from "multer";
import { importAcuityPdf, getImportHistory } from "../services/import";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/acuity", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "No file uploaded" });
    return;
  }

  if (!req.file.originalname.toLowerCase().endsWith(".pdf")) {
    res.status(400).json({ success: false, error: "File must be a PDF" });
    return;
  }

  try {
    const result = await importAcuityPdf(req.file.buffer, req.file.originalname);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : "Failed to parse PDF",
    });
  }
});

router.get("/history", async (_req: Request, res: Response) => {
  const history = await getImportHistory();
  res.json({ success: true, data: history });
});

export default router;
