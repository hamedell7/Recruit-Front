import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/common/Modal";
import "../../styles/pdf-export-modal.css";

const numberFormat = new Intl.NumberFormat("fa-IR");

const STEP_STATUS_LABELS = {
  COMPLETED: "تکمیل‌شده", APPROVED: "تأییدشده", ACTIVE: "مرحله فعال",
  IN_PROGRESS: "در حال تکمیل", RETURNED: "نیازمند اصلاح", REJECTED: "ردشده",
  PENDING: "در انتظار", UNDER_REVIEW: "در حال بررسی", SUBMITTED: "ثبت نهایی",
  SKIPPED: "غیرضروری",
};

const ICON_SHAPES = {
  "file-text": <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" /></>,
  "user-round": <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
  "id-card": <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M5.5 16a3 3 0 0 1 5 0M13 10h5M13 14h5" /></>,
  "list-checks": <><path d="m3 6 2 2 4-4M3 12l2 2 4-4M3 18l2 2 4-4M12 7h9M12 13h9M12 19h9" /></>,
  "files": <><path d="M15 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11" /><path d="M14 2v5h5M9 12h5M9 16h5" /><rect x="10" y="10" width="10" height="12" rx="2" /></>,
  "contact": <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1" /></>,
  "map-pin": <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  "heart": <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></>,
  "users": <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  "graduation-cap": <><path d="m2 10 10-5 10 5-10 5z" /><path d="M6 12v5c4 3 8 3 12 0v-5M22 10v6" /></>,
  "briefcase-business": <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
  "shield-check": <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  "plane": <><path d="m17.8 19.2-3.5-7.1 5.6-5.6a2.1 2.1 0 0 0-3-3l-5.6 5.6-7.1-3.5-2.1 2.1 7.1 5.6-3.5 3.5 2.1 2.1 3.5-3.5 5.6 7.1z" /></>,
  "book-open": <><path d="M12 7v14M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13h-5a4 4 0 0 0-4 3 4 4 0 0 0-4-3Z" /></>,
  "house": <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" /></>,
  "scale": <><path d="m16 16 3-7 3 7a3 3 0 0 1-6 0ZM2 16l3-7 3 7a3 3 0 0 1-6 0ZM12 3v18M5 9h14M8 21h8" /></>,
  "clipboard-check": <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M8 13l2.5 2.5L16 10" /></>,
  "award": <><circle cx="12" cy="8" r="6" /><path d="m8.2 13-1.2 9 5-3 5 3-1.2-9" /></>,
  "folder": <><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
};

function PdfIcon({ name }) {
  return (
    <svg
      className="pdf-export-icon-svg"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_SHAPES[name] || ICON_SHAPES["file-text"]}
    </svg>
  );
}

function iconForStep(key) {
  const icons = {
    personal: "user-round",
    identity: "id-card",
    contacts: "contact",
    residence: "house",
    accommodation: "house",
    addresses: "map-pin",
    marriage: "heart",
    marriages: "heart",
    family: "users",
    people: "users",
    social_references: "users",
    social_friends: "users",
    social_neighbors: "house",
    social_relatives: "users",
    social_family_friends: "users",
    education: "graduation-cap",
    education_employment: "briefcase-business",
    employment: "briefcase-business",
    military_service: "shield-check",
    travel: "plane",
    passport: "book-open",
    passports: "book-open",
    declaration: "clipboard-check",
    veteran: "award",
    screening_records: "clipboard-check",
    legal_records: "scale",
    record: "file-text",
    records: "folder",
    other_records: "folder",
    documents: "files",
  };
  return icons[key] || "file-text";
}

function iconTone(icon) {
  const tones = {
    "file-text": "blue",
    "user-round": "violet",
    "id-card": "cyan",
    "list-checks": "blue",
    files: "rose",
    contact: "cyan",
    "map-pin": "teal",
    heart: "rose",
    users: "green",
    "graduation-cap": "indigo",
    "briefcase-business": "blue",
    "shield-check": "amber",
    plane: "teal",
    "book-open": "purple",
    house: "teal",
    scale: "amber",
    "clipboard-check": "violet",
    award: "amber",
    folder: "slate",
  };
  return tones[icon] || "slate";
}

function createPdfGroups(report) {
  const groups = [
    {
      key: "general",
      icon: "folder",
      title: "اطلاعات اصلی پرونده",
      description: "خلاصه مشخصات و اطلاعات هویتی",
      sections: [
        { key: "request_info", icon: "file-text", title: "اطلاعات کلی پرونده", description: "کد رهگیری، نوع پرونده، وضعیت و تاریخ‌ها" },
        { key: "applicant", icon: "user-round", title: "مشخصات متقاضی", description: "نام، کد ملی، شماره همراه و اطلاعات هویتی" },
      ],
    },
    {
      key: "workflow-overview",
      icon: "list-checks",
      title: "نمای کلی گردش‌کار",
      description: "مرور مرحله‌ها و وضعیت آن‌ها",
      sections: [
        { key: "progress", icon: "list-checks", title: "نمای کلی فرآیند", description: "فهرست مرحله‌ها و وضعیت گردش‌کار" },
      ],
    },
  ];

  const stepGroups = new Map();
  const steps = Array.isArray(report?.steps) ? report.steps : [];
  steps.filter((step) => step && step.data !== null && step.data !== undefined).forEach((step) => {
    const title = step.group_title || "سایر مراحل";
    if (!stepGroups.has(title)) {
      stepGroups.set(title, {
        key: "step-group-" + String(stepGroups.size + 1),
        icon: iconForStep(step.key),
        title,
        description: "انتخاب مرحله‌ها به‌صورت مستقل",
        sections: [],
      });
    }
    const state = STEP_STATUS_LABELS[step.status] || step.status || "ثبت نشده";
    stepGroups.get(title).sections.push({
      key: "step:" + step.key,
      icon: iconForStep(step.key),
      tone: iconTone(iconForStep(step.key)),
      title: step.title || step.key,
      description: "وضعیت مرحله: " + state,
    });
  });

  groups.push(...stepGroups.values());
  groups.push({
    key: "attachments",
    icon: "files",
    title: "مدارک و پیوست‌ها",
    description: "فهرست فایل‌ها؛ محتوای فایل‌ها داخل PDF ادغام نمی‌شود",
    sections: [{
      key: "documents",
      icon: "files",
      tone: iconTone("files"),
      title: "فهرست مدارک بارگذاری‌شده",
      description: Array.isArray(report?.documents) && report.documents.length
        ? numberFormat.format(report.documents.length) + " فایل پیوست‌شده"
        : "در صورت وجود، فهرست مدارک را نمایش می‌دهد",
    }],
  });
  return groups.filter((group) => group.sections.length > 0);
}

function PdfExportModal({
  scopeLabel,
  report,
  loading = false,
  initialCompact = false,
  onClose,
  onExport,
}) {
  const [compact, setCompact] = useState(initialCompact);
  const [selectedSections, setSelectedSections] = useState(() => new Set(
    createPdfGroups(report).flatMap((group) => group.sections.map((section) => section.key)),
  ));
  const groups = useMemo(() => createPdfGroups(report), [report]);
  const sectionKeys = useMemo(
    () => groups.flatMap((group) => group.sections.map((section) => section.key)),
    [groups],
  );

  useEffect(() => {
    setSelectedSections(new Set(sectionKeys));
  }, [sectionKeys]);

  const selectedCount = selectedSections.size;
  const allSelected = sectionKeys.length > 0 && selectedCount === sectionKeys.length;

  const toggleSection = (key, checked) => {
    setSelectedSections((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleGroup = (group) => {
    setSelectedSections((current) => {
      const next = new Set(current);
      const keys = group.sections.map((section) => section.key);
      const fullySelected = keys.every((key) => next.has(key));
      keys.forEach((key) => {
        if (fullySelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedSections(allSelected ? new Set() : new Set(sectionKeys));
  };

  const submit = () => {
    if (loading || selectedCount === 0) return;
    onExport(sectionKeys.filter((key) => selectedSections.has(key)), compact);
  };

  return (
    <Modal
      title="تنظیم خروجی PDF"
      onClose={() => {
        if (!loading) onClose();
      }}
    >
      <div className="pdf-export-dialog" dir="rtl">
        <div className="pdf-export-intro">
          <div className="pdf-export-intro-icon" aria-hidden="true">PDF</div>
          <div className="pdf-export-intro-copy">
            <span className="pdf-export-eyebrow">REPORT BUILDER</span>
            <h4>گزارش را مطابق نیازتان بسازید</h4>
            <p>بخش‌هایی را که لازم دارید انتخاب کنید؛ فقط همان بخش‌ها وارد خروجی می‌شوند.</p>
          </div>
        </div>

        <div className="pdf-export-scope">
          <div className="pdf-export-scope-icon" aria-hidden="true">⌁</div>
          <div className="pdf-export-scope-copy">
            <span>پرونده انتخاب‌شده</span>
            <strong>{scopeLabel}</strong>
          </div>
          <div className="pdf-export-request-count">
            <strong>{numberFormat.format(1)}</strong>
            <span>پرونده</span>
          </div>
        </div>

        <div className="pdf-export-section-heading">
          <div>
            <h5>محتوای گزارش</h5>
            <p>با انتخاب گروه، همه بخش‌های داخل آن روشن یا خاموش می‌شوند.</p>
          </div>
          <button type="button" className="pdf-export-toggle-all" onClick={toggleAll} disabled={loading}>
            {allSelected ? "لغو انتخاب همه" : "انتخاب همه بخش‌ها"}
          </button>
        </div>

        <div className="pdf-export-groups">
          {groups.map((group) => {
            const groupKeys = group.sections.map((section) => section.key);
            const groupSelectedCount = groupKeys.filter((key) => selectedSections.has(key)).length;
            const groupFullySelected = groupSelectedCount === groupKeys.length;
            return (
              <section className="pdf-export-group" key={group.key}>
                <div className="pdf-export-group-heading">
                  <div className="pdf-export-group-heading-main">
                    <span className={"pdf-export-group-icon tone-" + iconTone(group.icon)}><PdfIcon name={group.icon} /></span>
                    <div className="pdf-export-group-heading-copy">
                      <h6>{group.title}</h6>
                      <p>{group.description}</p>
                    </div>
                  </div>
                  <button type="button" className="pdf-export-group-toggle" onClick={() => toggleGroup(group)} disabled={loading}>
                    {groupFullySelected ? "لغو گروه" : "انتخاب گروه"}
                    <span>{numberFormat.format(groupSelectedCount)}/{numberFormat.format(group.sections.length)}</span>
                  </button>
                </div>
                <div className="pdf-export-section-grid">
                  {group.sections.map((section) => {
                    const checked = selectedSections.has(section.key);
                    return (
                      <label className={"pdf-export-section-card" + (checked ? " is-selected" : "") + (loading ? " is-disabled" : "")} key={section.key}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => toggleSection(section.key, event.target.checked)}
                          disabled={loading}
                        />
                        <span className={"pdf-export-checkmark" + (checked ? " is-checked" : "")} aria-hidden="true">{checked ? "✓" : ""}</span>
                        <span className={"pdf-export-item-icon tone-" + (section.tone || iconTone(section.icon))}>
                          <PdfIcon name={section.icon} />
                        </span>
                        <span className="pdf-export-section-copy">
                          <strong>{section.title}</strong>
                          <small>{section.description}</small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="pdf-export-format">
          <div>
            <strong>قالب خروجی</strong>
            <span>می‌توانید حالت فشرده را برای صفحات کمتر انتخاب کنید.</span>
          </div>
          <div className="pdf-export-format-options" role="group" aria-label="قالب PDF">
            <button type="button" className={!compact ? "is-active" : ""} onClick={() => setCompact(false)} disabled={loading}>استاندارد</button>
            <button type="button" className={compact ? "is-active" : ""} onClick={() => setCompact(true)} disabled={loading}>فشرده</button>
          </div>
        </div>

        <div className="pdf-export-footer">
          <div className="pdf-export-selected-count" aria-live="polite">
            <span className="pdf-export-count-dot" />
            <strong>{numberFormat.format(selectedCount)} بخش</strong>
            <span>انتخاب‌شده از {numberFormat.format(sectionKeys.length)}</span>
            {selectedCount === 0 && <small className="pdf-export-selection-hint">برای ساخت خروجی، حداقل یک بخش را انتخاب کنید.</small>}
          </div>
          <div className="pdf-export-actions">
            <button type="button" className="pdf-export-cancel" onClick={onClose} disabled={loading}>انصراف</button>
            <button type="button" className="pdf-export-submit" onClick={submit} disabled={loading || selectedCount === 0}>
              {loading ? <><span className="pdf-export-spinner" aria-hidden="true" /> در حال تولید PDF…</> : <><span aria-hidden="true">↓</span> ساخت PDF</>}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default PdfExportModal;
