import { describe, it, expect } from "vitest";
import {
  GRADE_ADJUSTMENTS, FORM_ADJUSTMENTS, getVolumeDiscount,
  calculateQuotePrice, getLatestPrice, getAllLatestPrices, addPrice,
} from "../pricing";
import { createTestPrice } from "../../test-helpers";

describe("pricing constants", () => {
  it("has correct grade adjustments", () => {
    expect(GRADE_ADJUSTMENTS.bright_yellow).toBe(500);
    expect(GRADE_ADJUSTMENTS.dark).toBe(-800);
    expect(GRADE_ADJUSTMENTS.recovered).toBe(-300);
  });

  it("has correct form adjustments", () => {
    expect(FORM_ADJUSTMENTS.molten).toBe(0);
    expect(FORM_ADJUSTMENTS.prills).toBe(200);
    expect(FORM_ADJUSTMENTS.granular).toBe(150);
    expect(FORM_ADJUSTMENTS.blocks).toBe(-100);
  });
});

describe("getVolumeDiscount", () => {
  it("returns 0 for quantities under 1000 MT", () => {
    expect(getVolumeDiscount(0)).toBe(0);
    expect(getVolumeDiscount(500)).toBe(0);
    expect(getVolumeDiscount(999)).toBe(0);
  });

  it("returns 100 for 1000-4999 MT", () => {
    expect(getVolumeDiscount(1000)).toBe(100);
    expect(getVolumeDiscount(3000)).toBe(100);
    expect(getVolumeDiscount(4999)).toBe(100);
  });

  it("returns 200 for 5000-9999 MT", () => {
    expect(getVolumeDiscount(5000)).toBe(200);
    expect(getVolumeDiscount(7500)).toBe(200);
  });

  it("returns 300 for 10000+ MT", () => {
    expect(getVolumeDiscount(10000)).toBe(300);
    expect(getVolumeDiscount(50000)).toBe(300);
  });
});

describe("calculateQuotePrice", () => {
  it("calculates correctly for bright yellow prills", async () => {
    await createTestPrice("vancouver_fob", 50000, 50500);
    const result = await calculateQuotePrice("vancouver_fob", "bright_yellow", "prills", 500, 1000);

    // Base = midpoint of 50000,50500 = 50250
    expect(result.base_price_cents).toBe(50250);
    expect(result.grade_adj_cents).toBe(500);
    expect(result.form_adj_cents).toBe(200);
    expect(result.freight_cents).toBe(1000);
    expect(result.volume_discount_cents).toBe(0); // 500 MT < 1000
    // Per ton: 50250 + 500 + 200 + 1000 - 0 = 51950
    // Total: 51950 * 500 = 25975000
    expect(result.total_cents).toBe(25975000);
  });

  it("applies volume discount for large quantities", async () => {
    await createTestPrice("vancouver_fob", 50000, 50000);
    const result = await calculateQuotePrice("vancouver_fob", "bright_yellow", "molten", 5000, 0);

    expect(result.volume_discount_cents).toBe(200);
    // Per ton: 50000 + 500 + 0 + 0 - 200 = 50300
    expect(result.total_cents).toBe(50300 * 5000);
  });

  it("applies negative adjustments for dark grade blocks", async () => {
    await createTestPrice("vancouver_fob", 50000, 50000);
    const result = await calculateQuotePrice("vancouver_fob", "dark", "blocks", 100, 500);

    expect(result.grade_adj_cents).toBe(-800);
    expect(result.form_adj_cents).toBe(-100);
    // Per ton: 50000 - 800 - 100 + 500 - 0 = 49600
    expect(result.total_cents).toBe(49600 * 100);
  });

  it("throws when benchmark has no prices", async () => {
    await expect(
      calculateQuotePrice("nonexistent_benchmark", "bright_yellow", "prills", 100, 0)
    ).rejects.toThrow("No pricing data available");
  });

  it("uses midpoint of price range", async () => {
    await createTestPrice("vancouver_fob", 40000, 42000);
    const result = await calculateQuotePrice("vancouver_fob", "bright_yellow", "molten", 1, 0);
    expect(result.base_price_cents).toBe(41000); // midpoint
  });
});

describe("getLatestPrice", () => {
  it("returns null when no prices exist", async () => {
    const result = await getLatestPrice("nonexistent");
    expect(result).toBeNull();
  });

  it("returns a price for the benchmark", async () => {
    await createTestPrice("vancouver_fob", 48000, 48500);
    const result = await getLatestPrice("vancouver_fob");
    expect(result).not.toBeNull();
    expect(result!.price_low_cents).toBe(48000);
    expect(result!.benchmark).toBe("vancouver_fob");
  });
});

describe("getAllLatestPrices", () => {
  it("returns one entry per benchmark", async () => {
    await createTestPrice("vancouver_fob", 48000, 48500);
    await createTestPrice("us_gulf_coast_fob", 47000, 47500);
    const results = await getAllLatestPrices();
    expect(results).toHaveLength(2);
    const benchmarks = results.map((r) => r.benchmark);
    expect(benchmarks).toContain("vancouver_fob");
    expect(benchmarks).toContain("us_gulf_coast_fob");
  });
});

describe("addPrice", () => {
  it("inserts a price and returns it", async () => {
    const result = await addPrice({ benchmark: "test_bm", price_cents: 55000, source: "manual" });
    expect(result.benchmark).toBe("test_bm");
    expect(result.price_low_cents).toBe(55000);
    expect(result.source).toBe("manual");
  });
});
