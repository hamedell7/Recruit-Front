import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidIranianNationalId,
  normalizeMobileForImport,
  normalizeNationalIdForImport,
  validateUserImportRows,
} from "../src/utils/userSpreadsheet.js";

test("restores the leading zeroes removed by Excel", () => {
  assert.equal(normalizeNationalIdForImport("123456789"), "0123456789");
  assert.equal(normalizeMobileForImport("9123456789"), "09123456789");
  assert.equal(isValidIranianNationalId("0123456789"), true);
});

test("normalizes Persian and Arabic digits", () => {
  assert.equal(normalizeNationalIdForImport("۰۱۲۳۴۵۶۷۸۹"), "0123456789");
  assert.equal(normalizeMobileForImport("٠٩١٢٣٤٥٦٧٨٩"), "09123456789");
});

test("does not truncate longer-than-valid identifiers", () => {
  assert.equal(normalizeNationalIdForImport("00123456789"), "00123456789");
  assert.equal(normalizeMobileForImport("009123456789"), "009123456789");
});

test("rejects bad checksum and invalid mobile formats", () => {
  const [row] = validateUserImportRows([{ national_id: "0123456780", mobile: "12345" }]);
  assert.ok(row.errors.some((error) => error.includes("کد ملی")));
  assert.ok(row.errors.some((error) => error.includes("موبایل")));
});

test("requires only national ID and mobile", () => {
  const [row] = validateUserImportRows([{ national_id: "0123456789", mobile: "09123456789" }]);
  assert.deepEqual(row.errors, []);
});

test("marks both rows when a valid national id appears more than once", () => {
  const rows = validateUserImportRows([
    { national_id: "0123456789", mobile: "09123456789" },
    { national_id: "0123456789", mobile: "09123456780" },
  ]);
  assert.ok(rows.every((row) => row.errors.some((error) => error.includes("تکراری"))));
});
