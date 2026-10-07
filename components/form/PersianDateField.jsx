import DatePicker from "@jalali-js/react/DatePicker";
import "@jalali-js/react/date-picker.css";
import FieldError from "./FieldError";

function PersianDateField({ label, value, onChange, required, readOnly, error }) {
  const handleChange = (nextValue) => {
    onChange(nextValue || "");
  };

  return (
    <div className={"field date-field " + (error ? "has-error" : "")}>
      <span>{label}{required && <em>*</em>}</span>
      <DatePicker
        system="jalali"
        locale="fa"
        valueFormat="gregorian-iso"
        value={value || ""}
        onChange={handleChange}
        placeholder="انتخاب تاریخ"
        quickNav
        defaultDate={null}
        readOnly={readOnly}
        className="recruit-jalali-picker"
      />
      <FieldError error={error} />
    </div>
  );
}

export default PersianDateField;
