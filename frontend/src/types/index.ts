export type SulfurGrade = "bright_yellow" | "dark" | "recovered";

export type SulfurForm = "molten" | "prills" | "granular" | "blocks";

export type PricingBenchmark =
  | "tampa_cfr"
  | "vancouver_fob"
  | "middle_east_fob"
  | "china_cfr";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type SulfurPrice = {
  id: number;
  benchmark: PricingBenchmark;
  price_cents: number;
  recorded_at: string;
  source: string;
};

export type Quote = {
  id: number;
  customer_name: string;
  customer_company: string;
  benchmark: PricingBenchmark;
  grade: SulfurGrade;
  form: SulfurForm;
  quantity_mt: number;
  base_price_cents: number;
  grade_adj_cents: number;
  form_adj_cents: number;
  freight_cents: number;
  volume_discount_cents: number;
  total_cents: number;
  notes: string;
  status: "draft" | "sent" | "accepted" | "expired";
  created_at: string;
  updated_at: string;
};

export type QuotePricing = {
  base_price_cents: number;
  grade_adj_cents: number;
  form_adj_cents: number;
  freight_cents: number;
  volume_discount_cents: number;
  total_cents: number;
};

export const BENCHMARK_LABELS: Record<PricingBenchmark, string> = {
  tampa_cfr: "Tampa CFR",
  vancouver_fob: "Vancouver FOB",
  middle_east_fob: "Middle East FOB",
  china_cfr: "China CFR",
};

export const GRADE_LABELS: Record<SulfurGrade, string> = {
  bright_yellow: "Bright Yellow (99.9%+)",
  dark: "Dark / Off-Spec",
  recovered: "Recovered",
};

export const FORM_LABELS: Record<SulfurForm, string> = {
  molten: "Molten",
  prills: "Prills",
  granular: "Granular",
  blocks: "Blocks / Slates",
};
