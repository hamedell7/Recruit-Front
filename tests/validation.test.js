import test from "node:test";
import assert from "node:assert/strict";

import { formatErrorPath, getFieldError } from "../src/utils/validation.js";

test("formats nested marriage validation paths in Persian", () => {
  assert.equal(
    formatErrorPath("marriages.0.spouse.physical_status"),
    "ازدواج‌ها ← ردیف ۱ ← همسر ← وضعیت جسمانی",
  );
});

test("formats repeated field paths using Persian row numbers", () => {
  assert.equal(
    formatErrorPath("people.1.addresses.0.phone"),
    "افراد ← ردیف ۲ ← نشانی‌ها ← ردیف ۱ ← تلفن",
  );
});

test("falls back to a general form label for an empty path", () => {
  assert.equal(formatErrorPath(""), "اطلاعات فرم");
});

test("returns the exact validation message for a matching field", () => {
  assert.equal(getFieldError({ first_name: "نام الزامی است." }, "first_name"), "نام الزامی است.");
  assert.equal(getFieldError({}, "first_name"), null);
});
