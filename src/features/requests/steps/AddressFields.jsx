import { getFieldError } from "../../../utils/validation";
import TextField, { TextArea, SelectField } from "../../../components/form/Fields";

function AddressFields({ item, setItem, countries, readOnly, residence, family = false, errors, errorPrefix = "", clearValidationError }) {
  const fieldPath = (key) => errorPrefix ? `${errorPrefix}.${key}` : key;
  const update = (key, value) => {
    clearValidationError?.(fieldPath(key));
    setItem({ ...item, [key]: value });
  };
  return (
    <div className="field-grid">
      <SelectField label="نوع نشانی" value={item.address_type} onChange={(v) => update("address_type", v)} error={getFieldError(errors, fieldPath("address_type"))} options={residence ? ["RESIDENCE", "PREVIOUS_RESIDENCE"] : family ? [{ value: "CURRENT", label: "نشانی منزل" }, { value: "WORK", label: "نشانی محل کار" }] : ["CURRENT", "FAMILY", "WORK"]} readOnly={readOnly} />
      <SelectField label="کشور" value={item.country_id} onChange={(v) => update("country_id", v)} error={getFieldError(errors, fieldPath("country_id"))} options={countries.map((c) => ({ value: c.id, label: c.name }))} readOnly={readOnly} />
      <TextField label="تلفن" value={item.phone} onChange={(v) => update("phone", v)} error={getFieldError(errors, fieldPath("phone"))} readOnly={readOnly} />
      <TextArea label="آدرس دقیق" value={item.address_line} onChange={(v) => update("address_line", v)} error={getFieldError(errors, fieldPath("address_line"))} full readOnly={readOnly} />
    </div>
  );
}

export default AddressFields;
