import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Customer, CustomerType, CustomerPriority } from "../types/customer";
import { CUSTOMER_TYPE_LABELS, PRIORITY_LABELS } from "../types/customer";
import { customersApi } from "../services/customerApi";

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersApi.list({
        search: search || undefined,
        customer_type: typeFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setCustomers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter, priorityFilter]);

  const handleDelete = async (id: number) => {
    try {
      await customersApi.delete(id);
      fetchCustomers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Customers</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/customers/import" className="btn btn-primary">Import</Link>
          <Link to="/customers/map" className="btn btn-secondary">Map View</Link>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="form-input"
          placeholder="Search company, contact, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <select
          className="form-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ maxWidth: 160 }}
        >
          <option value="">All Types</option>
          {(Object.entries(CUSTOMER_TYPE_LABELS) as [CustomerType, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ maxWidth: 140 }}
        >
          <option value="">All Priority</option>
          {(Object.entries(PRIORITY_LABELS) as [CustomerPriority, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="empty">
          No customers found.{" "}
          <Link to="/customers/import" style={{ color: "var(--accent)" }}>Import your customer spreadsheet</Link> to get started.
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Volume (MT)</th>
                  <th>Last Visit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div>{c.company_name}</div>
                      {c.email && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.email}</div>}
                    </td>
                    <td>{c.contact_name}</td>
                    <td>
                      <div>{c.city}, {c.state}</div>
                      {c.latitude == null && (
                        <div style={{ fontSize: 11, color: "var(--danger)" }}>No coordinates</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${c.customer_type}`}>
                        {CUSTOMER_TYPE_LABELS[c.customer_type]}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.priority}`}>
                        {PRIORITY_LABELS[c.priority]}
                      </span>
                    </td>
                    <td>{c.annual_volume_mt?.toLocaleString() ?? "—"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{c.last_visit ?? "—"}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
                        Delete
                      </button>
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

export default Customers;
