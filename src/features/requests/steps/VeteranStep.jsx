import { normalizeList } from "../../../utils/collections";
import { getFieldError } from "../../../utils/validation";
import TextField, { TextArea, SelectField } from "../../../components/form/Fields";
import FormSection from "../../../components/form/FormSection";
import ListEditor from "../../../components/form/ListEditor";

const BENEFICIARY_OPTIONS = [
  { value: "APPLICANT", label: "خود متقاضی" },
  { value: "SPOUSE", label: "همسر" },
  { value: "RELATIVE", label: "یکی از بستگان" },
];

const RELATION_OPTIONS = [
  "پدر",
  "مادر",
  "همسر",
  "فرزند",
  "برادر",
  "خواهر",
  "پدربزرگ",
  "مادربزرگ",
  "نوه",
  "عمو",
  "عمه",
  "دایی",
  "خاله",
  "سایر",
];

const emptyVeteran = () => ({
  beneficiary_type: "APPLICANT",
  relative_relation: "",
  relative_first_name: "",
  relative_last_name: "",
  veteran_type: "",
  percentage: "",
  occurrence_date: "",
  location: "",
  issuing_authority: "",
  duration: "",
  notes: "",
});

function VeteranStep({ form, setForm, readOnly, errors, clearValidationError }) {
  const records = normalizeList(form?.records);

  return (
    <div className="form-stack">
      <FormSection
        title="سوابق ایثارگری"
        hint="سوابق ایثارگری می‌تواند مربوط به خود متقاضی یا یکی از بستگان او باشد."
      >
        <ListEditor
          title="سابقه ایثارگری"
          hint="هر سابقه را جداگانه ثبت کنید. در صورت نداشتن سابقه، این بخش را خالی بگذارید."
          items={records}
          setItems={(items) => setForm({ records: items })}
          empty={emptyVeteran}
          addLabel="افزودن سابقه ایثارگری"
          readOnly={readOnly}
          clearValidationError={clearValidationError}
          errorPrefix="records"
          render={(record, setRecord, index) => {
            const prefix = "records." + index;
            const update = (key, value) => {
              clearValidationError(prefix + "." + key);
              setRecord({ ...record, [key]: value });
            };

            const isRelative = record?.beneficiary_type === "RELATIVE";
            const beneficiaryLabel = {
              APPLICANT: "خود متقاضی",
              SPOUSE: "همسر",
              RELATIVE: "یکی از بستگان",
            }[record?.beneficiary_type] || "سابقه ایثارگری";
            const personName =
              isRelative && (record?.relative_first_name || record?.relative_last_name)
                ? [record.relative_first_name, record.relative_last_name].filter(Boolean).join(" ")
                : beneficiaryLabel;

            return (
              <div className="record-card">
                <div className="record-head">
                  <span>ردیف {index + 1}</span>
                  <strong>{personName || "سابقه ایثارگری"}</strong>
                </div>

                <div className="field-grid">
                  <SelectField
                    label="این سابقه مربوط به"
                    value={record?.beneficiary_type || "APPLICANT"}
                    onChange={(value) => {
                      clearValidationError(prefix + ".beneficiary_type");
                      if (value !== "RELATIVE") {
                        setRecord({
                          ...record,
                          beneficiary_type: value,
                          relative_relation: "",
                          relative_first_name: "",
                          relative_last_name: "",
                        });
                      } else {
                        setRecord({ ...record, beneficiary_type: value });
                      }
                    }}
                    options={BENEFICIARY_OPTIONS}
                    error={getFieldError(errors, prefix + ".beneficiary_type")}
                    required
                    readOnly={readOnly}
                  />

                  {isRelative && (
                    <>
                      <SelectField
                        label="نسبت با متقاضی"
                        value={record?.relative_relation || ""}
                        onChange={(value) => update("relative_relation", value)}
                        options={RELATION_OPTIONS}
                        error={getFieldError(errors, prefix + ".relative_relation")}
                        required
                        readOnly={readOnly}
                      />
                      <TextField
                        label="نام شخص ایثارگر"
                        value={record?.relative_first_name || ""}
                        onChange={(value) => update("relative_first_name", value)}
                        error={getFieldError(errors, prefix + ".relative_first_name")}
                        required
                        readOnly={readOnly}
                      />
                      <TextField
                        label="نام خانوادگی شخص ایثارگر"
                        value={record?.relative_last_name || ""}
                        onChange={(value) => update("relative_last_name", value)}
                        error={getFieldError(errors, prefix + ".relative_last_name")}
                        required
                        readOnly={readOnly}
                      />
                    </>
                  )}

                  <SelectField
                    label="نوع ایثارگری"
                    value={record?.veteran_type || ""}
                    onChange={(value) => update("veteran_type", value)}
                    options={["رزمندگی", "جانبازی", "آزادگی", "شهادت"]}
                    error={getFieldError(errors, prefix + ".veteran_type")}
                    required
                    readOnly={readOnly}
                  />
                  <TextField
                    label="درصد ایثارگری"
                    type="number"
                    value={record?.percentage ?? ""}
                    onChange={(value) => update("percentage", value)}
                    error={getFieldError(errors, prefix + ".percentage")}
                    readOnly={readOnly}
                  />
                  <TextField
                    label="تاریخ وقوع / اعزام"
                    type="date"
                    value={record?.occurrence_date || ""}
                    onChange={(value) => update("occurrence_date", value)}
                    error={getFieldError(errors, prefix + ".occurrence_date")}
                    readOnly={readOnly}
                  />
                  <TextField
                    label="محل وقوع / اعزام"
                    value={record?.location || ""}
                    onChange={(value) => update("location", value)}
                    error={getFieldError(errors, prefix + ".location")}
                    readOnly={readOnly}
                  />
                  <TextField
                    label="اعزام‌کننده / مرجع"
                    value={record?.issuing_authority || ""}
                    onChange={(value) => update("issuing_authority", value)}
                    error={getFieldError(errors, prefix + ".issuing_authority")}
                    readOnly={readOnly}
                  />
                  <TextField
                    label="مدت ایثارگری"
                    value={record?.duration || ""}
                    onChange={(value) => update("duration", value)}
                    error={getFieldError(errors, prefix + ".duration")}
                    readOnly={readOnly}
                  />
                  <TextArea
                    label="توضیحات"
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

export default VeteranStep;