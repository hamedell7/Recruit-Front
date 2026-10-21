import TextField, { TextArea, SelectField } from "./Fields";
import { withSpouseAvailability } from "../../utils/form";

function FieldInput({ field, value, onChange, countries, readOnly, record, error, hasSpouse = false }) {
  const inputField = field.key === "relative_relation" && record?.beneficiary_type === "SPOUSE_RELATIVE"
    ? { ...field, label: "نسبت با همسر" }
    : field;
  if (inputField.visibleWhen && !inputField.visibleWhen(record || {})) return null;
  if (inputField.type === "country") {
    return <SelectField label={inputField.label} value={value} onChange={onChange} error={error} options={countries.map((c) => ({ value: c.id, label: c.name }))} required={inputField.required} readOnly={readOnly} />;
  }
  if (inputField.type === "select") {
    const baseOptions = inputField.options || [];
    const hasCurrentValue = baseOptions.some((option) => (typeof option === "string" ? option : option?.value) === value);
    const options = value && !hasCurrentValue
      ? [...baseOptions, { value, label: String(value) }]
      : baseOptions;
    return <SelectField label={inputField.label} value={value} onChange={onChange} error={error} options={withSpouseAvailability(options, hasSpouse)} required={inputField.required} readOnly={readOnly} />;
  }
  if (inputField.type === "textarea") return <TextArea label={inputField.label} value={value} onChange={onChange} error={error} required={inputField.required} full={inputField.full} readOnly={readOnly} />;
  if (inputField.type === "boolean") {
    const selected = value === true ? "true" : value === false ? "false" : "";
    return <SelectField label={inputField.label} value={selected} error={error} onChange={(v) => onChange(v === "" ? null : v === "true")} options={[{ value: "", label: "مشخص نشده" }, { value: "true", label: "بله" }, { value: "false", label: "خیر" }]} readOnly={readOnly} />;
  }
  return <TextField label={inputField.label} type={inputField.type} value={value} onChange={onChange} error={error} required={inputField.required} readOnly={readOnly} inputMode={inputField.inputMode} maxLength={inputField.maxLength} placeholder={inputField.placeholder} min={inputField.min} max={inputField.max} step={inputField.step} />;
}

export default FieldInput;
