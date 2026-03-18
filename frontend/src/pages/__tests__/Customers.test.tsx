import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Customers from "../Customers";

vi.mock("../../services/customerApi", () => ({
  customersApi: {
    list: vi.fn().mockResolvedValue([
      {
        id: 1, company_name: "Mosaic Company", contact_name: "John Smith",
        email: "john@mosaic.com", phone: "555-0100", address: "123 Main",
        city: "Plymouth", state: "MN", zip: "55441", country: "US",
        latitude: 45.0, longitude: -93.4, customer_type: "fertilizer",
        annual_volume_mt: 50000, last_visit: "2026-03-10", priority: "high",
        notes: "", created_at: "2026-01-01", updated_at: "2026-01-01",
      },
    ]),
    delete: vi.fn().mockResolvedValue({ deleted: true }),
  },
}));

describe("Customers", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders customer list", async () => {
    render(<MemoryRouter><Customers /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Mosaic Company")).toBeInTheDocument();
    });
  });

  it("shows location", async () => {
    render(<MemoryRouter><Customers /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Plymouth, MN")).toBeInTheDocument();
    });
  });

  it("has search input", () => {
    render(<MemoryRouter><Customers /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("has import and map links", () => {
    render(<MemoryRouter><Customers /></MemoryRouter>);
    expect(screen.getByText("Import")).toBeInTheDocument();
    expect(screen.getByText("Map View")).toBeInTheDocument();
  });
});
