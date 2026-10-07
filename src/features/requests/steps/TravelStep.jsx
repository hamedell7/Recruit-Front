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

const TRANSPORT_OPTIONS = [
  { value: "air", label: "هوایی" },
  { value: "land", label: "زمینی" },
  { value: "sea", label: "دریایی" },
];

const STAY_OPTIONS = [
  { value: "permanent", label: "دائم" },
  { value: "temporary", label: "موقت" },
];

const EXIT_BORDER_OPTIONS = [
  "فرودگاه بین‌المللی امام خمینی",
  "فرودگاه شهید هاشمی‌نژاد مشهد",
  "فرودگاه شهید دستغیب شیراز",
  "فرودگاه شهید مدنی تبریز",
  "مرز بازرگان",
  "مرز رازی",
  "مرز سرو",
  "مرز تمرچین",
  "مرز باشماق",
  "مرز آستارا",
  "مرز بیله‌سوار",
  "مرز شلمچه",
  "مرز چذابه",
  "مرز دریایی بندرعباس",
  "سایر",
];

const emptyTravel = () => ({
  beneficiary_type: "APPLICANT",
  relative_relation: "",
  relative_first_name: "",
  relative_last_name: "",
  country_name: "",
  travel_type: "",
  start_date: "",
  end_date: "",
  duration: "",
  exit_border: "",
  passport_number: "",
  reason: "",
  transport_type: "",
  stay_type: "",
  stay_place: "",
});

function TravelStep({ form, setForm, readOnly, errors, clearValidationError }) {
  const records = normalizeList(form?.records);

  return (
    <div className="form-stack">
      <FormSection
        title="سفر و اقامت خارج از کشور"
        hint="هر سفر یا اقامت را جداگانه ثبت کنید. کشور به‌صورت متن آزاد وارد می‌شود."
      >
        <ListEditor
          title="سفر / اقامت"
          hint="اطلاعات شخص، کشور، تاریخ، مدت، مرز خروجی و جزئیات سفر یا اقامت را ثبت کنید."
          items={records}
          setItems={(items) => setForm({ records: items })}
          empty={emptyTravel}
          addLabel="افزودن سفر یا اقامت"
          readOnly={readOnly}
          clearValidationError={clearValidationError}
          errorPrefix="records"
          render={(record, setRecord, index) => {
            const prefix = "records." + index;
            const isRelative = record?.beneficiary_type === "RELATIVE";

            const update = (key, value) => {
              clearValidationError(prefix + "." + key);
              setRecord({ ...record, [key]: value });
            };

            const beneficiaryLabel = {
              APPLICANT: "خود متقاضی",
              SPOUSE: "همسر",
              RELATIVE: "یکی از بستگان",
            }[record?.beneficiary_type] || "سفر / اقامت";

            const subjectName = isRelative
              ? [record?.relative_first_name, record?.relative_last_name].filter(Boolean).join(" ")
              : beneficiaryLabel;

            return (
              <div className="record-card">
                <div className="record-head">
                  <span>ردیف {index + 1}</span>
                  <strong>{subjectName || "سفر / اقامت"}</strong>
                </div>

                <div className="field-grid">
                  <SelectField
                    label="این سابقه مربوط به"
                    value={record?.beneficiary_type || "APPLICANT"}
                    onChange={(value) => {
                      clearValidationError(prefix + ".beneficiary_type");
                      if (value === "RELATIVE") {
                        setRecord({ ...record, beneficiary_type: value });
                      } else {
                        setRecord({
                          ...record,
                          beneficiary_type: value,
                          relative_relation: "",
                          relative_first_name: "",
                          relative_last_name: "",
                        });
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
                        label="نام شخص"
                        value={record?.relative_first_name || ""}
                        onChange={(value) => update("relative_first_name", value)}
                        error={getFieldError(errors, prefix + ".relative_first_name")}
                        required
                        readOnly={readOnly}
                      />
                      <TextField
                        label="نام خانوادگی شخص"
                        value={record?.relative_last_name || ""}
                        onChange={(value) => update("relative_last_name", value)}
                        error={getFieldError(errors, prefix + ".relative_last_name")}
                        required
                        readOnly={readOnly}
                      />
                    </>
                  )}

                  <TextField
                    label="کشور خارجی"
                    value={record?.country_name || ""}
                    onChange={(value) => update("country_name", value)}
                    error={getFieldError(errors, prefix + ".country_name")}
                    required
                    readOnly={readOnly}
                  />
                  <TextField
                    label="نوع مسافرت / اقامت"
                    value={record?.travel_type || ""}
                    onChange={(value) => update("travel_type", value)}
                    error={getFieldError(errors, prefix + ".travel_type")}
                    required
                    readOnly={readOnly}
                  />
                  <TextField
                    label="تاریخ شروع"
                    type="date"
                    value={record?.start_date || ""}
                    onChange={(value) => update("start_date", value)}
                    error={getFieldError(errors, prefix + ".start_date")}
                    readOnly={readOnly}
                  />
                  <TextField
                    label="تاریخ پایان"
                    type="date"
                    value={record?.end_date || ""}
                    onChange={(value) => update("end_date", value)}
                    error={getFieldError(errors, prefix + ".end_date")}
                    readOnly={readOnly}
                  />
                  <TextField
                    label="مدت مسافرت / اقامت"
                    value={record?.duration || ""}
                    onChange={(value) => update("duration", value)}
                    error={getFieldError(errors, prefix + ".duration")}
                    readOnly={readOnly}
                  />
                  <SelectField
                    label="مرز خروجی"
                    value={record?.exit_border || ""}
                    onChange={(value) => update("exit_border", value)}
                    options={EXIT_BORDER_OPTIONS}
                    error={getFieldError(errors, prefix + ".exit_border")}
                    readOnly={readOnly}
                  />
                  <TextField
                    label="شماره گذرنامه"
                    value={record?.passport_number || ""}
                    onChange={(value) => update("passport_number", value)}
                    error={getFieldError(errors, prefix + ".passport_number")}
                    readOnly={readOnly}
                  />
                  <SelectField
                    label="نحوه سفر"
                    value={record?.transport_type || ""}
                    onChange={(value) => update("transport_type", value)}
                    options={TRANSPORT_OPTIONS}
                    error={getFieldError(errors, prefix + ".transport_type")}
                    readOnly={readOnly}
                  />
                  <SelectField
                    label="نوع اقامت"
                    value={record?.stay_type || ""}
                    onChange={(value) => update("stay_type", value)}
                    options={STAY_OPTIONS}
                    error={getFieldError(errors, prefix + ".stay_type")}
                    readOnly={readOnly}
                  />
                  <TextArea
                    label="علت مسافرت / اقامت"
                    value={record?.reason || ""}
                    onChange={(value) => update("reason", value)}
                    error={getFieldError(errors, prefix + ".reason")}
                    readOnly={readOnly}
                    full
                  />
                  <TextArea
                    label="محل اقامت"
                    value={record?.stay_place || ""}
                    onChange={(value) => update("stay_place", value)}
                    error={getFieldError(errors, prefix + ".stay_place")}
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

export default TravelStep;
