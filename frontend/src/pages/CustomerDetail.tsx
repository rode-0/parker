import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Customer } from "../types/customer";
import type { Quote } from "../types";
import { CUSTOMER_TYPE_LABELS, PRIORITY_LABELS } from "../types/customer";
import { customersApi } from "../services/customerApi";
import { quotesApi } from "../services/api";
import { activitiesApi, type Activity } from "../services/activityApi";
import { BENCHMARK_LABELS } from "../types";

type Tab = "info" | "quotes" | "activity";

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  visit: "Visit",
  call: "Call",
  email: "Email",
  note: "Note",
};

function formatTotal(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id || "0");

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tab, setTab] = useState<Tab>("info");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Activity form
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({
    type: "visit" as string,
    date: new Date().toISOString().slice(0, 10),
    duration_minutes: 90,
    notes: "",
  });

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([
      customersApi.get(customerId),
      quotesApi.list({ customer_id: customerId }),
      activitiesApi.getByCustomer(customerId),
    ])
      .then(([c, q, a]) => {
        setCustomer(c);
        // quotesApi.list returns all quotes; filter client-side for this customer
        setQuotes(Array.isArray(q) ? q : []);
        setActivities(a);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [customerId]);

  const handleLogActivity = async () => {
    try {
      await activitiesApi.create({
        customer_id: customerId,
        type: activityForm.type,
        date: activityForm.date,
        duration_minutes: activityForm.duration_minutes || undefined,
        notes: activityForm.notes || undefined,
      });
      const [updatedCustomer, updatedActivities] = await Promise.all([
        customersApi.get(customerId),
        activitiesApi.getByCustomer(customerId),
      ]);
      setCustomer(updatedCustomer);
      setActivities(updatedActivities);
      setShowActivityForm(false);
      setActivityForm({ type: "visit", date: new Date().toISOString().slice(0, 10), duration_minutes: 90, notes: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log activity");
    }
  };

  if (loading) return <div className="loading">Loading customer...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!customer) return <div className="error">Customer not found</div>;

  const daysSinceVisit = customer.last_visit
    ? Math.floor((Date.now() - new Date(customer.last_visit).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{customer.company_name}</h2>
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            {customer.city}, {customer.state} | {CUSTOMER_TYPE_LABELS[customer.customer_type]} | {PRIORITY_LABELS[customer.priority]} Priority
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => { setShowActivityForm(true); setTab("activity"); }}>
            Log Activity
          </button>
          <Link to="/customers" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>

      <div className="chart-tabs" style={{ marginBottom: 20 }}>
        {(["info", "quotes", "activity"] as Tab[]).map((t) => (
          <button key={t} className={`chart-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "info" ? "Info" : t === "quotes" ? `Quotes (${quotes.length})` : `Activity (${activities.length})`}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="card">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div className="quote-line"><span className="label">Contact</span><span className="value">{customer.contact_name || "—"}</span></div>
              <div className="quote-line"><span className="label">Email</span><span className="value">{customer.email || "—"}</span></div>
              <div className="quote-line"><span className="label">Phone</span><span className="value">{customer.phone || "—"}</span></div>
              <div className="quote-line"><span className="label">Address</span><span className="value">{customer.address}</span></div>
              <div className="quote-line"><span className="label">Location</span><span className="value">{customer.city}, {customer.state} {customer.zip}</span></div>
            </div>
            <div>
              <div className="quote-line"><span className="label">Type</span><span className="value">{CUSTOMER_TYPE_LABELS[customer.customer_type]}</span></div>
              <div className="quote-line"><span className="label">Priority</span><span className="value">{PRIORITY_LABELS[customer.priority]}</span></div>
              <div className="quote-line"><span className="label">Annual Volume</span><span className="value">{customer.annual_volume_mt?.toLocaleString() ?? "—"} MT</span></div>
              <div className="quote-line">
                <span className="label">Last Visit</span>
                <span className="value">
                  {customer.last_visit ?? "Never"}
                  {daysSinceVisit != null && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: daysSinceVisit > 90 ? "var(--danger)" : daysSinceVisit > 30 ? "var(--warning)" : "var(--success)" }}>
                      ({daysSinceVisit}d ago)
                    </span>
                  )}
                </span>
              </div>
              <div className="quote-line"><span className="label">Coordinates</span><span className="value">{customer.latitude != null ? `${customer.latitude.toFixed(4)}, ${customer.longitude?.toFixed(4)}` : "Not geocoded"}</span></div>
            </div>
          </div>
          {customer.notes && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 14 }}>{customer.notes}</div>
            </div>
          )}
        </div>
      )}

      {tab === "quotes" && (
        <div className="card">
          {quotes.length === 0 ? (
            <div className="empty" style={{ padding: 32 }}>
              No quotes for this customer.{" "}
              <Link to="/quotes/new" style={{ color: "var(--accent)" }}>Create one</Link>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Benchmark</th>
                    <th>Grade / Form</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id}>
                      <td>#{q.id}</td>
                      <td>{BENCHMARK_LABELS[q.benchmark] || q.benchmark}</td>
                      <td>{q.grade} / {q.form}</td>
                      <td>{q.quantity_mt.toLocaleString()} MT</td>
                      <td style={{ fontWeight: 600 }}>{formatTotal(q.total_cents)}</td>
                      <td><span className={`badge badge-${q.status}`}>{q.status}</span></td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{q.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div>
          {showActivityForm && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>Log Activity</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={activityForm.type} onChange={(e) => setActivityForm((p) => ({ ...p, type: e.target.value }))}>
                    {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={activityForm.date} onChange={(e) => setActivityForm((p) => ({ ...p, date: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input type="number" className="form-input" value={activityForm.duration_minutes} onChange={(e) => setActivityForm((p) => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} />
                </div>
                <div></div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={activityForm.notes} onChange={(e) => setActivityForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Meeting notes, follow-up items..." />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-primary" onClick={handleLogActivity}>Save</button>
                <button className="btn btn-secondary" onClick={() => setShowActivityForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="card">
            {activities.length === 0 ? (
              <div className="empty" style={{ padding: 32 }}>No activity logged yet.</div>
            ) : (
              <div>
                {activities.map((a) => (
                  <div key={a.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span className={`badge badge-${a.type === "visit" ? "accepted" : a.type === "call" ? "sent" : "draft"}`}>
                          {ACTIVITY_TYPE_LABELS[a.type]}
                        </span>
                        <span style={{ marginLeft: 12, fontSize: 13, color: "var(--text-muted)" }}>{a.date}</span>
                        {a.duration_minutes && (
                          <span style={{ marginLeft: 12, fontSize: 13, color: "var(--text-muted)" }}>{a.duration_minutes} min</span>
                        )}
                      </div>
                    </div>
                    {a.notes && <div style={{ marginTop: 6, fontSize: 14, color: "var(--text-secondary)" }}>{a.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDetail;
