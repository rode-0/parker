import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SulfurGrade, SulfurForm, QuotePricing } from "../types";
import { BENCHMARK_LABELS, GRADE_LABELS, FORM_LABELS } from "../types";
import { quotesApi } from "../services/api";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTotal(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function QuoteBuilder() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: "",
    customer_company: "",
    benchmark: "vancouver_fob",
    grade: "bright_yellow" as SulfurGrade,
    sulfur_form: "prills" as SulfurForm,
    quantity_mt: 500,
    freight_cents: 1200,
    notes: "",
  });
  const [preview, setPreview] = useState<QuotePricing | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setPreview(null);
  };

  const handlePreview = async () => {
    setError("");
    try {
      const pricing = await quotesApi.preview({
        customer_name: form.customer_name || "Preview",
        customer_company: form.customer_company || "Preview",
        benchmark: form.benchmark,
        grade: form.grade,
        form: form.sulfur_form,
        quantity_mt: form.quantity_mt,
        freight_cents: form.freight_cents,
      });
      setPreview(pricing);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    }
  };

  const handleSubmit = async () => {
    if (!form.customer_name || !form.customer_company) {
      setError("Customer name and company are required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await quotesApi.create({
        customer_name: form.customer_name,
        customer_company: form.customer_company,
        benchmark: form.benchmark,
        grade: form.grade,
        form: form.sulfur_form,
        quantity_mt: form.quantity_mt,
        freight_cents: form.freight_cents,
        notes: form.notes,
      });
      navigate("/quotes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create quote");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">New Quote</h2>
      </div>

      <div className="builder-layout">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Quote Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                className="form-input"
                value={form.customer_name}
                onChange={(e) => updateField("customer_name", e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input
                className="form-input"
                value={form.customer_company}
                onChange={(e) => updateField("customer_company", e.target.value)}
                placeholder="Acme Chemicals"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pricing Benchmark</label>
              <select
                className="form-select"
                value={form.benchmark}
                onChange={(e) => updateField("benchmark", e.target.value)}
              >
                {Object.entries(BENCHMARK_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Grade</label>
              <select
                className="form-select"
                value={form.grade}
                onChange={(e) => updateField("grade", e.target.value)}
              >
                {Object.entries(GRADE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Form</label>
              <select
                className="form-select"
                value={form.sulfur_form}
                onChange={(e) => updateField("sulfur_form", e.target.value)}
              >
                {Object.entries(FORM_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity (Metric Tons)</label>
              <input
                type="number"
                className="form-input"
                value={form.quantity_mt}
                onChange={(e) => updateField("quantity_mt", parseFloat(e.target.value) || 0)}
                min="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Freight Cost (cents/MT)</label>
              <input
                type="number"
                className="form-input"
                value={form.freight_cents}
                onChange={(e) => updateField("freight_cents", parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div></div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Additional terms, delivery schedule, etc."
            />
          </div>

          {error && <div className="error" style={{ textAlign: "left", padding: "8px 0" }}>{error}</div>}

          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-secondary" onClick={handlePreview}>
              Preview Pricing
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating..." : "Create Quote"}
            </button>
          </div>
        </div>

        <div>
          <div className="quote-preview">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Price Breakdown</h3>
            {preview ? (
              <>
                <div className="quote-line">
                  <span className="label">Base Price (per MT)</span>
                  <span className="value">{formatPrice(preview.base_price_cents)}</span>
                </div>
                <div className="quote-line">
                  <span className="label">Grade Adjustment</span>
                  <span className={`value ${preview.grade_adj_cents >= 0 ? "positive" : "negative"}`}>
                    {preview.grade_adj_cents >= 0 ? "+" : ""}{formatPrice(preview.grade_adj_cents)}
                  </span>
                </div>
                <div className="quote-line">
                  <span className="label">Form Adjustment</span>
                  <span className={`value ${preview.form_adj_cents >= 0 ? "positive" : "negative"}`}>
                    {preview.form_adj_cents >= 0 ? "+" : ""}{formatPrice(preview.form_adj_cents)}
                  </span>
                </div>
                <div className="quote-line">
                  <span className="label">Freight</span>
                  <span className="value">+{formatPrice(preview.freight_cents)}</span>
                </div>
                <div className="quote-line">
                  <span className="label">Volume Discount</span>
                  <span className="value negative">
                    -{formatPrice(preview.volume_discount_cents)}
                  </span>
                </div>
                <div className="quote-line total">
                  <span className="label">Total ({form.quantity_mt} MT)</span>
                  <span className="value">{formatTotal(preview.total_cents)}</span>
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Click "Preview Pricing" to see the breakdown
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuoteBuilder;
