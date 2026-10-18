export const MAX_DOCUMENT_UPLOAD_BYTES = 2 * 1024 * 1024;
export const DOCUMENT_ACCEPT_ATTRIBUTE = ".pdf,.png,.jpg,.jpeg";

const ALLOWED_DOCUMENT_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg"]);

export function isAllowedDocumentFile(file) {
  if (
    !file ||
    typeof file.name !== "string" ||
    !Number.isSafeInteger(file.size) ||
    file.size <= 0 ||
    file.size > MAX_DOCUMENT_UPLOAD_BYTES
  ) {
    return false;
  }

  const separator = file.name.lastIndexOf(".");
  if (separator <= 0) return false;

  return ALLOWED_DOCUMENT_EXTENSIONS.has(file.name.slice(separator).toLowerCase());
}
