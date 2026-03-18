import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

type FreightRate = { id: number; route: string; vessel_size: string; rate_low_cents: number; rate_high_cents: number; recorded_at: string };
type RelatedMarket = { id: number; market: string; unit: string; value_low: number; value_high: number; recorded_at: string };
type ExchangeRate = { id: number; currency: string; rate: number; recorded_at: string };

function formatRange(low: number, high: number, divisor = 100): string {
  const l = (low / divisor).toFixed(2);
  const h = (high / divisor).toFixed(2);
  return l === h ? `$${l}` : `$${l} - $${h}`;
}

function Markets() {
  const [freight, setFreight] = useState<FreightRate[]>([]);
  const [markets, setMarkets] = useState<RelatedMarket[]>([]);
  const [fx, setFx] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/prices/freight/latest`).then((r) => r.json()),
      fetch(`${API_URL}/prices/markets/latest`).then((r) => r.json()),
      fetch(`${API_URL}/prices/fx/latest`).then((r) => r.json()),
    ])
      .then(([f, m, e]) => {
        setFreight(f.data || []);
        setMarkets(m.data || []);
        setFx(e.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading market data...</div>;

  const hasData = freight.length > 0 || markets.length > 0 || fx.length > 0;
  if (!hasData) {
    return (
      <div>
        <div className="page-header"><h2 className="page-title">Markets</h2></div>
        <div className="empty">No market data yet. Import an Acuity report to populate freight rates, related markets, and exchange rates.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h2 className="page-title">Markets</h2></div>

      {markets.length > 0 && (
        <>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Related Markets</h3>
          <div className="price-grid" style={{ marginBottom: 32 }}>
            {markets.map((m) => (
              <div key={m.id} className="price-card">
                <div className="benchmark">{m.market}</div>
                <div className="price">
                  {m.value_low === m.value_high
                    ? m.value_low.toFixed(2)
                    : `${m.value_low.toFixed(2)} - ${m.value_high.toFixed(2)}`}
                  <span className="unit"> {m.unit}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{m.recorded_at}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {freight.length > 0 && (
        <>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Freight Rates</h3>
          <div className="card" style={{ marginBottom: 32 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Vessel Size</th>
                    <th>Rate ($/t)</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {freight.map((f) => (
                    <tr key={f.id}>
                      <td>{f.route}</td>
                      <td>{f.vessel_size}</td>
                      <td style={{ fontWeight: 600 }}>{formatRange(f.rate_low_cents, f.rate_high_cents)}</td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{f.recorded_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {fx.length > 0 && (
        <>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Exchange Rates (to USD)</h3>
          <div className="price-grid">
            {fx.map((e) => (
              <div key={e.id} className="price-card">
                <div className="benchmark">{e.currency}</div>
                <div className="price">{e.rate.toFixed(4)}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{e.recorded_at}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Markets;
