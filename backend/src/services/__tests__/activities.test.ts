import { describe, it, expect } from "vitest";
import { createActivity, getActivitiesByCustomer, deleteActivity, getCustomersNeedingAttention } from "../activities";
import { createTestCustomer } from "../../test-helpers";
import { getCustomer } from "../customers";

describe("activities service", () => {
  it("creates an activity", async () => {
    const customer = await createTestCustomer();
    const activity = await createActivity({
      customer_id: customer.id,
      type: "visit",
      date: "2026-03-15",
      duration_minutes: 90,
      notes: "Discussed pricing",
    });

    expect(activity.id).toBeDefined();
    expect(activity.type).toBe("visit");
    expect(activity.date).toBe("2026-03-15");
    expect(activity.duration_minutes).toBe(90);
  });

  it("updates last_visit on customer when logging a visit", async () => {
    const customer = await createTestCustomer();
    await createActivity({ customer_id: customer.id, type: "visit", date: "2026-03-10" });

    const updated = await getCustomer(customer.id);
    expect(updated!.last_visit).toBe("2026-03-10");
  });

  it("does not update last_visit for non-visit types", async () => {
    const customer = await createTestCustomer();
    await createActivity({ customer_id: customer.id, type: "call", date: "2026-03-10" });

    const updated = await getCustomer(customer.id);
    expect(updated!.last_visit).toBeNull();
  });

  it("keeps most recent last_visit", async () => {
    const customer = await createTestCustomer();
    await createActivity({ customer_id: customer.id, type: "visit", date: "2026-03-15" });
    await createActivity({ customer_id: customer.id, type: "visit", date: "2026-03-10" });

    const updated = await getCustomer(customer.id);
    expect(updated!.last_visit).toBe("2026-03-15"); // should keep the later date
  });

  it("gets activities by customer sorted by date desc", async () => {
    const customer = await createTestCustomer();
    await createActivity({ customer_id: customer.id, type: "visit", date: "2026-03-10" });
    await createActivity({ customer_id: customer.id, type: "call", date: "2026-03-15" });
    await createActivity({ customer_id: customer.id, type: "email", date: "2026-03-12" });

    const activities = await getActivitiesByCustomer(customer.id);
    expect(activities).toHaveLength(3);
    expect(activities[0]!.date).toBe("2026-03-15");
    expect(activities[2]!.date).toBe("2026-03-10");
  });

  it("deletes an activity", async () => {
    const customer = await createTestCustomer();
    const activity = await createActivity({ customer_id: customer.id, type: "note", date: "2026-03-10" });

    expect(await deleteActivity(activity.id)).toBe(true);
    const remaining = await getActivitiesByCustomer(customer.id);
    expect(remaining).toHaveLength(0);
  });

  it("returns false deleting nonexistent activity", async () => {
    expect(await deleteActivity(99999)).toBe(false);
  });

  it("getCustomersNeedingAttention sorts by oldest visit first", async () => {
    const c1 = await createTestCustomer({ company_name: "Never Visited" });
    const c2 = await createTestCustomer({ company_name: "Visited Long Ago" });
    const c3 = await createTestCustomer({ company_name: "Recently Visited" });

    await createActivity({ customer_id: c2.id, type: "visit", date: "2025-01-01" });
    await createActivity({ customer_id: c3.id, type: "visit", date: "2026-03-15" });

    const attention = await getCustomersNeedingAttention();
    // Never visited should be first, then long ago, then recent
    expect(attention[0]!.company_name).toBe("Never Visited");
    expect(attention[0]!.days_since_visit).toBeNull();
  });
});
