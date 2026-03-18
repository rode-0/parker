import { useState, useEffect, useRef } from "react";
import type { ImportResult, ImportHistoryEntry } from "../types";
import { importApi } from "../services/api";

function Import() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    try {
      const data = await importApi.history();
      setHistory(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const data = await importApi.uploadAcuity(file);
      setResult(data);
      fetchHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Import Acuity Report</h2>
      </div>

      <div
        className="card"
        style={{
          border: dragging ? "2px dashed var(--accent)" : "2px dashed var(--border)",
          textAlign: "center",
          padding: 48,
          cursor: "pointer",
          marginBottom: 24,
          transition: "border-color 0.15s",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={handleInputChange}
        />
        {uploading ? (
          <div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Parsing report...</div>
            <div style={{ color: "var(--text-muted)" }}>Extracting price assessments, freight rates, and market data</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>PDF</div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              Drop your Acuity Regional Briefing PDF here
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              or click to browse. Supports US &amp; Canada Regional Briefing format.
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", marginBottom: 24 }}>
          <div style={{ color: "var(--danger)" }}>{error}</div>
        </div>
      )}

      {result && (
        <div className="card" style={{ borderColor: "var(--success)", marginBottom: 24 }}>
          <h3 className="card-title" style={{ color: "var(--success)", marginBottom: 16 }}>
            Import Successful
          </h3>
          <div style={{ fontSize: 14 }}>
            <div className="quote-line">
              <span className="label">Report Date</span>
              <span className="value">{result.report_date}</span>
            </div>
            <div className="quote-line">
              <span className="label">Sulphur Prices</span>
              <span className="value">{result.sulphur_prices} records</span>
            </div>
            <div className="quote-line">
              <span className="label">Sulphuric Acid Prices</span>
              <span className="value">{result.sulphuric_acid_prices} records</span>
            </div>
            <div className="quote-line">
              <span className="label">Freight Rates</span>
              <span className="value">{result.freight_rates} records</span>
            </div>
            <div className="quote-line">
              <span className="label">Related Markets</span>
              <span className="value">{result.related_markets} records</span>
            </div>
            <div className="quote-line">
              <span className="label">Exchange Rates</span>
              <span className="value">{result.exchange_rates} records</span>
            </div>
            <div className="quote-line total">
              <span className="label">Total Records</span>
              <span className="value">{result.total_records}</span>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Import History</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Report Date</th>
                  <th>Records</th>
                  <th>Imported At</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td style={{ fontSize: 13 }}>{h.filename}</td>
                    <td>{h.report_date}</td>
                    <td>{h.record_count}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{h.imported_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Import;
