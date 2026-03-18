import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import QuoteList from "../QuoteList";

vi.mock("../../services/api", () => ({
  quotesApi: {
    list: vi.fn().mockResolvedValue([
      {
        id: 1, customer_id: null, customer_name: "John", customer_company: "TestCo",
        benchmark: "vancouver_fob", grade: "bright_yellow", form: "prills",
        quantity_mt: 500, base_price_cents: 50000, grade_adj_cents: 500,
        form_adj_cents: 200, freight_cents: 1000, volume_discount_cents: 0,
        total_cents: 25850000, notes: "", status: "draft",
        created_at: "2026-03-15", updated_at: "2026-03-15",
      },
    ]),
    updateStatus: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({ deleted: true }),
  },
}));

describe("QuoteList", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders quote list with data", async () => {
    render(<MemoryRouter><QuoteList /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("#1")).toBeInTheDocument();
    });
  });

  it("shows customer company", async () => {
    render(<MemoryRouter><QuoteList /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("TestCo")).toBeInTheDocument();
    });
  });

  it("shows quantity", async () => {
    render(<MemoryRouter><QuoteList /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("500 MT")).toBeInTheDocument();
    });
  });
});
