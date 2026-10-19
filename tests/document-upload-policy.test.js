import test from "node:test";
import assert from "node:assert/strict";

import {
  DOCUMENT_ACCEPT_ATTRIBUTE,
  MAX_DOCUMENT_UPLOAD_BYTES,
  isAllowedDocumentFile,
} from "../src/features/requests/steps/documentUploadPolicy.js";

test("matches the supported backend extensions", () => {
  for (const name of ["identity.pdf", "resume.docx", "scan.png", "passport.jpg", "photo.JPEG"]) {
    assert.equal(isAllowedDocumentFile({ name, size: 100 }), true, name);
  }
});

test("accepts a document exactly at the server-side size limit", () => {
  assert.equal(
    isAllowedDocumentFile({
      name: "identity.pdf",
      size: MAX_DOCUMENT_UPLOAD_BYTES,
    }),
    true,
  );
});

test("rejects unsupported extensions while allowing newly supported DOCX packages", () => {
  for (const name of ["archive.zip", "program.exe", "no-extension"]) {
    assert.equal(isAllowedDocumentFile({ name, size: 100 }), false, name);
  }
  assert.equal(DOCUMENT_ACCEPT_ATTRIBUTE.includes("docx"), true);
});

test("rejects uploads above the server-side size limit", () => {
  assert.equal(
    isAllowedDocumentFile({
      name: "identity.pdf",
      size: MAX_DOCUMENT_UPLOAD_BYTES + 1,
    }),
    false,
  );
});

test("rejects empty files and malformed file objects", () => {
  assert.equal(isAllowedDocumentFile({ name: "empty.pdf", size: 0 }), false);
  assert.equal(isAllowedDocumentFile(null), false);
  assert.equal(isAllowedDocumentFile({ name: "scan.png", size: Number.NaN }), false);
  assert.equal(isAllowedDocumentFile({ name: "", size: 100 }), false);
});
