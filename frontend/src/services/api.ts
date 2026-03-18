import type {
  ApiResponse,
  SulfurPrice,
  Quote,
  QuotePricing,
  ImportResult,
  ImportHistoryEntry,
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

  getHistory: (benchmark: string, days = 90) =>
    request<SulfurPrice[]>(`/prices/${benchmark}/history?days=${days}`),
};

export const quotesApi = {
  list: (params?: { status?: string; customer_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.customer_id) query.set("customer_id", String(params.customer_id));
    const qs = query.toString();
    return request<Quote[]>(`/quotes${qs ? `?${qs}` : ""}`);
  },

  get: (id: number) => request<Quote>(`/quotes/${id}`),

  create: (input: {
    customer_id?: number;
    customer_name: string;
    customer_company: string;
    benchmark: string;
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
    benchmark: string;
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

export const importApi = {
  uploadAcuity: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/import/acuity`, {
      method: "POST",
      body: formData,
    });
    const json = (await res.json()) as ApiResponse<ImportResult>;
    if (!json.success) {
      throw new Error(json.error);
    }
    return json.data;
  },

  history: () => request<ImportHistoryEntry[]>("/import/history"),
};
