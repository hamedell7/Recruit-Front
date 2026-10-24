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

function createPdfGroups(report) {
  const groups = [
    {
      key: "general",
      title: "اطلاعات اصلی پرونده",
      description: "خلاصه مشخصات و اطلاعات هویتی",
      sections: [
        { key: "request_info", title: "اطلاعات کلی پرونده", description: "کد رهگیری، نوع پرونده، وضعیت و تاریخ‌ها" },
        { key: "applicant", title: "مشخصات متقاضی", description: "نام، کد ملی، شماره همراه و اطلاعات هویتی" },
      ],
    },
    {
      key: "workflow-overview",
      title: "نمای کلی گردش‌کار",
      description: "مرور مرحله‌ها و وضعیت آن‌ها",
      sections: [
        { key: "progress", title: "نمای کلی فرآیند", description: "فهرست مرحله‌ها و وضعیت گردش‌کار" },
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
        title,
        description: "انتخاب مرحله‌ها به‌صورت مستقل",
        sections: [],
      });
    }
    const state = STEP_STATUS_LABELS[step.status] || step.status || "ثبت نشده";
    stepGroups.get(title).sections.push({
      key: "step:" + step.key,
      title: step.title || step.key,
      description: "وضعیت مرحله: " + state,
    });
  });

  groups.push(...stepGroups.values());
  groups.push({
    key: "attachments",
    title: "مدارک و پیوست‌ها",
    description: "فهرست فایل‌ها؛ محتوای فایل‌ها داخل PDF ادغام نمی‌شود",
    sections: [{
      key: "documents",
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
                  <div>
                    <h6>{group.title}</h6>
                    <p>{group.description}</p>
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
