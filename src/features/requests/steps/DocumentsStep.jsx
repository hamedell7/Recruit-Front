import { useState } from "react";
import { api } from "../../../services/api";
import FormSection from "../../../components/form/FormSection";
import { SelectField } from "../../../components/form/Fields";
import {
  DOCUMENT_ACCEPT_ATTRIBUTE,
  isAllowedDocumentFile,
} from "./documentUploadPolicy.js";

function DocumentsStep({ documents, requestId, onUploaded, onError, readOnly }) {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("identity");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!file) return;
    if (!isAllowedDocumentFile(file)) {
      onError({
        type: "error",
        text: "فایل باید PDF، DOCX، PNG یا JPG/JPEG باشد و حجم آن از ۲ مگابایت بیشتر نباشد.",
      });
      return;
    }
    setBusy(true);
    try {
      const doc = await api.uploadDocument(requestId, file, documentType, "documents");
      onUploaded(doc);
      setFile(null);
    } catch (error) {
      onError({ type: "error", text: error.message, requestId: error.requestId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-stack">
      <FormSection title="بارگذاری مدارک" hint="نوع مدرک را مشخص کنید و سپس فایل را انتخاب نمایید.">
        <div className="upload-grid">
          <label className="upload-zone">
            <input type="file" accept={DOCUMENT_ACCEPT_ATTRIBUTE} onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={readOnly} />
            <div className="upload-icon">↑</div>
            <strong>{file ? file.name : "فایل را انتخاب کنید"}</strong>
            <span>PDF, DOCX, PNG, JPG/JPEG · حداکثر ۲MB</span>
          </label>
          <div className="upload-side">
            <SelectField label="نوع مدرک" value={documentType} onChange={setDocumentType} options={[
              { value: "identity", label: "مدرک هویتی" },
              { value: "education", label: "مدرک تحصیلی" },
              { value: "employment", label: "مدرک شغلی" },
              { value: "other", label: "سایر" },
            ]} readOnly={readOnly} />
            <button className="primary-button wide" disabled={!file || busy || readOnly} onClick={submit}>{busy ? "در حال بارگذاری…" : "بارگذاری امن فایل"}</button>
          </div>
        </div>
      </FormSection>
      <FormSection title="مدارک بارگذاری‌شده" hint="فایل‌های این پرونده به‌صورت اختصاصی برای خود درخواست نمایش داده می‌شوند.">
        {documents.length === 0 ? (
          <div className="inline-empty"><span>□</span><p>هنوز مدرکی بارگذاری نشده است.</p></div>
        ) : (
          <div className="document-list">{documents.map((doc) => (
            <div className="document-row" key={doc.id}>
              <div className="doc-icon">{(doc.filename?.split(".").pop() || "FILE").slice(0, 4).toUpperCase()}</div>
              <div><strong>{doc.filename}</strong><span>{doc.document_type} · {(Number(doc.size_bytes || 0) / 1024 / 1024).toFixed(1)} MB</span></div>
              <a href={api.downloadDocumentUrl(doc.id)} rel="noreferrer">دریافت فایل</a>
            </div>
          ))}</div>
        )}
      </FormSection>
    </div>
  );
}

export default DocumentsStep;
