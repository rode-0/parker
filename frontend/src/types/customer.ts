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
  suggested_mapping: Record<string, string>;
  preview_rows: unknown[][];
  total_rows: number;
};

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  refinery: "Refinery",
  fertilizer: "Fertilizer",
  chemical: "Chemical",
  mining: "Mining",
  other: "Other",
};

export const PRIORITY_LABELS: Record<CustomerPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const PRIORITY_COLORS: Record<CustomerPriority, string> = {
  high: "#f87171",
  medium: "#fbbf24",
  low: "#34d399",
};

export const CUSTOMER_TYPE_COLORS: Record<CustomerType, string> = {
  refinery: "#f87171",
  fertilizer: "#34d399",
  chemical: "#60a5fa",
  mining: "#fbbf24",
  other: "#9ca3af",
};

export const CUSTOMER_FIELDS = [
  { key: "company_name", label: "Company Name", required: true },
  { key: "contact_name", label: "Contact Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address", required: true },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State", required: true },
  { key: "zip", label: "ZIP Code" },
  { key: "country", label: "Country" },
  { key: "customer_type", label: "Customer Type" },
  { key: "annual_volume_mt", label: "Annual Volume (MT)" },
  { key: "last_visit", label: "Last Visit" },
  { key: "priority", label: "Priority" },
  { key: "notes", label: "Notes" },
];
