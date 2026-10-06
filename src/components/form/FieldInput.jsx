import TextField, { TextArea, SelectField } from "./Fields";

function FieldInput({ field, value, onChange, countries, readOnly, record, error }) {
  if (field.visibleWhen && !field.visibleWhen(record || {})) return null;
  if (field.type === "country") {
    return <SelectField label={field.label} value={value} onChange={onChange} error={error} options={countries.map((c) => ({ value: c.id, label: c.name }))} required={field.required} readOnly={readOnly} />;
  }
  if (field.type === "select") return <SelectField label={field.label} value={value} onChange={onChange} error={error} options={field.options || []} required={field.required} readOnly={readOnly} />;
  if (field.type === "textarea") return <TextArea label={field.label} value={value} onChange={onChange} error={error} required={field.required} full={field.full} readOnly={readOnly} />;
  if (field.type === "boolean") {
    const selected = value === true ? "true" : value === false ? "false" : "";
    return <SelectField label={field.label} value={selected} error={error} onChange={(v) => onChange(v === "" ? null : v === "true")} options={[{ value: "", label: "مشخص نشده" }, { value: "true", label: "بله" }, { value: "false", label: "خیر" }]} readOnly={readOnly} />;
  }
  return <TextField label={field.label} type={field.type} value={value} onChange={onChange} error={error} required={field.required} readOnly={readOnly} />;
}

export default FieldInput;
