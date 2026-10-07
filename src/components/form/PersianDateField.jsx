import { useEffect, useMemo, useRef, useState } from "react";
import { getJalaliDateParts, jalaliMonthLength, jalaliToGregorianString, parseJalali, todayJalali, toEnglishDigits, fromEnglishDigits } from "../../utils/date";
import FieldError from "./FieldError";

const MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function monthOffset(year, month, delta) {
  const index = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

function firstWeekday(year, month) {
  const gregorian = jalaliToGregorianString(`${year}/${String(month).padStart(2, "0")}/01`);
  const [gy, gm, gd] = gregorian.split("-").map(Number);
  const sundayBased = new Date(gy, gm - 1, gd).getDay();
  return (sundayBased + 1) % 7;
}

function PersianDateField({ label, value, onChange, required, readOnly, error }) {
  const rootRef = useRef(null);
  const initial = getJalaliDateParts(value);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [view, setView] = useState({ year: initial.year, month: initial.month });

  useEffect(() => {
    setDraft(value || "");
    const parts = getJalaliDateParts(value);
    setView({ year: parts.year, month: parts.month });
  }, [value]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const days = useMemo(() => {
    const total = jalaliMonthLength(view.year, view.month);
    const leading = firstWeekday(view.year, view.month);
    return Array.from({ length: leading + total }, (_, index) => {
      if (index < leading) return null;
      return index - leading + 1;
    });
  }, [view]);

  const emit = (jalali) => {
    const normalized = toEnglishDigits(jalali).replace(/-/g, "/");
    setDraft(normalized);
    onChange(normalized);
    setOpen(false);
  };

  const chooseDay = (day) => {
    const jalali = `${view.year}/${String(view.month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
    emit(jalali);
  };

  const moveMonth = (delta) => setView((current) => monthOffset(current.year, current.month, delta));

  const onInputChange = (event) => {
    const next = event.target.value.replace(/[^0-9۰-۹٠-٩/.-]/g, "");
    setDraft(next);
    const parsed = parseJalali(next);
    if (parsed) {
      const normalized = `${parsed.year}/${String(parsed.month).padStart(2, "0")}/${String(parsed.day).padStart(2, "0")}`;
      onChange(normalized);
      setView({ year: parsed.year, month: parsed.month });
    } else if (!next) {
      onChange("");
    }
  };

  const clear = () => emit("");
  const goToday = () => emit(todayJalali());

  return (
    <div className={"field date-field " + (error ? "has-error" : "")} ref={rootRef}>
      <span>{label}{required && <em>*</em>}</span>
      <div className="date-input-wrap">
        <input
          type="text"
          inputMode="numeric"
          value={fromEnglishDigits(draft)}
          onFocus={() => !readOnly && setOpen(true)}
          onChange={onInputChange}
          onBlur={() => {
            if (draft && !parseJalali(draft)) setDraft(value || "");
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && parseJalali(draft)) setOpen(false);
          }}
          placeholder="۱۴۰۵/۰۷/۱۵"
          readOnly={readOnly}
          required={required && !readOnly}
          aria-invalid={error ? "true" : undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
        />
        {!readOnly && (
          <button type="button" className="date-trigger" onClick={() => setOpen((current) => !current)} aria-label="باز کردن تقویم">
            ◫
          </button>
        )}
      </div>
      {open && !readOnly && (
        <div className="persian-calendar" role="dialog" aria-label="تقویم شمسی">
          <div className="calendar-head">
            <button type="button" className="calendar-nav" onClick={() => moveMonth(-1)} aria-label="ماه قبل">‹</button>
            <strong>{MONTHS[view.month - 1]} {fromEnglishDigits(view.year)}</strong>
            <button type="button" className="calendar-nav" onClick={() => moveMonth(1)} aria-label="ماه بعد">›</button>
          </div>
          <div className="calendar-grid calendar-weekdays">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid">
            {days.map((day, index) => (
              day === null
                ? <span key={`empty-${index}`} />
                : <button
                    type="button"
                    key={day}
                    className={`calendar-day ${draft === `${view.year}/${String(view.month).padStart(2, "0")}/${String(day).padStart(2, "0")}` ? "selected" : ""}`}
                    onClick={() => chooseDay(day)}
                  >
                    {fromEnglishDigits(day)}
                  </button>
            ))}
          </div>
          <div className="calendar-footer">
            <button type="button" className="text-button" onClick={goToday}>امروز</button>
            {draft && <button type="button" className="text-button danger-text" onClick={clear}>پاک کردن</button>}
            <span>تقویم رسمی شمسی</span>
          </div>
        </div>
      )}
      <FieldError error={error} />
    </div>
  );
}

export default PersianDateField;
