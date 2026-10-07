import { SelectField } from "../../../components/form/Fields";
import TextField, { TextArea } from "../../../components/form/Fields";
import FormSection from "../../../components/form/FormSection";
import ListEditor from "../../../components/form/ListEditor";
import GeoFields from "../../../components/form/GeoFields";
import { getFieldError } from "../../../utils/validation";
import { normalizeList } from "../../../utils/collections";

const PASSPORT_TYPES = [
  { value: "ordinary", label: "عادی" },
  { value: "service", label: "خدمت" },
  { value: "diplomatic", label: "سیاسی" },
  { value: "other", label: "سایر" },
];

const PERSON_TYPES = [
  { value: "APPLICANT", label: "متقاضی" },
  { value: "SPOUSE", label: "همسر" },
];

const emptyPassport = () => ({
  person_role: "APPLICANT",
  passport_type: "",
  passport_number: "",
  issue_date: "",
  expiry_date: "",
  issue_country_id: "",
  issue_province_id: "",
  issue_city_id: "",
  notes: "",
});

function PassportStep({ form, setForm, countries, readOnly, errors, clearValidationError }) {
  const records = normalizeList(form?.records);

  return (
    <div className="form-stack">
      <FormSection title="سوابق گذرنامه" hint="برای هر گذرنامه یک رکورد مستقل ثبت کنید.">
        <ListEditor
          title="گذرنامه"
          hint="نوع، شماره، تاریخ‌ها، محل دریافت و ملاحظات را ثبت کنید."
          items={records}
          setItems={(items) => setForm({ records: items })}
          empty={emptyPassport}
          addLabel="افزودن گذرنامه"
          readOnly={readOnly}
          clearValidationError={clearValidationError}
          errorPrefix="records"
          render={(record, setRecord, index) => {
            const prefix = "records." + index;
            const update = (key, value) => {
              clearValidationError(prefix + "." + key);
              setRecord({ ...record, [key]: value });
            };

            const typeLabel =
              PASSPORT_TYPES.find((item) => item.value === record?.passport_type)?.label || "گذرنامه";

            return (
              <div className="record-card">
                <div className="record-head">
                  <span>ردیف {index + 1}</span>
                  <strong>{typeLabel}</strong>
                </div>

                <div className="field-grid">
                  <SelectField
                    label="برای"
                    value={record?.person_role || "APPLICANT"}
                    onChange={(value) => update("person_role", value)}
                    options={PERSON_TYPES}
                    error={getFieldError(errors, prefix + ".person_role")}
                    readOnly={readOnly}
                  />

                  <SelectField
                    label="نوع گذرنامه"
                    value={record?.passport_type || ""}
                    onChange={(value) => update("passport_type", value)}
                    options={PASSPORT_TYPES}
                    error={getFieldError(errors, prefix + ".passport_type")}
                    required
                    readOnly={readOnly}
                  />

                  <TextField
                    label="شماره گذرنامه"
                    value={record?.passport_number || ""}
                    onChange={(value) => update("passport_number", value)}
                    error={getFieldError(errors, prefix + ".passport_number")}
                    required
                    readOnly={readOnly}
                  />

                  <TextField
                    label="تاریخ صدور"
                    type="date"
                    value={record?.issue_date || ""}
                    onChange={(value) => update("issue_date", value)}
                    error={getFieldError(errors, prefix + ".issue_date")}
                    readOnly={readOnly}
                  />

                  <TextField
                    label="مدت اعتبار"
                    type="date"
                    value={record?.expiry_date || ""}
                    onChange={(value) => update("expiry_date", value)}
                    error={getFieldError(errors, prefix + ".expiry_date")}
                    readOnly={readOnly}
                  />

                  <GeoFields
                    record={record}
                    setRecord={setRecord}
                    countries={countries}
                    readOnly={readOnly}
                    prefix="issue_"
                    errors={errors}
                    errorPrefix={prefix}
                    clearValidationError={clearValidationError}
                    caption="محل دریافت"
                    hint="کشور، استان و شهر محل دریافت را انتخاب کنید."
                  />

                  <TextArea
                    label="ملاحظات"
                    value={record?.notes || ""}
                    onChange={(value) => update("notes", value)}
                    error={getFieldError(errors, prefix + ".notes")}
                    readOnly={readOnly}
                    full
                  />
                </div>
              </div>
            );
          }}
        />
      </FormSection>
    </div>
  );
}

export default PassportStep;
