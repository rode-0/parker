import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../Dashboard";

vi.mock("../../services/api", () => ({
  pricesApi: {
    getLatest: vi.fn().mockResolvedValue([
      {
        id: 1, benchmark: "vancouver_fob", price_low_cents: 50000,
        price_high_cents: 50500, price_type: "N", delivery_term: "FOB",
        recorded_at: "2026-03-15", source: "acuity", report_date: "2026-03-15",
      },
    ]),
    getHistory: vi.fn().mockResolvedValue([]),
  },
}));

describe("Dashboard", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders title", async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Price Dashboard")).toBeInTheDocument();
    });
  });

  it("shows benchmark label", async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText("Vancouver FOB").length).toBeGreaterThan(0);
    });
  });
});
