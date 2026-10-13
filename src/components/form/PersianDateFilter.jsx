import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { gregorianToJalaliString, jalaliToGregorianString } from "../../utils/date";

function toJalaliPickerValue(value) {
  if (!value) return "";
  const jalali = gregorianToJalaliString(value);
  return jalali && jalali !== value ? jalali.replace(/-/g, "/") : "";
}

function PersianDateFilter({ label, value, onChange, minDate, maxDate }) {
  const handleChange = (date) => {
    if (!date) {
      onChange("");
      return;
    }

    const jalaliValue = date.format("YYYY/MM/DD");
    onChange(jalaliToGregorianString(jalaliValue) || "");
  };

  return (
    <label className="staff-filter-field">
      <span>{label}</span>
      <div className="staff-date-picker-wrap" dir="rtl">
        <DatePicker
          value={toJalaliPickerValue(value)}
          onChange={handleChange}
          calendar={persian}
          locale={persian_fa}
          format="YYYY/MM/DD"
          calendarPosition="bottom-right"
          placeholder="۱۴۰۵/۰۷/۲۱"
          inputClass="staff-date-picker-input"
          containerClassName="staff-date-picker-container"
          monthYearSeparator=" "
          headerOrder={["RIGHT_BUTTON", "MONTH_YEAR", "LEFT_BUTTON"]}
          highlightToday
          editable={false}
          minDate={toJalaliPickerValue(minDate) || undefined}
          maxDate={toJalaliPickerValue(maxDate) || undefined}
          buttons
          shadow
        />
        {value && (
          <button
            className="staff-date-clear-button"
            type="button"
            aria-label={`حذف فیلتر ${label}`}
            title="حذف تاریخ انتخاب‌شده"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onChange("");
            }}
          >
            ×
          </button>
        )}
      </div>
    </label>
  );
}

export default PersianDateFilter;
