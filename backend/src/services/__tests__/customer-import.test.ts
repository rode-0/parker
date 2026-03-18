import { describe, it, expect, vi } from "vitest";
import { previewImport } from "../customer-import";
import * as XLSX from "xlsx";

function makeExcelBuffer(headers: string[], rows: unknown[][]): Buffer {
  const wb = XLSX.utils.book_new();
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

describe("previewImport", () => {
  it("auto-detects standard column names", () => {
    const buf = makeExcelBuffer(
      ["Company", "Contact", "Email", "Phone", "Address", "City", "State", "Zip"],
      [["Mosaic", "John", "j@m.com", "555", "123 Main", "Houston", "TX", "77001"]]
    );
    const preview = previewImport(buf, "test.xlsx");

    expect(preview.headers).toEqual(["Company", "Contact", "Email", "Phone", "Address", "City", "State", "Zip"]);
    expect(preview.suggested_mapping.company_name).toBe("Company");
    expect(preview.suggested_mapping.contact_name).toBe("Contact");
    expect(preview.suggested_mapping.email).toBe("Email");
    expect(preview.suggested_mapping.city).toBe("City");
    expect(preview.suggested_mapping.state).toBe("State");
    expect(preview.total_rows).toBe(1);
    expect(preview.preview_rows).toHaveLength(1);
  });

  it("handles varied column names", () => {
    const buf = makeExcelBuffer(
      ["Organization", "Contact Person", "E-Mail", "Telephone", "Street Address", "Town", "Province", "Postal Code"],
      [["Nutrien", "Jane", "j@n.com", "555", "456 Elm", "Calgary", "AB", "T2P"]]
    );
    const preview = previewImport(buf, "test.xlsx");

    expect(preview.suggested_mapping.company_name).toBe("Organization");
    expect(preview.suggested_mapping.contact_name).toBe("Contact Person");
    expect(preview.suggested_mapping.email).toBe("E-Mail");
    expect(preview.suggested_mapping.phone).toBe("Telephone");
    expect(preview.suggested_mapping.state).toBe("Province");
  });

  it("returns preview rows (max 5)", () => {
    const rows = Array.from({ length: 10 }, (_, i) => [`Co ${i}`, `Name ${i}`, "", "", `${i} St`, "City", "TX", "77001"]);
    const buf = makeExcelBuffer(
      ["Company", "Contact", "Email", "Phone", "Address", "City", "State", "Zip"],
      rows
    );
    const preview = previewImport(buf, "test.xlsx");

    expect(preview.total_rows).toBe(10);
    expect(preview.preview_rows).toHaveLength(5);
  });

  it("skips empty rows", () => {
    const buf = makeExcelBuffer(
      ["Company", "City", "State"],
      [["Mosaic", "Houston", "TX"], [null, null, null], ["Nutrien", "Calgary", "AB"]]
    );
    const preview = previewImport(buf, "test.xlsx");
    expect(preview.total_rows).toBe(2);
  });

  it("throws on empty file", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([["Header"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));

    expect(() => previewImport(buf, "test.xlsx")).toThrow("at least a header row and one data row");
  });

  it("detects priority and type columns", () => {
    const buf = makeExcelBuffer(
      ["Customer", "Address", "City", "State", "Priority", "Industry"],
      [["Test", "123 St", "Houston", "TX", "high", "refinery"]]
    );
    const preview = previewImport(buf, "test.xlsx");
    expect(preview.suggested_mapping.company_name).toBe("Customer");
    expect(preview.suggested_mapping.priority).toBe("Priority");
  });
});
