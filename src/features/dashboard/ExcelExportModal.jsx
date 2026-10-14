import { useState } from "react";
import Modal from "../../components/common/Modal";
import "../../styles/excel-export-modal.css";

export const EXCEL_SHEET_OPTIONS = [
  {
    key: "summary",
    title: "خلاصه پرونده‌ها",
    description: "کد رهگیری، وضعیت و اطلاعات کلی هر پرونده",
    icon: "▦",
    tone: "blue",
  },
  {
    key: "personal",
    title: "مشخصات فردی",
    description: "اطلاعات هویتی و پروفایل متقاضی",
    icon: "◉",
    tone: "violet",
  },
  {
    key: "contacts_addresses",
    title: "تماس و نشانی",
    description: "راه‌های ارتباطی و اطلاعات مکانی",
    icon: "⌖",
    tone: "cyan",
  },
  {
    key: "marriages",
    title: "سوابق ازدواج",
    description: "سوابق ازدواج، طلاق و اطلاعات همسر",
    icon: "♡",
    tone: "rose",
  },
  {
    key: "related_people",
    title: "اشخاص مرتبط",
    description: "اعضای خانواده، بستگان و سایر اشخاص",
    icon: "♧",
    tone: "green",
  },
  {
    key: "education_employment",
    title: "تحصیلات و اشتغال",
    description: "سوابق تحصیلی، شغلی و سازمانی",
    icon: "▤",
    tone: "indigo",
  },
  {
    key: "military_service",
    title: "خدمت سربازی",
    description: "اطلاعات خدمت، معافیت و اعزام",
    icon: "⟡",
    tone: "amber",
  },
  {
    key: "travel_residence",
    title: "سفر و اقامت",
    description: "سوابق سفر، گذرنامه و محل اقامت",
    icon: "⌂",
    tone: "teal",
  },
  {
    key: "other_records",
    title: "سایر سوابق و توضیحات",
    description: "اطلاعات تکمیلی سایر مراحل پرونده",
    icon: "≋",
    tone: "slate",
  },
  {
    key: "documents",
    title: "مدارک و مستندات",
    description: "فهرست مدارک، وضعیت و زمان ثبت آن‌ها",
    icon: "▣",
    tone: "purple",
  },
];

const numberFormat = new Intl.NumberFormat("fa-IR");

function ExcelExportModal({
  scopeLabel,
  requestCount,
  loading = false,
  onClose,
  onExport,
}) {
  const [selectedSheets, setSelectedSheets] = useState(
    () => new Set(EXCEL_SHEET_OPTIONS.map((sheet) => sheet.key)),
  );

  const selectedCount = selectedSheets.size;
  const allSelected = selectedCount === EXCEL_SHEET_OPTIONS.length;

  const toggleSheet = (key, checked) => {
    setSelectedSheets((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedSheets(
      allSelected
        ? new Set()
        : new Set(EXCEL_SHEET_OPTIONS.map((sheet) => sheet.key)),
    );
  };

  const submit = () => {
    if (loading || selectedCount === 0) return;
    onExport(EXCEL_SHEET_OPTIONS
      .filter((sheet) => selectedSheets.has(sheet.key))
      .map((sheet) => sheet.key));
  };

  return (
    <Modal
      title="تنظیم خروجی اکسل"
      onClose={() => {
        if (!loading) onClose();
      }}
    >
      <div className="excel-export-dialog" dir="rtl">
        <div className="excel-export-intro">
          <div className="excel-export-intro-icon" aria-hidden="true">XLS</div>
          <div className="excel-export-intro-copy">
            <span className="excel-export-eyebrow">EXPORT CENTER</span>
            <h4>فایل اکسل، دقیقاً مطابق نیاز شما</h4>
            <p>شیت‌هایی را که نیاز دارید انتخاب کنید. در حالت عادی همه بخش‌ها انتخاب شده‌اند.</p>
          </div>
        </div>

        <div className="excel-export-scope">
          <div className="excel-export-scope-icon" aria-hidden="true">⌁</div>
          <div className="excel-export-scope-copy">
            <span>دامنه خروجی</span>
            <strong>{scopeLabel}</strong>
          </div>
          <div className="excel-export-request-count">
            <strong>{numberFormat.format(requestCount || 0)}</strong>
            <span>{requestCount === 1 ? "پرونده" : "پرونده"}</span>
          </div>
        </div>

        <div className="excel-export-section-heading">
          <div>
            <h5>محتوای فایل</h5>
            <p>هر بخش در یک شیت مستقل قرار می‌گیرد.</p>
          </div>
          <button
            type="button"
            className="excel-export-toggle-all"
            onClick={toggleAll}
            disabled={loading}
          >
            {allSelected ? "لغو انتخاب همه" : "انتخاب همه شیت‌ها"}
          </button>
        </div>

        <div className="excel-export-sheet-grid">
          {EXCEL_SHEET_OPTIONS.map((sheet, index) => {
            const checked = selectedSheets.has(sheet.key);
            return (
              <label
                className={
                  "excel-export-sheet-card" +
                  (checked ? " is-selected" : "") +
                  (loading ? " is-disabled" : "")
                }
                key={sheet.key}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => toggleSheet(sheet.key, event.target.checked)}
                  disabled={loading}
                />
                <span className={"excel-export-checkmark" + (checked ? " is-checked" : "")} aria-hidden="true">
                  {checked ? "✓" : ""}
                </span>
                <span className={"excel-export-sheet-icon tone-" + sheet.tone} aria-hidden="true">
                  {sheet.icon}
                </span>
                <span className="excel-export-sheet-copy">
                  <strong>{sheet.title}</strong>
                  <small>{sheet.description}</small>
                </span>
                <span className="excel-export-sheet-index">{String(index + 1).padStart(2, "0")}</span>
              </label>
            );
          })}
        </div>

        <div className="excel-export-footer">
          <div className="excel-export-selected-count" aria-live="polite">
            <span className="excel-export-count-dot" />
            <strong>{numberFormat.format(selectedCount)} شیت</strong>
            <span>انتخاب شده از {numberFormat.format(EXCEL_SHEET_OPTIONS.length)}</span>
          </div>
          <div className="excel-export-actions">
            <button
              type="button"
              className="excel-export-cancel"
              onClick={onClose}
              disabled={loading}
            >
              انصراف
            </button>
            <button
              type="button"
              className="excel-export-submit"
              onClick={submit}
              disabled={loading || selectedCount === 0}
            >
              {loading ? (
                <>
                  <span className="excel-export-spinner" aria-hidden="true" />
                  در حال تولید فایل…
                </>
              ) : (
                <>
                  <span aria-hidden="true">↓</span>
                  ساخت فایل اکسل
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ExcelExportModal;
