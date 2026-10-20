import FieldError from "./FieldError";
import PersianDateField from "./PersianDateField";

function normalizeDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
}

function sanitizeNumericValue(value, decimal = false) {
  const pattern = decimal ? /[^0-9.]/g : /[^0-9]/g;
  const normalized = normalizeDigits(value).replace(pattern, "");
  if (!decimal) return normalized;
  const [integer, ...fraction] = normalized.split(".");
  return fraction.length ? integer + "." + fraction.join("") : integer;
}

function TextField({
  label, value, onChange, type = "text", required, readOnly, inputMode, error,
  maxLength, placeholder, min, max, step,
}) {
  const isPhone = type === "phone";
  const isDigits = type === "digits";
  const isNumeric = type === "number";
  const inputType = isPhone || isDigits || isNumeric ? "text" : type;
  const effectiveInputMode = inputMode || (isNumeric ? "decimal" : (isPhone || isDigits ? "numeric" : undefined));
  const effectiveMaxLength = maxLength ?? (isPhone ? 11 : undefined);
  const effectivePlaceholder = placeholder ?? (isPhone ? "02112345678" : undefined);
  if (type === "date") {
    return <PersianDateField label={label} value={value} onChange={onChange} error={error} required={required} readOnly={readOnly} />;
  }

  return (
    <label className={"field " + (error ? "has-error" : "")}>
      <span>{label}{required && <em>*</em>}</span>
      <input
        type={inputType}
        value={value ?? ""}
        onChange={(e) => {
          const nextValue = isNumeric
            ? sanitizeNumericValue(e.target.value, true)
            : (isPhone || isDigits ? sanitizeNumericValue(e.target.value) : e.target.value);
          onChange(effectiveMaxLength ? nextValue.slice(0, effectiveMaxLength) : nextValue);
        }}
        required={required && !readOnly}
        readOnly={readOnly}
        inputMode={effectiveInputMode}
        maxLength={effectiveMaxLength}
        placeholder={effectivePlaceholder}
        min={min}
        max={max}
        step={step}
        aria-invalid={error ? "true" : undefined}
      />
      <FieldError error={error} />
    </label>
  );
}

function TextArea({ label, value, onChange, required, full, readOnly, rows = 5, error }) {
  return (
    <label className={"field " + (full ? "full " : "") + (error ? "has-error" : "")}>
      <span>{label}{required && <em>*</em>}</span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={required && !readOnly}
        readOnly={readOnly}
        rows={rows}
        aria-invalid={error ? "true" : undefined}
      />
      <FieldError error={error} />
    </label>
  );
}

function SelectField({ label, value, onChange, options = [], required, readOnly, error }) {
  return (
    <label className={"field " + (error ? "has-error" : "")}>
      <span>{label}{required && <em>*</em>}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={required && !readOnly}
        disabled={readOnly}
        aria-invalid={error ? "true" : undefined}
      >
        <option value="">انتخاب کنید</option>
        {options.map((option) => {
          const normalized = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={String(normalized.value)} value={normalized.value} disabled={Boolean(normalized.disabled)}>{normalized.label}</option>;
        })}
      </select>
      <FieldError error={error} />
    </label>
  );
}



export { TextArea, SelectField };
export default TextField;
