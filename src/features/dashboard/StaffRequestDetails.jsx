import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { normalizeList } from "../../utils/collections";
import { formatDate } from "../../utils/date";
import { statusLabel } from "../../utils/status";
import {
  isInternalKey,
  labelFor,
  valueFor,
  printRequestReport,
} from "../../utils/requestPdf";
import AdminBreadcrumb from "../../components/layout/AdminBreadcrumb";
import ExcelExportModal from "./ExcelExportModal";
import "../../styles/staff-request-details.css";

const numberFormat = new Intl.NumberFormat("fa-IR");

const DOCUMENT_TYPE_LABELS = {
  identity: "مدرک هویتی",
  education: "مدرک تحصیلی",
  employment: "مدرک شغلی",
  other: "سایر مدارک",
};

const STEP_STATUS_LABELS = {
  COMPLETED: "تکمیل‌شده",
  APPROVED: "تأییدشده",
  ACTIVE: "مرحله فعلی",
  IN_PROGRESS: "در حال تکمیل",
  RETURNED: "نیازمند اصلاح",
  REJECTED: "ردشده",
  UNDER_REVIEW: "در حال بررسی",
  SUBMITTED: "ثبت نهایی",
  PENDING: "در انتظار شروع",
  SKIPPED: "رد شدن از مرحله",
};

const DECISION_LABELS = {
  START_REVIEW: "شروع بررسی",
  APPROVE: "تأیید درخواست",
  RETURN: "بازگرداندن برای اصلاح",
  REJECT: "رد درخواست",
};

const FIELD_WORD_LABELS = {
  applicant: "متقاضی",
  person: "فرد",
  profile: "مشخصات",
  personal: "فردی",
  first: "اول",
  last: "آخر",
  name: "نام",
  code: "کد",
  type: "نوع",
  number: "شماره",
  id: "شناسه",
  status: "وضعیت",
  date: "تاریخ",
  time: "زمان",
  start: "شروع",
  end: "پایان",
  current: "فعلی",
  previous: "قبلی",
  old: "قبلی",
  new: "جدید",
  description: "توضیحات",
  details: "جزئیات",
  reason: "علت",
  result: "نتیجه",
  address: "نشانی",
  country: "کشور",
  province: "استان",
  city: "شهر",
  county: "شهرستان",
  village: "روستا",
  phone: "تلفن",
  mobile: "همراه",
  email: "رایانامه",
  contact: "تماس",
  relation: "نسبت",
  family: "خانواده",
  spouse: "همسر",
  relative: "بستگان",
  child: "فرزند",
  education: "تحصیلات",
  employment: "اشتغال",
  work: "کار",
  organization: "سازمان",
  company: "شرکت",
  file: "فایل",
  document: "مدرک",
  size: "حجم",
  count: "تعداد",
  amount: "میزان",
  has: "دارای",
  is: "وضعیت",
  accepted: "پذیرش",
  created: "ایجاد",
  updated: "به‌روزرسانی",
  submitted: "ثبت",
  completed: "تکمیل",
};

const STEP_KEY_LABELS = {
  personal: "اطلاعات فردی",
  identity: "مشخصات هویتی",
  applicant: "اطلاعات متقاضی",
  profile: "مشخصات فردی",
  contact: "راه‌های تماس",
  contacts: "راه‌های تماس",
  address: "نشانی",
  addresses: "نشانی‌ها",
  education: "سوابق تحصیلی",
  employment: "سوابق شغلی",
  work: "اطلاعات شغلی",
  military: "وضعیت نظام وظیفه",
  documents: "مدارک پرونده",
  declaration: "تعهدنامه",
  relatives: "اطلاعات بستگان",
  family: "اطلاعات خانواده",
  review: "بررسی پرونده",
};

function isEmpty(value) {
  return value === null || value === undefined || value === "" ||
    (Array.isArray(value) && value.length === 0);
}

function displayFieldLabel(key) {
  const label = labelFor(key);
  if (label !== "سایر اطلاعات") return label;

  const words = String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const translated = [...new Set(words.map((word) => FIELD_WORD_LABELS[word]).filter(Boolean))];
  return translated.length ? translated.join(" ") : "اطلاعات تکمیلی";
}

function displayStepTitle(step, index = 0) {
  const title = String(step?.title || "").trim();
  if (title && /[\u0600-\u06FF]/.test(title)) return title;

  const key = String(step?.key || "").toLowerCase();
  return STEP_KEY_LABELS[key] || (step?.key ? "مرحله " + numberFormat.format(index + 1) : "—");
}

function displayGroupTitle(value, step) {
  const title = String(value || "").trim();
  if (title && /[\u0600-\u06FF]/.test(title)) return title;
  return STEP_KEY_LABELS[String(step?.key || "").toLowerCase()] || "اطلاعات پرونده";
}

function ApplicantData({ value, fieldKey = "value" }) {
  if (isEmpty(value)) return null;

  if (Array.isArray(value)) {
    if (!value.length) return null;
    return (
      <div className="srd-repeat-list">
        {value.map((item, index) => (
          <article className="srd-repeat-card" key={item?.id || index}>
            <div className="srd-repeat-title">مورد {numberFormat.format(index + 1)}</div>
            <ApplicantData value={item} />
          </article>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([key, item]) => (
      !isInternalKey(key) && !isEmpty(item)
    ));
    const scalarEntries = entries.filter(([, item]) => (
      item === null || typeof item !== "object"
    ));
    const nestedEntries = entries.filter(([, item]) => (
      item !== null && typeof item === "object"
    ));

    if (!scalarEntries.length && !nestedEntries.length) return null;

    return (
      <div className="srd-record-data">
        {scalarEntries.length > 0 && (
          <div className="srd-field-grid">
            {scalarEntries.map(([key, item]) => (
              <div className="srd-field" key={key}>
                <span>{displayFieldLabel(key)}</span>
                <strong>{valueFor(key, item) || "—"}</strong>
              </div>
            ))}
          </div>
        )}
        {nestedEntries.map(([key, item]) => {
          const rendered = <ApplicantData value={item} fieldKey={key} />;
          if (!rendered) return null;
          return (
            <section className="srd-nested-section" key={key}>
              <h4>{displayFieldLabel(key)}</h4>
              {rendered}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="srd-field">
      <span>{displayFieldLabel(fieldKey)}</span>
      <strong>{valueFor(fieldKey, value) || "—"}</strong>
    </div>
  );
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) {
    return numberFormat.format(Math.max(1, Math.round(bytes / 1024))) + " کیلوبایت";
  }
  return numberFormat.format(Number((bytes / (1024 * 1024)).toFixed(1))) + " مگابایت";
}

function documentTypeLabel(value) {
  return DOCUMENT_TYPE_LABELS[value] || value || "مدرک";
}

function canPreviewDocument(document) {
  return document?.mime_type === "application/pdf" ||
    String(document?.mime_type || "").startsWith("image/");
}

function saveDownloadedFile(file) {
  const url = window.URL.createObjectURL(file.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename || "request.xlsx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function findApplicantProfile(value) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findApplicantProfile(item);
      if (found) return found;
    }
    return null;
  }

  const role = String(value.person_role || value.role_type || "").toUpperCase();
  if (
    (value.first_name || value.last_name) &&
    !["SPOUSE", "RELATIVE", "CHILD", "FATHER", "MOTHER", "SIBLING"].includes(role)
  ) {
    return value;
  }

  const priorityKeys = ["person", "applicant", "profile", "personal", "people", "records"];
  for (const key of priorityKeys) {
    if (value[key] && typeof value[key] === "object") {
      const found = findApplicantProfile(value[key]);
      if (found) return found;
    }
  }

  for (const item of Object.values(value)) {
    if (item && typeof item === "object") {
      const found = findApplicantProfile(item);
      if (found) return found;
    }
  }
  return null;
}

function DocumentList({ documents, requestId, compact = false }) {
  if (!documents.length) {
    return (
      <div className="srd-empty-inline">
        <span aria-hidden="true">▤</span>
        <strong>مدرکی برای این پرونده بارگذاری نشده است.</strong>
      </div>
    );
  }

  const visibleDocuments = compact ? documents.slice(0, 3) : documents;
  return (
    <div className="srd-document-list">
      {visibleDocuments.map((document, index) => (
        <article className="srd-document-row" key={document.id}>
          <div className="srd-document-number">{numberFormat.format(index + 1)}</div>
          <div className="srd-document-icon" aria-hidden="true">
            {document.mime_type === "application/pdf" ? "پی‌دی‌اف" : "▤"}
          </div>
          <div className="srd-document-main">
            <strong title={document.filename}>{document.filename || "فایل بدون نام"}</strong>
            <span>{documentTypeLabel(document.document_type)} · {formatBytes(document.size_bytes)}</span>
            {!compact && document.created_at && (
              <small>تاریخ بارگذاری: {formatDate(document.created_at)}</small>
            )}
          </div>
          <div className="srd-document-actions">
            {canPreviewDocument(document) && (
              <a
                className="srd-document-button is-preview"
                href={api.staffRequestDocumentUrl(requestId, document.id, false)}
                target="_blank"
                rel="noreferrer"
              >
                <span aria-hidden="true">↗</span> مشاهده
              </a>
            )}
            <a
              className="srd-document-button is-download"
              href={api.staffRequestDocumentUrl(requestId, document.id, true)}
            >
              <span aria-hidden="true">↓</span> دانلود
            </a>
          </div>
        </article>
      ))}
      {compact && documents.length > visibleDocuments.length && (
        <p className="srd-more-documents">و {numberFormat.format(documents.length - visibleDocuments.length)} مدرک دیگر</p>
      )}
    </div>
  );
}

function StepTimeline({ steps, selectedStepKey, onSelectStep }) {
  if (!steps.length) {
    return <div className="srd-empty-inline"><strong>گردش‌کاری برای نمایش وجود ندارد.</strong></div>;
  }

  if (onSelectStep) {
    const completedCount = steps.filter((step) => (
      ["COMPLETED", "APPROVED", "SKIPPED"].includes(step.status)
    )).length;
    const progress = Math.round((completedCount / steps.length) * 100);
    const selectedIndex = Math.max(0, steps.findIndex((step) => step.key === selectedStepKey));
    const groups = steps.reduce((result, step, index) => {
      const title = displayGroupTitle(step.group_title, step);
      const lastGroup = result[result.length - 1];
      if (!lastGroup || lastGroup.title !== title) {
        result.push({ title, steps: [{ step, index }] });
      } else {
        lastGroup.steps.push({ step, index });
      }
      return result;
    }, []);

    return (
      <div className="srd-workflow-rail">
        <header className="srd-workflow-hero">
          <div className="srd-workflow-hero-top">
            <div className="srd-workflow-hero-copy">
              <small>گردش‌کار پرونده</small>
              <strong>مراحل رسیدگی</strong>
            </div>
            <span className="srd-workflow-count-pill">
              <b>{numberFormat.format(completedCount)}</b>
              <i>/</i>
              {numberFormat.format(steps.length)}
            </span>
          </div>
          <div className="srd-workflow-progress-block">
            <div className="srd-workflow-progress-meta">
              <span>پیشرفت تکمیل مراحل</span>
              <strong>{numberFormat.format(progress)}٪</strong>
            </div>
            <div className="srd-workflow-progress-track">
              <span style={{ width: progress + "%" }} />
            </div>
          </div>
          <div className="srd-workflow-hero-footer">
            <span><i aria-hidden="true" /> {numberFormat.format(completedCount)} مرحله تکمیل شده</span>
            <span>مرحله {numberFormat.format(selectedIndex + 1)} از {numberFormat.format(steps.length)}</span>
          </div>
        </header>
        <div className="srd-workflow-rail-body">
          <div className="srd-workflow-rail-label">
            <span>همه مراحل</span>
            <span>{numberFormat.format(steps.length)} مرحله</span>
          </div>
          <div className="srd-step-sections">
            {groups.map((group, groupIndex) => (
              <section className="srd-step-section" key={group.title + "-" + groupIndex}>
                <div className="srd-step-section-heading">
                  <span className="srd-step-section-indicator" aria-hidden="true" />
                  <span className="srd-step-section-title">{group.title}</span>
                </div>
                <div className="srd-step-rail">
                  {group.steps.map(({ step, index }) => {
                    const isSelected = selectedStepKey === step.key;
                    const isCompleted = ["COMPLETED", "APPROVED", "SKIPPED"].includes(step.status);
                    const isCurrent = step.status === "ACTIVE" || step.key === step.current_step_key;
                    const tone = step.status === "RETURNED" || step.status === "REJECTED"
                      ? "warning"
                      : isCurrent ? "current" : isCompleted ? "success" : "neutral";
                    return (
                      <button
                        type="button"
                        className={"srd-step-item" + (isSelected ? " active" : "") + (isCompleted ? " completed" : "") + (isCurrent ? " is-current" : "") + (tone === "warning" ? " is-warning" : "")}
                        key={step.key || index}
                        onClick={() => onSelectStep(step.key)}
                        aria-current={isSelected ? "step" : undefined}
                        aria-pressed={isSelected}
                        aria-label={"نمایش اطلاعات مرحله " + displayStepTitle(step, index)}
                      >
                        <span className="srd-step-dot">{isCompleted ? "✓" : numberFormat.format(index + 1)}</span>
                        <span className="srd-step-copy">
                          <strong>{displayStepTitle(step, index)}</strong>
                          <small>{STEP_STATUS_LABELS[step.status] || statusLabel(step.status)[0]}</small>
                        </span>

                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ol className="srd-timeline">
      {steps.map((step, index) => {
        const isCurrent = step.status === "ACTIVE" || step.key === step.current_step_key;
        const tone = step.status === "COMPLETED" || step.status === "APPROVED"
          ? "success"
          : step.status === "RETURNED" || step.status === "REJECTED"
            ? "warning"
            : isCurrent ? "current" : "neutral";
        return (
          <li className={"srd-timeline-item is-" + tone} key={step.key || index}>
            <span className="srd-timeline-marker">{step.status === "COMPLETED" || step.status === "APPROVED" ? "✓" : numberFormat.format(index + 1)}</span>
            <div className="srd-timeline-copy">
              <div className="srd-timeline-title-row">
                <strong>{displayStepTitle(step, index)}</strong>
                <span className={"srd-step-status is-" + tone}>{STEP_STATUS_LABELS[step.status] || statusLabel(step.status)[0]}</span>
              </div>
              <p>{displayGroupTitle(step.group_title, step)}</p>
              {step.completed_at && <small>تاریخ تکمیل: {formatDate(step.completed_at)}</small>}
              {step.return_reason && <div className="srd-return-reason">علت بازگشت: {step.return_reason}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StaffRequestDetails({ requestId, onBack, onError }) {
  const [report, setReport] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documentsError, setDocumentsError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedInformationStepKey, setSelectedInformationStepKey] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [compactPdfLoading, setCompactPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelExportModal, setExcelExportModal] = useState(null);
  const [decisionMode, setDecisionMode] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [returnStepKey, setReturnStepKey] = useState("");
  const [decisionBusy, setDecisionBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setDocumentsError("");

    Promise.allSettled([
      api.staffRequestReport(requestId),
      api.staffRequestDocuments(requestId),
      api.staffRequestWorkflow(requestId),
    ]).then(([reportResult, documentsResult, workflowResult]) => {
      if (cancelled) return;
      if (reportResult.status === "rejected") {
        setError(reportResult.reason?.message || "دریافت جزئیات پرونده انجام نشد.");
        setReport(null);
      } else {
        setReport(reportResult.value);
      }

      if (documentsResult.status === "fulfilled") {
        setDocuments(normalizeList(documentsResult.value));
      } else {
        setDocuments([]);
        setDocumentsError(documentsResult.reason?.message || "دریافت فهرست مدارک انجام نشد.");
      }

      if (workflowResult.status === "fulfilled") {
        setWorkflow(workflowResult.value);
        const returnable = workflowResult.value?.returnable_step_keys || [];
        const returnableSteps = (workflowResult.value?.groups || [])
          .flatMap((group) => group.steps || [])
          .filter((step) => returnable.includes(step.key));
        setReturnStepKey((current) => (
          returnableSteps.some((step) => step.key === current)
            ? current
            : (returnableSteps[0]?.key || "")
        ));
      } else {
        setWorkflow(null);
      }
    }).catch((reason) => {
      if (!cancelled) setError(reason?.message || "دریافت جزئیات پرونده انجام نشد.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [requestId, refreshKey]);

  const request = report?.request || {};
  const steps = useMemo(() => report?.steps || [], [report?.steps]);
  const informationSteps = useMemo(() => steps.filter((step) => step.key !== "documents"), [steps]);
  const selectedInformationStep = informationSteps.find((step) => step.key === selectedInformationStepKey) || informationSteps[0];
  const applicant = useMemo(() => {
    const personal = steps.find((step) => step.key === "personal")?.data;
    return findApplicantProfile(personal) || {};
  }, [steps]);
  const applicantName = [applicant.first_name, applicant.last_name].filter(Boolean).join(" ").trim() || "متقاضی پرونده";
  const currentStep = steps.find((step) => step.key === request.current_step_key);
  const [requestStatusLabel, requestStatusTone] = statusLabel(request.status);
  const completedSteps = steps.filter((step) => ["COMPLETED", "APPROVED", "SKIPPED"].includes(step.status)).length;
  const progress = steps.length ? Math.round((completedSteps / steps.length) * 100) : 0;
  const canDecide = ["SUBMITTED", "UNDER_REVIEW"].includes(request.status);
  const returnableKeys = workflow?.returnable_step_keys || [];
  const returnableSteps = (workflow?.groups || [])
    .flatMap((group) => group.steps || [])
    .filter((step) => returnableKeys.includes(step.key));

  const exportPdf = async (compact = false) => {
    if (pdfLoading || compactPdfLoading) return;
    if (compact) setCompactPdfLoading(true);
    else setPdfLoading(true);
    try {
      await printRequestReport(requestId, { staff: true, compact });
    } catch (reason) {
      onError?.({
        type: "error",
        text: reason.message || (compact ? "آماده‌سازی PDF فشرده انجام نشد." : "آماده‌سازی گزارش پی‌دی‌اف انجام نشد."),
      });
    } finally {
      if (compact) setCompactPdfLoading(false);
      else setPdfLoading(false);
    }
  };

  const openExcelExportModal = () => {
    if (excelLoading) return;
    setExcelExportModal({
      requestIds: [String(requestId)],
      requestCount: 1,
      scopeLabel: "پرونده " + (request.tracking_code || applicantName),
    });
  };

  const handleExcelExport = async (sheets) => {
    if (excelLoading || !Array.isArray(sheets) || sheets.length === 0) return;
    setExcelLoading(true);
    try {
      const file = await api.exportStaffRequestsExcel({
        mode: "selected",
        request_ids: [String(requestId)],
        sheets,
      });
      if (!file.savedToDisk) saveDownloadedFile(file);
      setExcelExportModal(null);
      onError?.({ type: "success", text: "فایل اکسل جزئیات پرونده آماده شد." });
    } catch (reason) {
      if (reason?.name !== "DownloadCancelledError") {
        onError?.({ type: "error", text: reason.message || "دریافت خروجی اکسل پرونده انجام نشد." });
      }
    } finally {
      setExcelLoading(false);
    }
  };

  const submitDecision = async () => {
    if (!decisionMode || decisionBusy) return;
    const reason = decisionReason.trim();
    if (["RETURN", "REJECT"].includes(decisionMode) && reason.length < 3) {
      onError?.({
        type: "error",
        text: decisionMode === "RETURN" ? "علت بازگرداندن پرونده برای اصلاح را وارد کنید." : "علت رد درخواست را وارد کنید.",
      });
      return;
    }
    if (decisionMode === "RETURN" && !returnStepKey) {
      onError?.({ type: "error", text: "مرحله‌ای را که باید اصلاح شود انتخاب کنید." });
      return;
    }

    setDecisionBusy(true);
    try {
      await api.decideStaffRequest(requestId, {
        decision: decisionMode,
        reason: reason || null,
        return_step_key: decisionMode === "RETURN" ? returnStepKey : null,
      });
      const successMessage = decisionMode === "START_REVIEW"
        ? "پرونده به وضعیت «در حال بررسی» منتقل شد."
        : decisionMode === "APPROVE"
          ? "درخواست با موفقیت تأیید شد."
          : decisionMode === "REJECT"
            ? "درخواست رد شد."
            : "پرونده برای اصلاح بازگردانده شد.";
      setDecisionMode("");
      setDecisionReason("");
      setRefreshKey((value) => value + 1);
      onError?.({ type: "success", text: successMessage });
    } catch (reasonError) {
      onError?.({ type: "error", text: reasonError.message || "ثبت تصمیم انجام نشد." });
    } finally {
      setDecisionBusy(false);
    }
  };

  if (loading && !report) {
    return (
      <main className="page srd-page" dir="rtl">
        <div className="srd-loading">
          <span className="srd-spinner" />
          <strong>در حال دریافت اطلاعات کامل پرونده…</strong>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="page srd-page" dir="rtl">
        <div className="srd-toolbar">
          <button type="button" className="srd-back-button" onClick={onBack}>← بازگشت به فهرست پرونده‌ها</button>
        </div>
        <div className="srd-error">
          <span aria-hidden="true">!</span>
          <h1>دریافت پرونده ناموفق بود</h1>
          <p>{error || "اطلاعات پرونده در دسترس نیست."}</p>
          <button type="button" className="primary-button" onClick={() => setRefreshKey((value) => value + 1)}>تلاش دوباره</button>
        </div>
      </main>
    );
  }

  const applicantNationalId = applicant.national_id || applicant.national_id_number || report.applicant?.national_id;
  const applicantMobile = applicant.mobile || applicant.mobile_number || report.applicant?.mobile;
  const tabs = [
    { key: "overview", label: "نمای کلی", icon: "◈" },
    { key: "information", label: "اطلاعات ثبت‌شده", icon: "▤", count: steps.filter((step) => step.key !== "documents").length },
    { key: "documents", label: "مدارک", icon: "↗", count: documents.length },
    { key: "workflow", label: "گردش‌کار", icon: "⌁", count: steps.length },
  ];

  return (
    <main className="page srd-page" dir="rtl">
      <AdminBreadcrumb
        items={["پنل مدیریت", "پرونده‌ها", "جزئیات کامل"]}
        onBack={onBack}
        backLabel="بازگشت به فهرست پرونده‌ها"
      />

      <section className="srd-hero">
        <div className="srd-hero-main">
          <div className="srd-avatar">{applicantName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("") || "؟"}</div>
          <div className="srd-hero-copy">
            <span className="srd-overline"><i /> پرونده الکترونیکی متقاضی</span>
            <h1>{applicantName}</h1>
            <div className="srd-hero-meta">
              <span>کد رهگیری <b>{request.tracking_code || "—"}</b></span>
              <span>{report.request_type?.title || "نوع درخواست"}</span>
              <span className={"srd-status-pill is-" + (requestStatusTone || "muted")}><i />{requestStatusLabel}</span>
            </div>
          </div>
        </div>
        <div className="srd-hero-actions">
          <button type="button" className="srd-action-button is-secondary" onClick={openExcelExportModal} disabled={excelLoading}>
            <span aria-hidden="true">▦</span>{excelLoading ? "در حال ساخت اکسل…" : "دریافت فایل اکسل"}
          </button>
          <button type="button" className="srd-action-button is-secondary" onClick={() => exportPdf(true)} disabled={pdfLoading || compactPdfLoading} title="چیدمان فشرده A4 عمودی با ستون‌های بیشتر برای قرارگیری اطلاعات در حداکثر ۳ صفحه">
            <span aria-hidden="true">▤</span>{compactPdfLoading ? "در حال آماده‌سازی…" : "PDF فشرده"}
          </button>
          <button type="button" className="srd-action-button is-primary" onClick={() => exportPdf(false)} disabled={pdfLoading || compactPdfLoading}>
            <span aria-hidden="true">↓</span>{pdfLoading ? "در حال آماده‌سازی…" : "چاپ / دریافت گزارش"}
          </button>
        </div>
      </section>

      <section className="srd-summary-grid">
        <article className="srd-summary-card">
          <span className="srd-summary-icon is-blue">⌁</span>
          <div><small>مرحله فعلی</small><strong>{displayStepTitle(currentStep || { key: request.current_step_key }, Math.max(0, steps.findIndex((step) => step.key === request.current_step_key)))}</strong><span>{numberFormat.format(completedSteps)} از {numberFormat.format(steps.length)} مرحله تکمیل شده</span></div>
        </article>
        <article className="srd-summary-card">
          <span className="srd-summary-icon is-teal">◷</span>
          <div><small>تاریخ ایجاد پرونده</small><strong>{formatDate(request.created_at)}</strong></div>
        </article>
        <article className="srd-summary-card">
          <span className="srd-summary-icon is-violet">✓</span>
          <div><small>تاریخ ثبت نهایی</small><strong>{formatDate(request.submitted_at)}</strong>{request.completed_at && <span>تاریخ تکمیل: {formatDate(request.completed_at)}</span>}</div>
        </article>
        <article className="srd-summary-card">
          <span className="srd-summary-icon is-amber">▤</span>
          <div><small>مدارک پیوست‌شده</small><strong>{numberFormat.format(documents.length)} فایل</strong></div>
        </article>
      </section>

      <div className="srd-progress-card">
        <div className="srd-progress-copy">
          <div><strong>پیشرفت گردش‌کار</strong><span>{numberFormat.format(progress)}٪ تکمیل</span></div>
        </div>
        <div className="srd-progress-track"><span style={{ width: progress + "%" }} /></div>
      </div>

      <nav className="srd-tabs" aria-label="بخش‌های جزئیات پرونده">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={"srd-tab" + (activeTab === tab.key ? " is-active" : "")}
            aria-current={activeTab === tab.key ? "page" : undefined}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="srd-tab-icon" aria-hidden="true">{tab.icon}</span>
            {tab.label}
            {tab.count !== undefined && <b>{numberFormat.format(tab.count)}</b>}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <div className="srd-content-grid">
          <div className="srd-primary-column">
            <section className="srd-panel">
              <div className="srd-panel-heading">
                <div><span className="srd-panel-kicker">اطلاعات هویتی</span><h2>مشخصات متقاضی</h2></div>
                <span className="srd-panel-symbol">◎</span>
              </div>
              <div className="srd-profile-grid">
                <div><span>نام و نام خانوادگی</span><strong>{applicantName}</strong></div>
                <div><span>کد ملی</span><strong dir="ltr">{applicantNationalId || "—"}</strong></div>
                <div><span>شماره همراه</span><strong dir="ltr">{applicantMobile || "—"}</strong></div>
                <div><span>نام پدر</span><strong>{applicant.father_name || "—"}</strong></div>
                <div><span>نوع درخواست</span><strong>{report.request_type?.title || "—"}</strong></div>
                <div><span>آخرین به‌روزرسانی</span><strong>{formatDate(request.updated_at)}</strong></div>
              </div>
              <button className="srd-inline-link" type="button" onClick={() => setActiveTab("information")}>مشاهده تمام اطلاعات ثبت‌شده <span>←</span></button>
            </section>

            <section className="srd-panel">
              <div className="srd-panel-heading">
                <div><span className="srd-panel-kicker">خلاصه مراحل</span><h2>مسیر بررسی پرونده</h2></div>
                <button className="srd-text-button" type="button" onClick={() => setActiveTab("workflow")}>مشاهده گردش‌کار</button>
              </div>
              <StepTimeline steps={steps.slice(0, 5)} />
              {steps.length > 5 && (
                <button className="srd-inline-link" type="button" onClick={() => setActiveTab("workflow")}>مشاهده همه {numberFormat.format(steps.length)} مرحله <span>←</span></button>
              )}
            </section>

            {canDecide && (
              <section className="srd-panel srd-decision-panel">
                <div className="srd-panel-heading">
                  <div><span className="srd-panel-kicker">اقدام مدیریتی</span><h2>تصمیم درباره پرونده</h2></div>
                  <span className="srd-panel-symbol">⚖</span>
                </div>
                <div className="srd-decision-choices">
                  {request.status === "SUBMITTED" && (
                    <button type="button" className="srd-decision-choice is-review" onClick={() => { setDecisionMode("START_REVIEW"); setDecisionReason(""); }} disabled={decisionBusy}>⌕ شروع بررسی</button>
                  )}
                  <button type="button" className="srd-decision-choice is-approve" onClick={() => { setDecisionMode("APPROVE"); setDecisionReason(""); }} disabled={decisionBusy}>✓ تأیید درخواست</button>
                  <button type="button" className="srd-decision-choice is-return" onClick={() => { setDecisionMode("RETURN"); setDecisionReason(""); }} disabled={decisionBusy}>↶ بازگرداندن برای اصلاح</button>
                  <button type="button" className="srd-decision-choice is-reject" onClick={() => { setDecisionMode("REJECT"); setDecisionReason(""); }} disabled={decisionBusy}>× رد درخواست</button>
                </div>
                {decisionMode && (
                  <div className="srd-decision-form">
                    <strong>{DECISION_LABELS[decisionMode]}</strong>
                    {decisionMode === "RETURN" && (
                      <label><span>مرحله‌ای که باید اصلاح شود</span>
                        <select value={returnStepKey} onChange={(event) => setReturnStepKey(event.target.value)} disabled={!workflow || decisionBusy}>
                          <option value="">انتخاب مرحله…</option>
                          {returnableSteps.map((step) => <option key={step.key} value={step.key}>{step.title}</option>)}
                        </select>
                      </label>
                    )}
                    {["RETURN", "REJECT"].includes(decisionMode) && (
                      <label><span>علت تصمیم (الزامی)</span>
                        <textarea rows={3} maxLength={2000} value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} placeholder={decisionMode === "RETURN" ? "مورد یا اطلاعاتی که باید اصلاح شود را شرح دهید…" : "علت رد درخواست را شرح دهید…"} />
                      </label>
                    )}
                    <div className="srd-decision-form-actions">
                      <button type="button" className="srd-action-button is-secondary" disabled={decisionBusy} onClick={() => { setDecisionMode(""); setDecisionReason(""); }}>انصراف</button>
                      <button type="button" className="srd-action-button is-primary" disabled={decisionBusy || (decisionMode === "RETURN" && (!workflow || !returnStepKey))} onClick={submitDecision}>
                        {decisionBusy ? "در حال ثبت تصمیم…" : "ثبت تصمیم"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="srd-side-column">
            <section className="srd-panel">
              <div className="srd-panel-heading">
                <div><span className="srd-panel-kicker">مدارک پیوست</span><h2>مدارک پرونده</h2></div>
                <span className="srd-count-badge">{numberFormat.format(documents.length)}</span>
              </div>
              {documentsError ? (
                <div className="srd-inline-error">{documentsError}</div>
              ) : (
                <DocumentList documents={documents} requestId={requestId} compact />
              )}
              {documents.length > 0 && (
                <button className="srd-inline-link" type="button" onClick={() => setActiveTab("documents")}>رفتن به بخش مدارک <span>←</span></button>
              )}
            </section>
          </aside>
        </div>
      )}

      {activeTab === "information" && (
        <div className="srd-content-grid srd-information-layout">
          <div className="srd-primary-column">
            {selectedInformationStep ? (() => {
              const step = selectedInformationStep;
              const index = informationSteps.findIndex((item) => item.key === step.key);
              const [stepLabel, stepTone] = statusLabel(step.status);
              return (
                <section className="srd-panel srd-step-panel srd-selected-step-panel" key={step.key}>
                  <div className="srd-panel-heading">
                    <div className="srd-step-heading-copy">
                      <span className="srd-step-number">{numberFormat.format(index + 1)}</span>
                      <div><span className="srd-panel-kicker">{displayGroupTitle(step.group_title, step)}</span><h2>{displayStepTitle(step, index)}</h2></div>
                    </div>
                    <span className={"srd-status-pill is-" + (stepTone || "muted")}>{STEP_STATUS_LABELS[step.status] || stepLabel}</span>
                  </div>
                  {step.return_reason && <div className="srd-return-reason">علت بازگشت برای اصلاح: {step.return_reason}</div>}
                  {step.data_source === "not_loaded" ? (
                    <div className="srd-empty-inline">اطلاعات این مرحله بارگذاری نشده است.</div>
                  ) : step.data === null || step.data === undefined || (typeof step.data === "object" && Object.keys(step.data).length === 0) ? (
                    <div className="srd-empty-inline">اطلاعاتی برای نمایش در این مرحله ثبت نشده است.</div>
                  ) : (
                    <ApplicantData value={step.data} />
                  )}
                  <div className="srd-step-footer">
                    {step.completed_at && <span>تاریخ تکمیل: {formatDate(step.completed_at)}</span>}
                  </div>
                </section>
              );
            })() : (
              <section className="srd-panel srd-empty-inline">
                اطلاعاتی برای نمایش ثبت نشده است.
              </section>
            )}
          </div>

          <aside className="srd-side-column srd-workflow-sidebar">
            <section className="srd-panel srd-workflow-panel srd-workflow-rail-panel" aria-label="انتخاب مرحله پرونده">
              <StepTimeline
                steps={informationSteps}
                selectedStepKey={selectedInformationStep?.key}
                onSelectStep={setSelectedInformationStepKey}
              />
            </section>
          </aside>
        </div>
      )}

      {activeTab === "documents" && (
        <section className="srd-panel srd-documents-page-panel">
          <div className="srd-panel-heading">
            <div><span className="srd-panel-kicker">بخش مدارک</span><h2>مدارک بارگذاری‌شده</h2></div>
            <span className="srd-count-badge">{numberFormat.format(documents.length)} فایل</span>
          </div>
          {documentsError ? (
            <div className="srd-inline-error">{documentsError}<button type="button" onClick={() => setRefreshKey((value) => value + 1)}>تلاش دوباره</button></div>
          ) : (
            <DocumentList documents={documents} requestId={requestId} />
          )}
        </section>
      )}

      {activeTab === "workflow" && (
        <section className="srd-panel srd-workflow-panel">
          <div className="srd-panel-heading">
            <div><span className="srd-panel-kicker">سوابق رسیدگی</span><h2>گردش‌کار پرونده</h2></div>
            <span className="srd-count-badge">{numberFormat.format(steps.length)} مرحله</span>
          </div>
          <StepTimeline steps={steps} />
        </section>
      )}

      <footer className="srd-page-footer">
        <span>کد رهگیری: <strong>{request.tracking_code || "—"}</strong></span>
        <span>آخرین به‌روزرسانی: {formatDate(request.updated_at)}</span>
        <button type="button" className="srd-back-button" onClick={onBack}>بازگشت به فهرست پرونده‌ها</button>
      </footer>

      {excelExportModal && (
        <ExcelExportModal
          scopeLabel={excelExportModal.scopeLabel}
          requestCount={excelExportModal.requestCount}
          loading={excelLoading}
          onClose={() => {
            if (!excelLoading) setExcelExportModal(null);
          }}
          onExport={handleExcelExport}
        />
      )}
    </main>
  );
}

export default StaffRequestDetails;
