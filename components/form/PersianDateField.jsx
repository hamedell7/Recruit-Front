import { useMemo } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { getJalaliDateParts } from "../../utils/date";
import FieldError from "./FieldError";

function PersianDateField({ label, value, onChange, required, readOnly, error }) {
  const pickerValue = useMemo(() => {
    if (!value) return "";
    const parts = getJalaliDateParts(value);
    return parts
      ? `${parts.year}/${String(parts.month).padStart(2, "0")}/${String(parts.day).padStart(2, "0")}`
      : "";
  }, [value]);

  const handleChange = (date) => {
    if (!date) {
      onChange("");
      return;
    }

    const normalized = date.format("YYYY/MM/DD");
    onChange(normalized);
  };

  return (
    <div className={"field date-field " + (error ? "has-error" : "")}>
      <span>{label}{required && <em>*</em>}</span>
      <div className="date-picker-control" dir="rtl">
        <DatePicker
          value={pickerValue}
          onChange={handleChange}
          calendar={persian}
          locale={persian_fa}
          format="YYYY/MM/DD"
          calendarPosition="bottom-right"
          placeholder="۱۴۰۵/۰۷/۱۵"
          inputClass="recruit-date-input"
          containerClassName="recruit-date-picker"
          monthYearSeparator=" "
          headerOrder={["RIGHT_BUTTON", "MONTH_YEAR", "LEFT_BUTTON"]}
          highlightToday
          editable={!readOnly}
          readOnly={readOnly}
          disabled={readOnly}
          buttons
          shadow
        />
      </div>
      <FieldError error={error} />
    </div>
  );
}

export default PersianDateField;
