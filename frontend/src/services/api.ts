import type {
  ApiResponse,
  SulfurPrice,
  Quote,
  QuotePricing,
  PricingBenchmark,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error);
  }
  return json.data;
}

export const pricesApi = {
  getLatest: () => request<SulfurPrice[]>("/prices"),

  getHistory: (benchmark: PricingBenchmark, days = 90) =>
    request<SulfurPrice[]>(`/prices/${benchmark}/history?days=${days}`),
};

export const quotesApi = {
  list: (status?: string) =>
    request<Quote[]>(`/quotes${status ? `?status=${status}` : ""}`),

  get: (id: number) => request<Quote>(`/quotes/${id}`),

  create: (input: {
    customer_name: string;
    customer_company: string;
    benchmark: PricingBenchmark;
    grade: string;
    form: string;
    quantity_mt: number;
    freight_cents: number;
    notes?: string;
  }) =>
    request<Quote>("/quotes", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  preview: (input: {
    customer_name: string;
    customer_company: string;
    benchmark: PricingBenchmark;
    grade: string;
    form: string;
    quantity_mt: number;
    freight_cents: number;
  }) =>
    request<QuotePricing>("/quotes/preview", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateStatus: (id: number, status: string) =>
    request<Quote>(`/quotes/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: number) =>
    request<{ deleted: boolean }>(`/quotes/${id}`, { method: "DELETE" }),
};
