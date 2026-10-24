import test from "node:test";
import assert from "node:assert/strict";

import {
  getSelectablePdfSteps,
  pdfStepEmptyMessage,
  pdfStepSectionKey,
} from "../src/utils/pdfSections.js";

test("keeps workflow steps with missing data available for PDF selection", () => {
  const report = {
    steps: [
      { key: "personal", data: { first_name: "آزمون" } },
      { key: "family", data: null, status: "PENDING" },
      { key: "future", data: undefined, status: "PENDING" },
      { key: "unloaded", data: null, data_source: "not_loaded" },
      null,
      { title: "بدون کلید", data: {} },
      { key: "  ", data: {} },
    ],
  };

  assert.deepEqual(
    getSelectablePdfSteps(report).map((step) => step.key),
    ["personal", "family", "future", "unloaded"],
  );
});

test("returns the same stable key for selection and PDF rendering", () => {
  assert.equal(pdfStepSectionKey("family"), "step:family");
});

test("provides explicit empty-state copy for missing and unhydrated steps", () => {
  assert.equal(
    pdfStepEmptyMessage({ key: "family", data: null }),
    "اطلاعات این مرحله هنوز ثبت نشده است.",
  );
  assert.equal(
    pdfStepEmptyMessage({ key: "family", data_source: "not_loaded" }),
    "اطلاعات این مرحله در این گزارش بارگذاری نشده است.",
  );
  assert.equal(
    pdfStepEmptyMessage({ key: "family", data: {} }),
    "برای این بخش، اطلاعاتی ثبت نشده است.",
  );
});
