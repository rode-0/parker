import { describe, it, expect } from "vitest";
import { parseAcuityPdf } from "../acuity-parser";

const SAMPLE_TEXT = `Acuity Commodities
Independent Analysis You Can Trust
Regional Briefing: US & Canada
Page 1 of 8
Copyright Acuity Commodities 2026 \tFebruary 23, 2026
Sulphur and Sulphuric Acid Prices
* \tFeb 23, 2026 Feb 9, 2026 \tPrice \u0394 \tFeb 24, 2025
Sulphur
Vancouver spot FOB \tN \t500-505 \t510-520 \t\u2193 \t170-175
US Gulf Coast spot FOB \tN \t497-502 \t500-510 \t\u2193 \t168-173
Tampa 1Q contract lt/DEL \tA \t495.69 \t495.69 \t\u2194 \t165
Sulphuric Acid
US spot CFR \tN \t160-165 \t155-160 \t\u2191 \t135-145
Freight Rates
Vancouver to China (60-70kt) \t26-28 \t24-26 \t\u2191 \t23-25
US Gulf Coast to Brazil (35-40kt) \t26-31 \t24-29 \t\u2191 \t21-23
US Gulf Coast to Morocco (35-40kt) \t25-29 \t23-27 \t\u2191 \t21-23
Middle East to Tampa (35-45kt) \t35-38 \t35-38 \t\u2194 \t35-37
Baltic to Tampa (35-45kt) \t55-60 \t50-55 \t\u2191 \t60-70
Tampa ammonia monthly contract $/t CFR \t625 \t625 \t\u2194 \t500
DAP US Gulf Coast barge $/st FOB \t628 \t630 \t\u2193 \t600
WTI crude oil $/bbl \t66.68 \t64.16 \t\u2191 \t70.43
Henry Hub natural gas $/mBtu \t3.13 \t4.4 \t\u2193 \t6.4
Copper cash ask $/lb \t5.78 \t5.82 \t\u2193 \t4.31
Brazilian real (BRL) \t5.1768 \t5.2175 \t\u2193 \t5.7316
Canadian dollar (CAD) \t1.3682 \t1.3671 \t\u2191 \t1.4225
Chinese Yuan Renminbi (CNY) \t6.9086 \t6.9379 \t\u2193 \t7.2501`;

describe("parseAcuityPdf", () => {
  const report = parseAcuityPdf(SAMPLE_TEXT);

  it("extracts report date", () => {
    expect(report.report_date).toBe("2026-02-23");
  });

  it("parses sulphur prices", () => {
    expect(report.sulphur_prices).toHaveLength(3);

    const vancouver = report.sulphur_prices.find((p) => p.benchmark === "vancouver_fob");
    expect(vancouver).toBeDefined();
    expect(vancouver!.current_low_cents).toBe(50000);
    expect(vancouver!.current_high_cents).toBe(50500);
    expect(vancouver!.price_type).toBe("N");
    expect(vancouver!.delivery_term).toBe("FOB");
    expect(vancouver!.direction).toBe("down");

    const tampa = report.sulphur_prices.find((p) => p.benchmark === "tampa_contract_del");
    expect(tampa).toBeDefined();
    expect(tampa!.current_low_cents).toBe(49569);
    expect(tampa!.current_high_cents).toBe(49569);
    expect(tampa!.price_type).toBe("A");
  });

  it("parses sulphuric acid prices", () => {
    expect(report.sulphuric_acid_prices).toHaveLength(1);
    const acid = report.sulphuric_acid_prices[0]!;
    expect(acid.benchmark).toBe("us_spot_cfr_acid");
    expect(acid.current_low_cents).toBe(16000);
    expect(acid.current_high_cents).toBe(16500);
    expect(acid.direction).toBe("up");
  });

  it("parses freight rates", () => {
    expect(report.freight_rates).toHaveLength(5);

    const vanChina = report.freight_rates.find((f) => f.route === "Vancouver to China");
    expect(vanChina).toBeDefined();
    expect(vanChina!.current_low_cents).toBe(2600);
    expect(vanChina!.current_high_cents).toBe(2800);
    expect(vanChina!.vessel_size).toBe("60-70kt");
  });

  it("parses related markets", () => {
    expect(report.related_markets).toHaveLength(5);

    const wti = report.related_markets.find((m) => m.market === "WTI crude oil");
    expect(wti).toBeDefined();
    expect(wti!.current_low).toBeCloseTo(66.68);
    expect(wti!.unit).toBe("$/bbl");
  });

  it("parses exchange rates", () => {
    expect(report.exchange_rates).toHaveLength(3);

    const cad = report.exchange_rates.find((e) => e.currency === "CAD");
    expect(cad).toBeDefined();
    expect(cad!.current).toBeCloseTo(1.3682);
    expect(cad!.direction).toBe("up");
  });

  it("handles empty text gracefully", () => {
    const empty = parseAcuityPdf("");
    expect(empty.sulphur_prices).toHaveLength(0);
    expect(empty.freight_rates).toHaveLength(0);
    expect(empty.related_markets).toHaveLength(0);
    expect(empty.exchange_rates).toHaveLength(0);
  });
});
