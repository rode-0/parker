import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Customer, CustomerType, CustomerPriority } from "../types/customer";
import {
  CUSTOMER_TYPE_LABELS, PRIORITY_LABELS,
  PRIORITY_COLORS, CUSTOMER_TYPE_COLORS,
} from "../types/customer";
import { customersApi } from "../services/customerApi";

type ColorMode = "priority" | "type";

function createPinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "custom-pin",
    html: `<div style="
      width: 12px; height: 12px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function getColor(customer: Customer, mode: ColorMode): string {
  if (mode === "priority") return PRIORITY_COLORS[customer.priority] || "#9ca3af";
  return CUSTOMER_TYPE_COLORS[customer.customer_type] || "#9ca3af";
}

function CustomerMap() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [colorMode, setColorMode] = useState<ColorMode>("priority");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    customersApi
      .getForMap({
        customer_type: typeFilter || undefined,
        priority: priorityFilter || undefined,
      })
      .then(setCustomers)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [typeFilter, priorityFilter]);

  const legend = colorMode === "priority"
    ? Object.entries(PRIORITY_LABELS) as [CustomerPriority, string][]
    : Object.entries(CUSTOMER_TYPE_LABELS) as [CustomerType, string][];

  const legendColors = colorMode === "priority" ? PRIORITY_COLORS : CUSTOMER_TYPE_COLORS;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Customer Map</h2>
        <Link to="/customers" className="btn btn-secondary">List View</Link>
      </div>

      <div className="filter-bar">
        <div style={{ display: "flex", gap: 4 }}>
          <button
            className={`chart-tab ${colorMode === "priority" ? "active" : ""}`}
            onClick={() => setColorMode("priority")}
          >
            Color by Priority
          </button>
          <button
            className={`chart-tab ${colorMode === "type" ? "active" : ""}`}
            onClick={() => setColorMode("type")}
          >
            Color by Type
          </button>
        </div>
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
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {customers.length} customers on map
        </span>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading map data...</div>
      ) : (
        <>
          <div className="map-container" style={{ height: "calc(100vh - 240px)", minHeight: 400 }}>
            <MapContainer
              center={[39.83, -98.58]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {customers.map((c) => (
                <Marker
                  key={c.id}
                  position={[c.latitude!, c.longitude!]}
                  icon={createPinIcon(getColor(c, colorMode))}
                >
                  <Popup>
                    <div style={{ fontSize: 13, lineHeight: 1.6, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.company_name}</div>
                      {c.contact_name && <div>{c.contact_name}</div>}
                      <div>{c.city}, {c.state} {c.zip}</div>
                      <div style={{ marginTop: 6, borderTop: "1px solid #ddd", paddingTop: 6 }}>
                        <div>Type: {CUSTOMER_TYPE_LABELS[c.customer_type]}</div>
                        <div>Priority: {PRIORITY_LABELS[c.priority]}</div>
                        {c.annual_volume_mt && <div>Volume: {c.annual_volume_mt.toLocaleString()} MT/yr</div>}
                        {c.last_visit && <div>Last Visit: {c.last_visit}</div>}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            {legend.map(([key, label]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: (legendColors as Record<string, string>)[key],
                }} />
                <span style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CustomerMap;
