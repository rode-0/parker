import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import type { ImportPreview, CustomerImportResult } from "../types/customer";
import { CUSTOMER_FIELDS } from "../types/customer";
import { customersApi } from "../services/customerApi";

type Step = "upload" | "mapping" | "result";

function CustomerImport() {
  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CustomerImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    const ext = f.name.toLowerCase();
    if (!ext.endsWith(".xlsx") && !ext.endsWith(".csv") && !ext.endsWith(".xls")) {
      setError("Please upload an .xlsx, .xls, or .csv file");
      return;
    }
    setFile(f);
    setLoading(true);
    setError("");
    try {
      const prev = await customersApi.importPreview(f);
      setPreview(prev);
      setMapping(prev.suggested_mapping);
      setStep("mapping");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const res = await customersApi.importConfirm(file, mapping);
      setResult(res);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const updateMapping = (field: string, col: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (col === "") {
        delete next[field];
      } else {
        next[field] = col;
      }
      return next;
    });
  };

  if (step === "result" && result) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">Import Complete</h2>
        </div>
        <div className="card" style={{ borderColor: "var(--success)", marginBottom: 24 }}>
          <h3 className="card-title" style={{ color: "var(--success)", marginBottom: 16 }}>
            Customers Imported
          </h3>
          <div className="quote-line"><span className="label">Total Rows</span><span className="value">{result.total_rows}</span></div>
          <div className="quote-line"><span className="label">Imported</span><span className="value">{result.imported}</span></div>
          <div className="quote-line"><span className="label">Skipped</span><span className="value">{result.skipped}</span></div>
          <div className="quote-line"><span className="label">Geocoded</span><span className="value">{result.geocoded}</span></div>
          <div className="quote-line"><span className="label">Geocode Failed</span><span className="value">{result.geocode_failed}</span></div>
          {result.errors.length > 0 && (
            <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Warnings:</div>
              {result.errors.slice(0, 10).map((e, i) => <div key={i}>{e}</div>)}
              {result.errors.length > 10 && <div>...and {result.errors.length - 10} more</div>}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/customers" className="btn btn-primary">View Customers</Link>
          <Link to="/customers/map" className="btn btn-secondary">View Map</Link>
        </div>
      </div>
    );
  }

  if (step === "mapping" && preview) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">Map Columns</h2>
          <span style={{ color: "var(--text-muted)" }}>{preview.total_rows} rows found</span>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Column Mapping</h3>
          {CUSTOMER_FIELDS.map((f) => (
            <div className="mapping-row" key={f.key}>
              <div className="mapping-label">
                {f.label}
                {f.required && <span className="required-mark">*</span>}
              </div>
              <select
                className="form-select mapping-select"
                value={mapping[f.key] || ""}
                onChange={(e) => updateMapping(f.key, e.target.value)}
              >
                <option value="">-- Skip --</option>
                {preview.headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {preview.preview_rows.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="card-title" style={{ marginBottom: 16 }}>Preview (first 5 rows)</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {preview.headers.map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview_rows.map((row, i) => (
                    <tr key={i}>
                      {preview.headers.map((_, j) => (
                        <td key={j} style={{ fontSize: 13 }}>{String((row as unknown[])[j] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => { setStep("upload"); setPreview(null); setFile(null); }}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleImport} disabled={loading || !mapping.company_name}>
            {loading ? "Importing & Geocoding..." : `Import ${preview.total_rows} Customers`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Import Customers</h2>
      </div>

      <div
        className="card"
        style={{
          border: dragging ? "2px dashed var(--accent)" : "2px dashed var(--border)",
          textAlign: "center",
          padding: 48,
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {loading ? (
          <div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Parsing spreadsheet...</div>
            <div style={{ color: "var(--text-muted)" }}>Detecting columns and preparing preview</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>XLS</div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Drop your customer spreadsheet here</div>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Supports .xlsx, .xls, and .csv files. Columns are auto-detected.
            </div>
          </div>
        )}
      </div>

      {error && <div className="card" style={{ borderColor: "var(--danger)", marginTop: 24 }}>
        <div style={{ color: "var(--danger)" }}>{error}</div>
      </div>}
    </div>
  );
}

export default CustomerImport;
