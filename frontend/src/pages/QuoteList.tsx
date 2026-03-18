import { useState, useEffect } from "react";
import type { Quote } from "../types";
import { BENCHMARK_LABELS, GRADE_LABELS, FORM_LABELS } from "../types";
import { quotesApi } from "../services/api";

function formatTotal(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function QuoteList() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const data = await quotesApi.list(statusFilter || undefined);
      setQuotes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await quotesApi.updateStatus(id, status);
      fetchQuotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await quotesApi.delete(id);
      fetchQuotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete quote");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Quotes</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {["", "draft", "sent", "accepted", "expired"].map((s) => (
            <button
              key={s}
              className={`chart-tab ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading quotes...</div>
      ) : quotes.length === 0 ? (
        <div className="empty">No quotes found. Create your first quote to get started.</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Benchmark</th>
                  <th>Grade / Form</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id}>
                    <td>#{q.id}</td>
                    <td>
                      <div>{q.customer_name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{q.customer_company}</div>
                    </td>
                    <td>{BENCHMARK_LABELS[q.benchmark]}</td>
                    <td>
                      <div>{GRADE_LABELS[q.grade]}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{FORM_LABELS[q.form]}</div>
                    </td>
                    <td>{q.quantity_mt.toLocaleString()} MT</td>
                    <td style={{ fontWeight: 600 }}>{formatTotal(q.total_cents)}</td>
                    <td>
                      <span className={`badge badge-${q.status}`}>{q.status}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {q.status === "draft" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStatusChange(q.id, "sent")}
                          >
                            Send
                          </button>
                        )}
                        {q.status === "sent" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStatusChange(q.id, "accepted")}
                          >
                            Accept
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(q.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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

export default QuoteList;
