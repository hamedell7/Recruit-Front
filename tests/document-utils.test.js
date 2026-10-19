import assert from "node:assert/strict";
import test from "node:test";

import { canPreviewDocument, documentTypeLabel } from "../src/features/dashboard/documentUtils.js";

test("uses consistent Persian labels for known document types", () => {
  assert.equal(documentTypeLabel("identity"), "مدرک هویتی");
  assert.equal(documentTypeLabel("education"), "مدرک تحصیلی");
  assert.equal(documentTypeLabel("employment"), "مدرک شغلی");
  assert.equal(documentTypeLabel("other"), "سایر مدارک");
});

test("preserves unknown document labels and provides a safe fallback", () => {
  assert.equal(documentTypeLabel("custom_document"), "custom_document");
  assert.equal(documentTypeLabel(""), "مدرک");
  assert.equal(documentTypeLabel(null), "مدرک");
});

test("only previews PDFs and images", () => {
  assert.equal(canPreviewDocument({ mime_type: "application/pdf" }), true);
  assert.equal(canPreviewDocument({ mime_type: "image/webp" }), true);
  assert.equal(canPreviewDocument({ mime_type: "image/png" }), true);
  assert.equal(canPreviewDocument({ mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), false);
  assert.equal(canPreviewDocument(null), false);
});
