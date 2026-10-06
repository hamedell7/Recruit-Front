import FieldError from "./FieldError";\n\nfunction TextField({ label, value, onChange, type = "text", required, readOnly, inputMode, error }) {
  return (
    <label className={"field " + (error ? "has-error" : "")}>
      <span>{label}{required && <em>*</em>}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={required && !readOnly}
        readOnly={readOnly}
        inputMode={inputMode}
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
          return <option key={String(normalized.value)} value={normalized.value}>{normalized.label}</option>;
        })}
      </select>
      <FieldError error={error} />
    </label>
  );
}

\n\nexport default TextField;\n