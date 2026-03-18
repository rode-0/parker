import { useState, useEffect } from "react";
import type { SulfurPrice, PricingBenchmark } from "../types";
import { BENCHMARK_LABELS } from "../types";
import { pricesApi } from "../services/api";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function PriceChart({ data }: { data: SulfurPrice[] }) {
  if (data.length < 2) return <div className="chart-area">Not enough data</div>;

  const prices = data.map((d) => d.price_cents);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const width = 800;
  const height = 250;
  const padX = 60;
  const padY = 30;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - ((d.price_cents - minPrice) / range) * chartH,
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
  const [selectedBenchmark, setSelectedBenchmark] = useState<PricingBenchmark>("tampa_cfr");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    pricesApi.getLatest().then(setPrices).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    pricesApi.getHistory(selectedBenchmark, 90).then(setHistory).catch(() => setHistory([]));
  }, [selectedBenchmark]);

  if (loading) return <div className="loading">Loading prices...</div>;
  if (error) return <div className="error">{error}</div>;

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
            <div className="benchmark">{BENCHMARK_LABELS[p.benchmark]}</div>
            <div className="price">
              {formatPrice(p.price_cents)}
              <span className="unit">/MT</span>
            </div>
            <div className="change">{p.recorded_at}</div>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <div className="card-header">
          <h3 className="card-title">{BENCHMARK_LABELS[selectedBenchmark]} - 90 Day History</h3>
        </div>
        <div className="chart-tabs">
          {(Object.entries(BENCHMARK_LABELS) as [PricingBenchmark, string][]).map(([key, label]) => (
            <button
              key={key}
              className={`chart-tab ${key === selectedBenchmark ? "active" : ""}`}
              onClick={() => setSelectedBenchmark(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <PriceChart data={history} />
      </div>
    </div>
  );
}

export default Dashboard;
