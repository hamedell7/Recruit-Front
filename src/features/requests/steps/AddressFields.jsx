import { getFieldError } from "../../../utils/validation";
import TextField, { TextArea, SelectField } from "../../../components/form/Fields";
import GeoFields from "../../../components/form/GeoFields";

function AddressFields({ item, setItem, countries, readOnly, residence, family = false, simplified = false, errors, errorPrefix = "", clearValidationError }) {
  const simple = family || simplified;
  const fieldPath = (key) => errorPrefix ? `${errorPrefix}.${key}` : key;
  const update = (key, value) => {
    clearValidationError?.(fieldPath(key));
    setItem({ ...item, [key]: value });
  };

  if (residence) {
    return (
      <div className="field-grid">
        <TextField label="تاریخ شروع" type="date" value={item.from_date} onChange={(v) => update("from_date", v)} error={getFieldError(errors, fieldPath("from_date"))} readOnly={readOnly} />
        <TextField label="تاریخ پایان" type="date" value={item.to_date} onChange={(v) => update("to_date", v)} error={getFieldError(errors, fieldPath("to_date"))} readOnly={readOnly} />
        <TextArea label="علت جابه‌جایی" value={item.move_reason} onChange={(v) => update("move_reason", v)} error={getFieldError(errors, fieldPath("move_reason"))} full readOnly={readOnly} />
        <GeoFields
          record={item}
          setRecord={setItem}
          countries={countries}
          readOnly={readOnly}
          errors={errors}
          errorPrefix={errorPrefix}
          clearValidationError={clearValidationError}
          caption="موقعیت جغرافیایی"
          hint="نوع نشانی، کشور، استان، شهر، آدرس دقیق، کد پستی و تلفن را وارد کنید."
          required
          addressTypeOptions={[
            { value: "RESIDENCE", label: "محل سکونت فعلی" },
            { value: "PREVIOUS_RESIDENCE", label: "محل سکونت قبلی" },
          ]}
          includeAddressDetails
        />
      </div>
    );
  }

  return (
    <div className="field-grid">
      <SelectField label="نوع نشانی" value={item.address_type} onChange={(v) => update("address_type", v)} error={getFieldError(errors, fieldPath("address_type"))} options={residence ? ["RESIDENCE", "PREVIOUS_RESIDENCE"] : simple ? [{ value: "CURRENT", label: "نشانی منزل" }, { value: "WORK", label: "نشانی محل کار" }] : ["CURRENT", "FAMILY", "WORK"]} readOnly={readOnly} />
      {!simple && !residence && <SelectField label="کشور" value={item.country_id} onChange={(v) => update("country_id", v)} error={getFieldError(errors, fieldPath("country_id"))} options={countries.map((c) => ({ value: c.id, label: c.name }))} readOnly={readOnly} />}
      {!simple && !residence && <TextField label="کد پستی" value={item.postal_code} onChange={(v) => update("postal_code", v)} error={getFieldError(errors, fieldPath("postal_code"))} readOnly={readOnly} />}
      {!residence && <TextField label="تلفن" value={item.phone} onChange={(v) => update("phone", v)} error={getFieldError(errors, fieldPath("phone"))} readOnly={readOnly} />}
      {!residence && <TextArea label="آدرس دقیق" value={item.address_line} onChange={(v) => update("address_line", v)} error={getFieldError(errors, fieldPath("address_line"))} full readOnly={readOnly} /> }
    </div>
  );
}

export default AddressFields;
