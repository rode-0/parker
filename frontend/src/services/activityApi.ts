import type { ApiResponse } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export type Activity = {
  id: number;
  customer_id: number;
  type: "visit" | "call" | "email" | "note";
  date: string;
  duration_minutes: number | null;
  notes: string;
  created_at: string;
};

export type AttentionCustomer = {
  id: number;
  company_name: string;
  city: string;
  state: string;
  priority: string;
  last_visit: string | null;
  days_since_visit: number | null;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export const activitiesApi = {
  getByCustomer: (customerId: number) =>
    request<Activity[]>(`/activities/customer/${customerId}`),

  create: (input: {
    customer_id: number;
    type: string;
    date: string;
    duration_minutes?: number;
    notes?: string;
  }) =>
    request<Activity>("/activities", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  delete: (id: number) =>
    request<{ deleted: boolean }>(`/activities/${id}`, { method: "DELETE" }),

  needingAttention: () =>
    request<AttentionCustomer[]>("/activities/attention"),
};
