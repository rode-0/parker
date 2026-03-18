export type SulfurGrade = "bright_yellow" | "dark" | "recovered";

export type SulfurForm = "molten" | "prills" | "granular" | "blocks";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type SulfurPrice = {
  id: number;
  benchmark: string;
  price_low_cents: number;
  price_high_cents: number;
  price_type: string;
  delivery_term: string;
  recorded_at: string;
  source: string;
  report_date: string | null;
};

export type Quote = {
  id: number;
  customer_name: string;
  customer_company: string;
  benchmark: string;
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

export type ImportResult = {
  report_date: string;
  sulphur_prices: number;
  sulphuric_acid_prices: number;
  freight_rates: number;
  related_markets: number;
  exchange_rates: number;
  total_records: number;
};

export type ImportHistoryEntry = {
  id: number;
  filename: string;
  report_date: string;
  imported_at: string;
  record_count: number;
};

export const BENCHMARK_LABELS: Record<string, string> = {
  vancouver_fob: "Vancouver FOB",
  us_gulf_coast_fob: "US Gulf Coast FOB",
  tampa_contract_del: "Tampa Q Contract DEL",
  us_spot_cfr_acid: "US Spot CFR (Acid)",
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
