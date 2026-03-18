export type CustomerType = "refinery" | "fertilizer" | "chemical" | "mining" | "other";

export type CustomerPriority = "high" | "medium" | "low";

export type Customer = {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  customer_type: CustomerType;
  annual_volume_mt: number | null;
  last_visit: string | null;
  priority: CustomerPriority;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type CreateCustomerInput = {
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  country?: string;
  customer_type?: CustomerType;
  annual_volume_mt?: number;
  last_visit?: string;
  priority?: CustomerPriority;
  notes?: string;
};

export type ColumnMapping = Record<string, string>;

export type CustomerImportResult = {
  total_rows: number;
  imported: number;
  skipped: number;
  geocoded: number;
  geocode_failed: number;
  errors: string[];
};

export type ImportPreview = {
  headers: string[];
  suggested_mapping: ColumnMapping;
  preview_rows: unknown[][];
  total_rows: number;
};
