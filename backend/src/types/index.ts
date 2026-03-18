export type SulfurGrade = "bright_yellow" | "dark" | "recovered";

export type SulfurForm = "molten" | "prills" | "granular" | "blocks";

export type PricingBenchmark = string;

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
  customer_id: number | null;
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

export type CreateQuoteInput = {
  customer_id?: number;
  customer_name: string;
  customer_company: string;
  benchmark: string;
  grade: SulfurGrade;
  form: SulfurForm;
  quantity_mt: number;
  freight_cents: number;
  notes?: string;
};

export type PriceEntry = {
  benchmark: string;
  price_cents: number;
  source: string;
};
