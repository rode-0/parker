export type AcuityPriceRow = {
  benchmark: string;
  price_type: string;
  delivery_term: string;
  current_low_cents: number;
  current_high_cents: number;
  previous_low_cents: number;
  previous_high_cents: number;
  direction: string;
  year_ago_low_cents: number;
  year_ago_high_cents: number;
};

export type AcuityFreightRow = {
  route: string;
  vessel_size: string;
  current_low_cents: number;
  current_high_cents: number;
  previous_low_cents: number;
  previous_high_cents: number;
  direction: string;
};

export type AcuityRelatedMarket = {
  market: string;
  unit: string;
  current_low: number;
  current_high: number;
  previous_low: number;
  previous_high: number;
  direction: string;
};

export type AcuityExchangeRate = {
  currency: string;
  current: number;
  previous: number;
  direction: string;
};

export type AcuityReport = {
  report_date: string;
  sulphur_prices: AcuityPriceRow[];
  sulphuric_acid_prices: AcuityPriceRow[];
  freight_rates: AcuityFreightRow[];
  related_markets: AcuityRelatedMarket[];
  exchange_rates: AcuityExchangeRate[];
};

function parseRange(s: string): { low: number; high: number } {
  s = s.trim().replace(/,/g, "");
  if (s.includes("-")) {
    const parts = s.split("-").map((p) => parseFloat(p.trim()));
    return { low: parts[0]!, high: parts[1]! };
  }
  const val = parseFloat(s);
  return { low: val, high: val };
}

function toCents(val: number): number {
  return Math.round(val * 100);
}

function parseRangeCents(s: string): { low: number; high: number } {
  const r = parseRange(s);
  return { low: toCents(r.low), high: toCents(r.high) };
}

function directionFromArrow(s: string): string {
  if (s.includes("↑")) return "up";
  if (s.includes("↓")) return "down";
  return "flat";
}

function extractReportDate(text: string): string {
  const match = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i);
  if (match) {
    const d = new Date(match[0]);
    return d.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

// Text format (tab-delimited, left-to-right):
// Vancouver spot FOB	N	500-505	510-520	↓	170-175
// Columns: description, type, current, previous, direction, year_ago

export function parseAcuityPdf(text: string): AcuityReport {
  const reportDate = extractReportDate(text);
  const lines = text.split("\n").map((l) => l.trim());

  const report: AcuityReport = {
    report_date: reportDate,
    sulphur_prices: [],
    sulphuric_acid_prices: [],
    freight_rates: [],
    related_markets: [],
    exchange_rates: [],
  };

  // Sulphur prices
  const sulphurPatterns: { match: string; benchmark: string; term: string }[] = [
    { match: "Vancouver spot FOB", benchmark: "vancouver_fob", term: "FOB" },
    { match: "US Gulf Coast spot FOB", benchmark: "us_gulf_coast_fob", term: "FOB" },
    { match: "Tampa", benchmark: "tampa_contract_del", term: "DEL" },
  ];

  for (const sp of sulphurPatterns) {
    const line = lines.find((l) => l.includes(sp.match) && /\d/.test(l) && !l.startsWith("*"));
    if (line) {
      // Split on tabs
      const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
      // parts: [description, type, current, previous, direction, year_ago]
      if (parts.length >= 5) {
        const typeIdx = parts.findIndex((p) => /^[NAFBFO]+$/.test(p));
        if (typeIdx >= 0) {
          const priceType = parts[typeIdx]!;
          const current = parts[typeIdx + 1] || "0";
          const previous = parts[typeIdx + 2] || "0";
          const dir = parts[typeIdx + 3] || "↔";
          const yearAgo = parts[typeIdx + 4] || "0";
          const c = parseRangeCents(current);
          const p = parseRangeCents(previous);
          const y = parseRangeCents(yearAgo);
          report.sulphur_prices.push({
            benchmark: sp.benchmark,
            price_type: priceType,
            delivery_term: sp.term,
            current_low_cents: c.low,
            current_high_cents: c.high,
            previous_low_cents: p.low,
            previous_high_cents: p.high,
            direction: directionFromArrow(dir),
            year_ago_low_cents: y.low,
            year_ago_high_cents: y.high,
          });
        }
      }
    }
  }

  // Sulphuric acid
  const acidLine = lines.find((l) => l.includes("US spot CFR") && /\d/.test(l));
  if (acidLine) {
    const parts = acidLine.split("\t").map((p) => p.trim()).filter(Boolean);
    const typeIdx = parts.findIndex((p) => /^[NAFBFO]+$/.test(p));
    if (typeIdx >= 0 && parts.length >= typeIdx + 5) {
      const c = parseRangeCents(parts[typeIdx + 1]!);
      const p = parseRangeCents(parts[typeIdx + 2]!);
      const y = parseRangeCents(parts[typeIdx + 4]!);
      report.sulphuric_acid_prices.push({
        benchmark: "us_spot_cfr_acid",
        price_type: parts[typeIdx]!,
        delivery_term: "CFR",
        current_low_cents: c.low,
        current_high_cents: c.high,
        previous_low_cents: p.low,
        previous_high_cents: p.high,
        direction: directionFromArrow(parts[typeIdx + 3] || ""),
        year_ago_low_cents: y.low,
        year_ago_high_cents: y.high,
      });
    }
  }

  // Freight rates
  // Format: "Vancouver to China (60-70kt)	26-28	24-26	↑	23-25"
  const freightPatterns: { match: string; route: string }[] = [
    { match: "Vancouver to China", route: "Vancouver to China" },
    { match: "US Gulf Coast to Brazil", route: "US Gulf Coast to Brazil" },
    { match: "US Gulf Coast to Morocco", route: "US Gulf Coast to Morocco" },
    { match: "Middle East to Tampa", route: "Middle East to Tampa" },
    { match: "Baltic to Tampa", route: "Baltic to Tampa" },
  ];

  for (const fp of freightPatterns) {
    const line = lines.find((l) => l.includes(fp.match) && /\d/.test(l));
    if (line) {
      // Extract vessel size from parentheses
      const sizeMatch = line.match(/\((\d+-\d+kt)\)/);
      const vesselSize = sizeMatch ? sizeMatch[1]! : "";

      const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
      // Find the first numeric column (current price)
      const numIdx = parts.findIndex((p, i) => i > 0 && /^\d/.test(p));
      if (numIdx >= 0 && parts.length >= numIdx + 3) {
        const c = parseRangeCents(parts[numIdx]!);
        const p = parseRangeCents(parts[numIdx + 1]!);
        report.freight_rates.push({
          route: fp.route,
          vessel_size: vesselSize,
          current_low_cents: c.low,
          current_high_cents: c.high,
          previous_low_cents: p.low,
          previous_high_cents: p.high,
          direction: directionFromArrow(parts[numIdx + 2] || ""),
        });
      }
    }
  }

  // Related markets
  // Format: "Tampa ammonia monthly contract $/t CFR	625	625	↔	500"
  const relatedPatterns: { match: string; market: string; unit: string }[] = [
    { match: "Tampa ammonia", market: "Tampa ammonia monthly contract", unit: "$/t CFR" },
    { match: "DAP US Gulf Coast", market: "DAP US Gulf Coast barge", unit: "$/st FOB" },
    { match: "WTI crude oil", market: "WTI crude oil", unit: "$/bbl" },
    { match: "Henry Hub", market: "Henry Hub natural gas", unit: "$/mBtu" },
    { match: "Copper cash", market: "Copper cash ask", unit: "$/lb" },
  ];

  for (const rp of relatedPatterns) {
    const line = lines.find((l) => l.includes(rp.match) && /\d/.test(l));
    if (line) {
      const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
      const numIdx = parts.findIndex((p, i) => i > 0 && /^\d/.test(p));
      if (numIdx >= 0 && parts.length >= numIdx + 2) {
        const current = parseRange(parts[numIdx]!);
        const previous = parseRange(parts[numIdx + 1]!);
        report.related_markets.push({
          market: rp.market,
          unit: rp.unit,
          current_low: current.low,
          current_high: current.high,
          previous_low: previous.low,
          previous_high: previous.high,
          direction: directionFromArrow(parts[numIdx + 2] || ""),
        });
      }
    }
  }

  // Exchange rates
  // Format: "Brazilian real (BRL)	5.1768	5.2175	↓	5.7316"
  const fxPatterns: { match: string; currency: string }[] = [
    { match: "Brazilian real", currency: "BRL" },
    { match: "Canadian dollar", currency: "CAD" },
    { match: "Chinese Yuan", currency: "CNY" },
  ];

  for (const fp of fxPatterns) {
    const line = lines.find((l) => l.includes(fp.match) && /\d/.test(l));
    if (line) {
      const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
      const numIdx = parts.findIndex((p, i) => i > 0 && /^\d/.test(p));
      if (numIdx >= 0 && parts.length >= numIdx + 2) {
        report.exchange_rates.push({
          currency: fp.currency,
          current: parseFloat(parts[numIdx]!),
          previous: parseFloat(parts[numIdx + 1]!),
          direction: directionFromArrow(parts[numIdx + 2] || ""),
        });
      }
    }
  }

  return report;
}
