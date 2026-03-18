import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { SulfurGrade, SulfurForm, QuotePricing } from "../types";
import { BENCHMARK_LABELS, GRADE_LABELS, FORM_LABELS } from "../types";
import type { Customer } from "../types/customer";
import { quotesApi } from "../services/api";
import { customersApi } from "../services/customerApi";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTotal(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function QuoteBuilder() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_id: null as number | null,
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

  // Customer autocomplete
  const [customerSearch, setCustomerSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customerSearch.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await customersApi.list({ search: customerSearch });
        setSuggestions(results.slice(0, 8));
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectCustomer = (c: Customer) => {
    setForm((prev) => ({
      ...prev,
      customer_id: c.id,
      customer_name: c.contact_name || c.company_name,
      customer_company: c.company_name,
    }));
    setCustomerSearch(c.company_name);
    setShowSuggestions(false);
    setPreview(null);
  };

  const clearCustomer = () => {
    setForm((prev) => ({ ...prev, customer_id: null, customer_name: "", customer_company: "" }));
    setCustomerSearch("");
    setPreview(null);
  };

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
        customer_id: form.customer_id ?? undefined,
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

          <div className="form-group">
            <label className="form-label">Customer (search or type manually)</label>
            <div style={{ position: "relative" }} ref={suggestionsRef}>
              <input
                className="form-input"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowSuggestions(true);
                  if (form.customer_id) clearCustomer();
                }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder="Search customers or type company name..."
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {suggestions.map((c) => (
                    <div
                      key={c.id}
                      className="autocomplete-item"
                      onClick={() => selectCustomer(c)}
                    >
                      <div style={{ fontWeight: 500 }}>{c.company_name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {c.contact_name && `${c.contact_name} - `}{c.city}, {c.state}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {form.customer_id && (
              <div style={{ fontSize: 12, color: "var(--success)", marginTop: 4 }}>
                Linked to customer #{form.customer_id}: {form.customer_company}
                <span
                  style={{ marginLeft: 8, color: "var(--text-muted)", cursor: "pointer", textDecoration: "underline" }}
                  onClick={clearCustomer}
                >
                  clear
                </span>
              </div>
            )}
          </div>

          {!form.customer_id && (
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
          )}

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
