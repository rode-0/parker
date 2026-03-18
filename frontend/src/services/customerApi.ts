import type { Customer, CustomerImportResult, ImportPreview } from "../types/customer";
import type { ApiResponse } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export const customersApi = {
  list: (params?: {
    search?: string;
    state?: string;
    customer_type?: string;
    priority?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.state) query.set("state", params.state);
    if (params?.customer_type) query.set("customer_type", params.customer_type);
    if (params?.priority) query.set("priority", params.priority);
    const qs = query.toString();
    return request<Customer[]>(`/customers${qs ? `?${qs}` : ""}`);
  },

  get: (id: number) => request<Customer>(`/customers/${id}`),

  delete: (id: number) =>
    request<{ deleted: boolean }>(`/customers/${id}`, { method: "DELETE" }),

  importPreview: async (file: File): Promise<ImportPreview> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/customers/import/preview`, {
      method: "POST",
      body: formData,
    });
    const json = (await res.json()) as ApiResponse<ImportPreview>;
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  importConfirm: async (
    file: File,
    mapping: Record<string, string>
  ): Promise<CustomerImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));
    const res = await fetch(`${API_URL}/customers/import`, {
      method: "POST",
      body: formData,
    });
    const json = (await res.json()) as ApiResponse<CustomerImportResult>;
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  getForMap: (filters?: { customer_type?: string; priority?: string }) => {
    const query = new URLSearchParams();
    if (filters?.customer_type) query.set("customer_type", filters.customer_type);
    if (filters?.priority) query.set("priority", filters.priority);
    const qs = query.toString();
    return request<Customer[]>(`/customers/map${qs ? `?${qs}` : ""}`);
  },

  geocode: (id: number) =>
    request<Customer>(`/customers/${id}/geocode`, { method: "POST" }),
};
