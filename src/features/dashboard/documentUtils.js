const DOCUMENT_TYPE_LABELS = Object.freeze({
  identity: "مدرک هویتی",
  education: "مدرک تحصیلی",
  employment: "مدرک شغلی",
  other: "سایر مدارک",
});

export function documentTypeLabel(value) {
  return DOCUMENT_TYPE_LABELS[value] || value || "مدرک";
}

export function canPreviewDocument(document) {
  return document?.mime_type === "application/pdf"
    || String(document?.mime_type || "").startsWith("image/");
}

export function saveBlobDownload(file, fallbackFilename) {
  const url = window.URL.createObjectURL(file.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename || fallbackFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
