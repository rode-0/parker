import { describe, it, expect } from "vitest";
import {
  listCustomers, getCustomer, createCustomer, updateCustomer,
  deleteCustomer, getCustomersForMap, updateCustomerCoords,
} from "../customers";

describe("customers service", () => {
  it("creates a customer", async () => {
    const c = await createCustomer({
      company_name: "Mosaic",
      address: "123 Main St",
      city: "Plymouth",
      state: "MN",
    });
    expect(c.id).toBeDefined();
    expect(c.company_name).toBe("Mosaic");
    expect(c.customer_type).toBe("other"); // default
    expect(c.priority).toBe("medium"); // default
    expect(c.country).toBe("US"); // default
  });

  it("creates with all fields", async () => {
    const c = await createCustomer({
      company_name: "Nutrien",
      contact_name: "Jane",
      email: "jane@nutrien.com",
      phone: "555-0100",
      address: "456 Elm",
      city: "Calgary",
      state: "AB",
      zip: "T2P",
      country: "CA",
      customer_type: "fertilizer",
      annual_volume_mt: 50000,
      priority: "high",
      notes: "Large account",
    });
    expect(c.contact_name).toBe("Jane");
    expect(c.customer_type).toBe("fertilizer");
    expect(c.annual_volume_mt).toBe(50000);
    expect(c.priority).toBe("high");
  });

  it("gets a customer by ID", async () => {
    const created = await createCustomer({ company_name: "Test", address: "1 St", city: "X", state: "TX" });
    const found = await getCustomer(created.id);
    expect(found).not.toBeNull();
    expect(found!.company_name).toBe("Test");
  });

  it("returns null for nonexistent customer", async () => {
    expect(await getCustomer(99999)).toBeNull();
  });

  it("lists customers with search", async () => {
    await createCustomer({ company_name: "Alpha Corp", address: "1 St", city: "Houston", state: "TX" });
    await createCustomer({ company_name: "Beta Inc", address: "2 St", city: "Dallas", state: "TX" });

    const all = await listCustomers({});
    expect(all.length).toBeGreaterThanOrEqual(2);

    const searched = await listCustomers({ search: "Alpha" });
    expect(searched).toHaveLength(1);
    expect(searched[0]!.company_name).toBe("Alpha Corp");
  });

  it("filters by state", async () => {
    await createCustomer({ company_name: "TX Co", address: "1 St", city: "Houston", state: "TX" });
    await createCustomer({ company_name: "MN Co", address: "2 St", city: "Plymouth", state: "MN" });

    const tx = await listCustomers({ state: "TX" });
    expect(tx.every((c) => c.state === "TX")).toBe(true);
  });

  it("filters by customer_type", async () => {
    await createCustomer({ company_name: "Ref", address: "1 St", city: "X", state: "TX", customer_type: "refinery" });
    await createCustomer({ company_name: "Fert", address: "2 St", city: "X", state: "TX", customer_type: "fertilizer" });

    const refineries = await listCustomers({ customer_type: "refinery" });
    expect(refineries.every((c) => c.customer_type === "refinery")).toBe(true);
  });

  it("updates a customer", async () => {
    const c = await createCustomer({ company_name: "Old Name", address: "1 St", city: "X", state: "TX" });
    const updated = await updateCustomer(c.id, { company_name: "New Name" });
    expect(updated!.company_name).toBe("New Name");
  });

  it("returns null updating nonexistent customer", async () => {
    expect(await updateCustomer(99999, { company_name: "X" })).toBeNull();
  });

  it("deletes a customer", async () => {
    const c = await createCustomer({ company_name: "ToDelete", address: "1 St", city: "X", state: "TX" });
    expect(await deleteCustomer(c.id)).toBe(true);
    expect(await getCustomer(c.id)).toBeNull();
  });

  it("returns false deleting nonexistent customer", async () => {
    expect(await deleteCustomer(99999)).toBe(false);
  });

  it("getCustomersForMap excludes customers without coords", async () => {
    await createCustomer({ company_name: "NoCoords", address: "1 St", city: "X", state: "TX" });
    const c2 = await createCustomer({ company_name: "HasCoords", address: "2 St", city: "X", state: "TX" });
    await updateCustomerCoords(c2.id, 30.0, -95.0);

    const mapCustomers = await getCustomersForMap();
    expect(mapCustomers.every((c) => c.latitude != null)).toBe(true);
    expect(mapCustomers.some((c) => c.company_name === "HasCoords")).toBe(true);
    expect(mapCustomers.some((c) => c.company_name === "NoCoords")).toBe(false);
  });

  it("updateCustomerCoords sets lat/lng", async () => {
    const c = await createCustomer({ company_name: "Geo", address: "1 St", city: "X", state: "TX" });
    await updateCustomerCoords(c.id, 29.76, -95.37);
    const updated = await getCustomer(c.id);
    expect(updated!.latitude).toBeCloseTo(29.76);
    expect(updated!.longitude).toBeCloseTo(-95.37);
  });
});
