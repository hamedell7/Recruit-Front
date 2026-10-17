import { useEffect, useState } from "react";
import Modal from "../../components/common/Modal";
import { api } from "../../services/api";
import "../../styles/excel-export-modal.css";

const GROUPS = [
  { key: "base", title: "اطلاعات اصلی", description: "خلاصه پرونده و مشخصات هویتی" },
  { key: "family", title: "تماس و خانواده", description: "راه‌های ارتباطی، نشانی‌ها و اشخاص مرتبط" },
  { key: "history", title: "سوابق تحصیلی و شغلی", description: "تحصیلات، اشتغال و خدمت سربازی" },
  { key: "travel", title: "سفر، گذرنامه و اقامت", description: "سوابق سفر و اطلاعات اقامتی" },
  { key: "additional", title: "سوابق تکمیلی و مدارک", description: "سوابق گزینشی، حقوقی و مدارک پیوست" },
];

const SHEET_PRESENTATION = {
  summary: { icon: "▦", tone: "blue" },
  personal: { icon: "◉", tone: "violet" },
  contacts: { icon: "⌖", tone: "cyan" },
  addresses: { icon: "⌂", tone: "teal" },
  marriages: { icon: "♡", tone: "rose" },
  related_people: { icon: "♧", tone: "green" },
  education: { icon: "▤", tone: "indigo" },
  employment: { icon: "▥", tone: "blue" },
  military_service: { icon: "⟡", tone: "amber" },
  travel: { icon: "➜", tone: "teal" },
  passports: { icon: "▣", tone: "purple" },
  residence: { icon: "⌂", tone: "cyan" },
  screening_records: { icon: "◈", tone: "rose" },
  legal_records: { icon: "§", tone: "amber" },
  other_records: { icon: "≋", tone: "slate" },
  documents: { icon: "▧", tone: "purple" },
};

const FALLBACK_SHEETS = [
  { key: "summary", name: "خلاصه پرونده‌ها", description: "یک ردیف برای هر پرونده؛ وضعیت و اطلاعات کلی", group: "base" },
  { key: "personal", name: "مشخصات فردی", description: "اطلاعات هویتی و پروفایل متقاضی", group: "base" },
  { key: "contacts", name: "راه‌های تماس", description: "هر شماره، ایمیل یا راه ارتباطی در یک ردیف", group: "family" },
  { key: "addresses", name: "نشانی‌ها", description: "هر نشانی ثبت‌شده یا فعلی در یک ردیف", group: "family" },
  { key: "marriages", name: "سوابق ازدواج", description: "سوابق ازدواج، طلاق و جزئیات همسر", group: "family" },
  { key: "related_people", name: "اشخاص مرتبط", description: "اعضای خانواده، بستگان و سایر اشخاص", group: "family" },
  { key: "education", name: "سوابق تحصیلی", description: "هر سابقه تحصیلی در یک ردیف مستقل", group: "history" },
  { key: "employment", name: "سوابق شغلی", description: "هر سابقه شغلی در یک ردیف مستقل", group: "history" },
  { key: "military_service", name: "خدمت سربازی", description: "سوابق خدمت، معافیت و اعزام", group: "history" },
  { key: "travel", name: "سوابق سفر", description: "هر سفر و مقصد در یک ردیف مستقل", group: "travel" },
  { key: "passports", name: "گذرنامه‌ها", description: "اطلاعات هر گذرنامه به‌صورت مستقل", group: "travel" },
  { key: "residence", name: "اقامت و مهاجرت", description: "سوابق اقامت، مهاجرت و محل سکونت", group: "travel" },
  { key: "screening_records", name: "سوابق گزینشی", description: "اطلاعات مراحل بررسی و گزینش", group: "additional" },
  { key: "legal_records", name: "سوابق حقوقی و قضایی", description: "سوابق حقوقی، قضایی و محدودیت‌ها", group: "additional" },
  { key: "other_records", name: "سایر سوابق", description: "سوابقی که در دسته‌های اختصاصی قرار نمی‌گیرند", group: "additional" },
  { key: "documents", name: "مدارک و مستندات", description: "فهرست مدارک، وضعیت و زمان ثبت آن‌ها", group: "additional" },
];

const numberFormat = new Intl.NumberFormat("fa-IR");

function normalizeSheet(sheet) {
  const presentation = SHEET_PRESENTATION[sheet.key] || {};
  return {
    ...presentation,
    ...sheet,
    title: sheet.name || sheet.title || sheet.key,
    group: GROUPS.some((group) => group.key === sheet.group) ? sheet.group : "additional",
  };
}

function ExcelExportModal({
  scopeLabel,
  requestCount,
  loading = false,
  onClose,
  onExport,
}) {
  const [sheets, setSheets] = useState(() => FALLBACK_SHEETS.map(normalizeSheet));
  const [selectedSheets, setSelectedSheets] = useState(() => new Set());

  useEffect(() => {
    let active = true;
    api.staffExcelExportSheets()
      .then((result) => {
        const catalog = Array.isArray(result?.sheets) ? result.sheets : [];
        if (active && catalog.length) setSheets(catalog.map(normalizeSheet));
      })
      .catch(() => {
        // Keep the local catalog as a resilient fallback when the API is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedCount = selectedSheets.size;
  const allSelected = sheets.length > 0 && selectedCount === sheets.length;
  const groupedSheets = GROUPS.map((group) => ({
    ...group,
    sheets: sheets.filter((sheet) => sheet.group === group.key),
  })).filter((group) => group.sheets.length > 0);

  const toggleSheet = (key, checked) => {
    setSelectedSheets((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleGroup = (groupSheets) => {
    setSelectedSheets((current) => {
      const next = new Set(current);
      const groupKeys = groupSheets.map((sheet) => sheet.key);
      const groupFullySelected = groupKeys.every((key) => next.has(key));
      groupKeys.forEach((key) => {
        if (groupFullySelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedSheets(
      allSelected ? new Set() : new Set(sheets.map((sheet) => sheet.key)),
    );
  };

  const submit = () => {
    if (loading || selectedCount === 0) return;
    onExport(sheets
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
            <p>شیت‌های موردنیازتان را انتخاب کنید.</p>
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
            <span>پرونده</span>
          </div>
        </div>

        <div className="excel-export-section-heading">
          <div>
            <h5>محتوای فایل</h5>
            <p>هر دسته در شیت‌های مستقل است؛ ردیف‌های چندتایی از هم جدا هستند.</p>
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

        <div className="excel-export-sheet-groups">
          {groupedSheets.map((group) => {
            const groupFullySelected = group.sheets.every((sheet) => selectedSheets.has(sheet.key));
            const groupSelectedCount = group.sheets.filter((sheet) => selectedSheets.has(sheet.key)).length;
            return (
              <section className="excel-export-sheet-group" key={group.key}>
                <div className="excel-export-group-heading">
                  <div>
                    <h6>{group.title}</h6>
                    <p>{group.description}</p>
                  </div>
                  <button
                    type="button"
                    className="excel-export-group-toggle"
                    onClick={() => toggleGroup(group.sheets)}
                    disabled={loading}
                  >
                    {groupFullySelected ? "لغو انتخاب گروه" : "انتخاب گروه"}
                    <span>{numberFormat.format(groupSelectedCount)}/{numberFormat.format(group.sheets.length)}</span>
                  </button>
                </div>
                <div className="excel-export-sheet-grid">
                  {group.sheets.map((sheet) => {
                    const checked = selectedSheets.has(sheet.key);
                    const index = sheets.findIndex((item) => item.key === sheet.key);
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
              </section>
            );
          })}
        </div>

        <div className="excel-export-footer">
          <div className="excel-export-selected-count" aria-live="polite">
            <span className="excel-export-count-dot" />
            <strong>{numberFormat.format(selectedCount)} شیت</strong>
            <span>انتخاب شده از {numberFormat.format(sheets.length)}</span>
            {selectedCount === 0 && <small className="excel-export-selection-hint">برای ساخت فایل، حداقل یک شیت انتخاب کنید.</small>}
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
