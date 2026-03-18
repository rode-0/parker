import { useState, useEffect } from "react";
import type { SulfurPrice } from "../types";
import { BENCHMARK_LABELS } from "../types";
import { pricesApi } from "../services/api";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatRange(low: number, high: number): string {
  if (low === high) return formatPrice(low);
  return `${formatPrice(low)} - ${formatPrice(high)}`;
}

function PriceChart({ data }: { data: SulfurPrice[] }) {
  if (data.length < 2) return <div className="chart-area">Not enough data</div>;

  // Use midpoint of range for charting
  const prices = data.map((d) => Math.round((d.price_low_cents + d.price_high_cents) / 2));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const width = 800;
  const height = 250;
  const padX = 60;
  const padY = 30;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = prices.map((p, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - ((p - minPrice) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${padY + chartH} L ${points[0]!.x} ${padY + chartH} Z`;

  const gridLines = 5;
  const gridValues = Array.from({ length: gridLines }, (_, i) =>
    minPrice + (range * i) / (gridLines - 1)
  );

  return (
    <div className="chart-area">
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {gridValues.map((val, i) => {
          const y = padY + chartH - ((val - minPrice) / range) * chartH;
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} className="chart-grid-line" />
              <text x={padX - 8} y={y + 4} textAnchor="end" className="chart-label">
                ${(val / 100).toFixed(0)}
              </text>
            </g>
          );
        })}
        <path d={areaPath} className="chart-area-fill" />
        <path d={linePath} className="chart-line" />
      </svg>
    </div>
  );
}

function Dashboard() {
  const [prices, setPrices] = useState<SulfurPrice[]>([]);
  const [history, setHistory] = useState<SulfurPrice[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState("vancouver_fob");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    pricesApi.getLatest().then(setPrices).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    pricesApi.getHistory(selectedBenchmark, 365).then(setHistory).catch(() => setHistory([]));
  }, [selectedBenchmark]);

  if (loading) return <div className="loading">Loading prices...</div>;
  if (error) return <div className="error">{error}</div>;

  const benchmarks = prices.map((p) => p.benchmark);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Price Dashboard</h2>
      </div>

      <div className="price-grid">
        {prices.map((p) => (
          <div
            key={p.benchmark}
            className="price-card"
            onClick={() => setSelectedBenchmark(p.benchmark)}
            style={{ cursor: "pointer", borderColor: p.benchmark === selectedBenchmark ? "var(--accent)" : undefined }}
          >
            <div className="benchmark">
              {BENCHMARK_LABELS[p.benchmark] || p.benchmark}
            </div>
            <div className="price">
              {formatRange(p.price_low_cents, p.price_high_cents)}
              <span className="unit">/MT</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>{p.delivery_term}</span>
              <span style={{ color: "var(--text-muted)" }}>
                {p.source === "acuity" ? "Acuity" : p.source}
              </span>
              <span style={{ color: "var(--text-muted)" }}>{p.recorded_at}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <div className="card-header">
          <h3 className="card-title">
            {BENCHMARK_LABELS[selectedBenchmark] || selectedBenchmark} - Price History
          </h3>
        </div>
        <div className="chart-tabs">
          {benchmarks.map((key) => (
            <button
              key={key}
              className={`chart-tab ${key === selectedBenchmark ? "active" : ""}`}
              onClick={() => setSelectedBenchmark(key)}
            >
              {BENCHMARK_LABELS[key] || key}
            </button>
          ))}
        </div>
        <PriceChart data={history} />
      </div>
    </div>
  );
}

export default Dashboard;
