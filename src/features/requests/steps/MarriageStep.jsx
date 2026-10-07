import { getFieldError } from "../../../utils/validation";
import TextField, { TextArea, SelectField } from "../../../components/form/Fields";
import FormSection from "../../../components/form/FormSection";
import ListEditor from "../../../components/form/ListEditor";

const END_REASONS = [
  { value: "divorce", label: "طلاق" },
  { value: "death", label: "فوت همسر" },
  { value: "annulment", label: "فسخ / بطلان" },
  { value: "other", label: "سایر" },
];

const emptyMarriage = () => ({
  id: "",
  status: "current",
  marriage_date: "",
  end_date: "",
  end_reason: "",
  spouse: {
    first_name: "",
    last_name: "",
    father_name: "",
    national_id: "",
    birth_date: "",
    gender: "",
    occupation: "",
    education: "",
    physical_status: "",
    disease_description: "",
  },
  spouse_family_residence_address: "",
});

function ChoiceGroup({ label, required, value, options, name, onChange, readOnly, error }) {
  const updateSpousePhysicalStatus = (index, value) => {
    clearValidationError("marriages." + index + ".spouse.physical_status");
    clearValidationError("marriages." + index + ".spouse.disease_description");
    const marriage = marriages[index];
    updateMarriage(index, {
      ...marriage,
      spouse: {
        ...(marriage?.spouse || {}),
        physical_status: value,
        ...(value === "سالم" ? { disease_description: "" } : {}),
      },
    });
  };

  return (
    <div className={"choice-field " + (error ? "has-error" : "")}>
      <div className="choice-label">{label}{required && <em>*</em>}</div>
      <div className="choice-grid">
        {options.map((option) => (
          <label className={"choice-card " + (value === option.value ? "selected" : "")} key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={readOnly}
            />
            <span className="choice-dot" />
            <span className="choice-copy">{option.label}</span>
          </label>
        ))}
      </div>
      {error && <div className="choice-error">{error}</div>}
    </div>
  );
}

function MarriageStep({ form, setForm, readOnly, errors, clearValidationError }) {
  const marriages = Array.isArray(form?.marriages) ? form.marriages : [];
  const updateMarriage = (index, next) => {
    const nextItems = marriages.map((item, i) => (i === index ? next : item));
    setForm({ marriages: nextItems });
  };

  const updateMarriageStatus = (index, status) => {
    clearValidationError(`marriages.${index}.status`);
    const next = { ...marriages[index], status };
    if (status === "current") {
      next.end_date = "";
      next.end_reason = "";
      clearValidationError(`marriages.${index}.end_date`);
      clearValidationError(`marriages.${index}.end_reason`);
    }
    updateMarriage(index, next);
  };

  const updateSpouse = (index, key, value) => {
    clearValidationError(`marriages.${index}.spouse.${key}`);
    const marriage = marriages[index];
    updateMarriage(index, {
      ...marriage,
      spouse: { ...(marriage?.spouse || {}), [key]: value },
    });
  };

  return (
    <div className="form-stack">
      <ListEditor
        title="سوابق ازدواج"
        hint="هر ازدواج یک رکورد مستقل است. برای ازدواج جاری فقط وضعیت جاری و تاریخ ازدواج را ثبت کنید؛ برای ازدواج پایان‌یافته علت و تاریخ پایان را هم وارد کنید."
        items={marriages}
        setItems={(items) => setForm({ marriages: items })}
        empty={emptyMarriage}
        addLabel="افزودن همسر / سابقه ازدواج"
        readOnly={readOnly}
        clearValidationError={clearValidationError}
        errorPrefix="marriages"
        render={(marriage, _, index) => {
          const prefix = `marriages.${index}`;
          const spouse = marriage?.spouse || {};
          const isCurrent = marriage?.status === "current";

          const currentNumber = isCurrent
            ? marriages.slice(0, index + 1).filter((item) => item?.status === "current").length
            : null;
          const endedNumber = !isCurrent
            ? marriages.slice(0, index + 1).filter((item) => item?.status === "ended").length
            : null;

          return (
            <div className="record-card marriage-card">
              <div className="record-head">
                <span>{isCurrent ? `همسر فعلی ${currentNumber}` : `سابقه ازدواج ${endedNumber}`}</span>
                <strong>{isCurrent ? "جاری" : "پایان‌یافته"}</strong>
              </div>

              <div className="field-grid">
                <ChoiceGroup
                  label="وضعیت این ازدواج"
                  required
                  name={`marriage-status-${index}`}
                  value={marriage?.status || ""}
                  onChange={(value) => updateMarriageStatus(index, value)}
                  readOnly={readOnly}
                  error={getFieldError(errors, `${prefix}.status`)}
                  options={[
                    { value: "current", label: "ازدواج جاری" },
                    { value: "ended", label: "ازدواج پایان‌یافته" },
                  ]}
                />

                <TextField
                  label="تاریخ ازدواج"
                  type="date"
                  value={marriage?.marriage_date}
                  onChange={(value) => { clearValidationError(`${prefix}.marriage_date`); updateMarriage(index, { ...marriage, marriage_date: value }); }}
                  error={getFieldError(errors, `${prefix}.marriage_date`)}
                  readOnly={readOnly}
                  required
                />

                {marriage?.status === "ended" && (
                  <>
                    <TextField
                      label="تاریخ پایان"
                      type="date"
                      value={marriage?.end_date}
                      onChange={(value) => { clearValidationError(`${prefix}.end_date`); updateMarriage(index, { ...marriage, end_date: value }); }}
                      error={getFieldError(errors, `${prefix}.end_date`)}
                      readOnly={readOnly}
                      required
                    />
                    <ChoiceGroup
                      label="علت پایان"
                      required
                      name={`marriage-end-reason-${index}`}
                      value={marriage?.end_reason || ""}
                      onChange={(value) => { clearValidationError(`${prefix}.end_reason`); updateMarriage(index, { ...marriage, end_reason: value }); }}
                      readOnly={readOnly}
                      error={getFieldError(errors, `${prefix}.end_reason`)}
                      options={END_REASONS}
                    />
                  </>
                )}

                <TextField label="نام" value={spouse.first_name} onChange={(value) => updateSpouse(index, "first_name", value)} error={getFieldError(errors, `${prefix}.spouse.first_name`)} readOnly={readOnly} required />
                <TextField label="نام خانوادگی" value={spouse.last_name} onChange={(value) => updateSpouse(index, "last_name", value)} error={getFieldError(errors, `${prefix}.spouse.last_name`)} readOnly={readOnly} required />
                <TextField label="نام پدر" value={spouse.father_name} onChange={(value) => updateSpouse(index, "father_name", value)} error={getFieldError(errors, `${prefix}.spouse.father_name`)} readOnly={readOnly} />
                <TextField label="کد ملی" value={spouse.national_id} onChange={(value) => updateSpouse(index, "national_id", value)} error={getFieldError(errors, `${prefix}.spouse.national_id`)} readOnly={readOnly} inputMode="numeric" />
                <TextField label="تاریخ تولد" type="date" value={spouse.birth_date} onChange={(value) => updateSpouse(index, "birth_date", value)} error={getFieldError(errors, `${prefix}.spouse.birth_date`)} readOnly={readOnly} />
                <TextField label="شغل" value={spouse.occupation} onChange={(value) => updateSpouse(index, "occupation", value)} error={getFieldError(errors, `${prefix}.spouse.occupation`)} readOnly={readOnly} />
                <TextField label="تحصیلات" value={spouse.education} onChange={(value) => updateSpouse(index, "education", value)} error={getFieldError(errors, prefix + ".spouse.education")} readOnly={readOnly} />
                <SelectField
                  label="وضعیت جسمانی"
                  value={spouse.physical_status || ""}
                  onChange={(value) => updateSpousePhysicalStatus(index, value)}
                  error={getFieldError(errors, prefix + ".spouse.physical_status")}
                  options={["سالم", "بیمار"]}
                  readOnly={readOnly}
                  required
                />
                {spouse.physical_status === "بیمار" && (
                  <TextArea
                    label="توضیحات بیماری"
                    value={spouse.disease_description || ""}
                    onChange={(value) => updateSpouse(index, "disease_description", value)}
                    error={getFieldError(errors, prefix + ".spouse.disease_description")}
                    readOnly={readOnly}
                    required
                    full
                  />
                )}
                <TextArea
                  label="نشانی محل سکونت خانواده همسر"
                  value={marriage?.spouse_family_residence_address || ""}
                  onChange={(value) => {
                    clearValidationError(prefix + ".spouse_family_residence_address");
                    updateMarriage(index, { ...marriage, spouse_family_residence_address: value });
                  }}
                  error={getFieldError(errors, prefix + ".spouse_family_residence_address")}
                  readOnly={readOnly}
                  full
                />
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

export default MarriageStep;
