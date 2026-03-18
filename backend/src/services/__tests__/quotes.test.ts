import { describe, it, expect } from "vitest";
import { createQuote, getQuote, listQuotes, getQuotesByCustomer, updateQuoteStatus, deleteQuote } from "../quotes";
import { createTestPrice, createTestCustomer } from "../../test-helpers";

describe("quotes service", () => {
  it("creates a quote with pricing breakdown", async () => {
    await createTestPrice("vancouver_fob", 50000, 50000);
    const quote = await createQuote({
      customer_name: "John",
      customer_company: "TestCo",
      benchmark: "vancouver_fob",
      grade: "bright_yellow",
      form: "prills",
      quantity_mt: 100,
      freight_cents: 500,
    });

    expect(quote.id).toBeDefined();
    expect(quote.customer_company).toBe("TestCo");
    expect(quote.base_price_cents).toBe(50000);
    expect(quote.grade_adj_cents).toBe(500);
    expect(quote.form_adj_cents).toBe(200);
    expect(quote.freight_cents).toBe(500);
    expect(quote.total_cents).toBeGreaterThan(0);
    expect(quote.status).toBe("draft");
  });

  it("creates a quote linked to a customer", async () => {
    await createTestPrice("vancouver_fob", 50000, 50000);
    const customer = await createTestCustomer();
    const quote = await createQuote({
      customer_id: customer.id,
      customer_name: "Jane",
      customer_company: "Test Corp",
      benchmark: "vancouver_fob",
      grade: "dark",
      form: "molten",
      quantity_mt: 200,
      freight_cents: 0,
    });

    expect(quote.customer_id).toBe(customer.id);
  });

  it("gets a quote by ID", async () => {
    await createTestPrice();
    const created = await createQuote({
      customer_name: "A", customer_company: "B", benchmark: "vancouver_fob",
      grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0,
    });
    const found = await getQuote(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
  });

  it("returns null for nonexistent quote", async () => {
    const found = await getQuote(99999);
    expect(found).toBeNull();
  });

  it("lists quotes filtered by status", async () => {
    await createTestPrice();
    await createQuote({ customer_name: "A", customer_company: "B", benchmark: "vancouver_fob", grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0 });
    const all = await listQuotes({});
    expect(all.length).toBeGreaterThanOrEqual(1);

    const drafts = await listQuotes({ status: "draft" });
    expect(drafts.length).toBeGreaterThanOrEqual(1);

    const accepted = await listQuotes({ status: "accepted" });
    expect(accepted).toHaveLength(0);
  });

  it("lists quotes by customer_id", async () => {
    await createTestPrice();
    const customer = await createTestCustomer();
    await createQuote({ customer_id: customer.id, customer_name: "A", customer_company: "B", benchmark: "vancouver_fob", grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0 });

    const byCustomer = await listQuotes({ customer_id: customer.id });
    expect(byCustomer).toHaveLength(1);

    const byOther = await listQuotes({ customer_id: 99999 });
    expect(byOther).toHaveLength(0);
  });

  it("updates quote status", async () => {
    await createTestPrice();
    const quote = await createQuote({ customer_name: "A", customer_company: "B", benchmark: "vancouver_fob", grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0 });

    const updated = await updateQuoteStatus(quote.id, "sent");
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("sent");
  });

  it("deletes a quote", async () => {
    await createTestPrice();
    const quote = await createQuote({ customer_name: "A", customer_company: "B", benchmark: "vancouver_fob", grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0 });

    const deleted = await deleteQuote(quote.id);
    expect(deleted).toBe(true);

    const found = await getQuote(quote.id);
    expect(found).toBeNull();
  });

  it("returns false when deleting nonexistent quote", async () => {
    const deleted = await deleteQuote(99999);
    expect(deleted).toBe(false);
  });

  it("getQuotesByCustomer returns correct quotes", async () => {
    await createTestPrice();
    const customer = await createTestCustomer();
    await createQuote({ customer_id: customer.id, customer_name: "A", customer_company: "B", benchmark: "vancouver_fob", grade: "bright_yellow", form: "prills", quantity_mt: 10, freight_cents: 0 });
    await createQuote({ customer_id: customer.id, customer_name: "A", customer_company: "B", benchmark: "vancouver_fob", grade: "dark", form: "molten", quantity_mt: 20, freight_cents: 0 });

    const quotes = await getQuotesByCustomer(customer.id);
    expect(quotes).toHaveLength(2);
  });
});
