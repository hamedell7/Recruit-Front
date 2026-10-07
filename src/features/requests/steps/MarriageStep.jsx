import { getFieldError } from "../../../utils/validation";
import TextField, { TextArea, SelectField } from "../../../components/form/Fields";
import FormSection from "../../../components/form/FormSection";

const MARRIED_STATUSES = ["متأهل", "ازدواج مجدد"];
const ENDED_STATUSES = ["متارکه", "فوت همسر"];

function MarriageStep({ form, setForm, readOnly, errors, clearValidationError }) {
  const spouse = form.spouse || {};
  const status = form.status || "";
  const isMarried = MARRIED_STATUSES.includes(status);
  const isEnded = ENDED_STATUSES.includes(status);
  const showMarriageDate = isMarried || isEnded;
  const showEndDetails = isEnded;
  const showSpouse = isMarried || isEnded;

  const update = (key, value) => {
    clearValidationError(key);
    setForm({ ...form, [key]: value });
  };

  const updateStatus = (value) => {
    clearValidationError("status");
    const next = { ...form, status: value };

    if (!MARRIED_STATUSES.includes(value) && !ENDED_STATUSES.includes(value)) {
      next.marriage_date = "";
      next.end_date = "";
      next.end_reason = "";
      next.spouse = null;
    } else if (!ENDED_STATUSES.includes(value)) {
      next.end_date = "";
      next.end_reason = "";
    }

    setForm(next);
  };

  const updateSpouse = (key, value) => {
    clearValidationError(`spouse.${key}`);
    setForm({ ...form, spouse: { ...spouse, [key]: value } });
  };

  return (
    <div className="form-stack">
      <FormSection title="وضعیت تأهل" hint="مطابق اطلاعات واقعی و آخرین وضعیت ثبتی ثبت کنید.">
        <div className="field-grid">
          <SelectField
            label="وضعیت"
            value={status}
            onChange={updateStatus}
            error={getFieldError(errors, "status")}
            options={["مجرد", "در شرف ازدواج", "متأهل", "متارکه", "فوت همسر", "ازدواج مجدد"]}
            readOnly={readOnly}
          />

          {showMarriageDate && (
            <TextField
              label="تاریخ ازدواج"
              type="date"
              value={form.marriage_date}
              onChange={(v) => update("marriage_date", v)}
              error={getFieldError(errors, "marriage_date")}
              readOnly={readOnly}
            />
          )}

          {showEndDetails && (
            <>
              <TextField
                label="تاریخ پایان"
                type="date"
                value={form.end_date}
                onChange={(v) => update("end_date", v)}
                error={getFieldError(errors, "end_date")}
                readOnly={readOnly}
              />
              <TextField
                label="علت پایان"
                value={form.end_reason}
                onChange={(v) => update("end_reason", v)}
                error={getFieldError(errors, "end_reason")}
                readOnly={readOnly}
              />
            </>
          )}
        </div>
      </FormSection>

      {showSpouse ? (
        <FormSection
          title="مشخصات همسر"
          hint={isEnded ? "اطلاعات همسر مربوط به آخرین ازدواج را ثبت کنید." : "اطلاعات همسر را مطابق آخرین وضعیت ثبت کنید."}
        >
          <div className="field-grid">
            <TextField label="نام" value={spouse.first_name} onChange={(v) => updateSpouse("first_name", v)} error={getFieldError(errors, "spouse.first_name")} readOnly={readOnly} />
            <TextField label="نام خانوادگی" value={spouse.last_name} onChange={(v) => updateSpouse("last_name", v)} error={getFieldError(errors, "spouse.last_name")} readOnly={readOnly} />
            <TextField label="نام پدر" value={spouse.father_name} onChange={(v) => updateSpouse("father_name", v)} error={getFieldError(errors, "spouse.father_name")} readOnly={readOnly} />
            <TextField label="کد ملی" value={spouse.national_id} onChange={(v) => updateSpouse("national_id", v)} error={getFieldError(errors, "spouse.national_id")} readOnly={readOnly} />
            <TextField label="تاریخ تولد" type="date" value={spouse.birth_date} onChange={(v) => updateSpouse("birth_date", v)} error={getFieldError(errors, "spouse.birth_date")} readOnly={readOnly} />
            <TextField label="شغل" value={spouse.occupation} onChange={(v) => updateSpouse("occupation", v)} error={getFieldError(errors, "spouse.occupation")} readOnly={readOnly} />
            <TextField label="تحصیلات" value={spouse.education} onChange={(v) => updateSpouse("education", v)} error={getFieldError(errors, "spouse.education")} readOnly={readOnly} />
            <TextArea label="ملاحظات" value={form.notes} onChange={(v) => update("notes", v)} error={getFieldError(errors, "notes")} full readOnly={readOnly} />
          </div>
        </FormSection>
      ) : (
        <div className="inline-info">
          <strong>در این وضعیت، اطلاعات همسر لازم نیست.</strong>
          <span>در صورت تغییر وضعیت تأهل، فیلدهای مرتبط با ازدواج نمایش داده می‌شوند.</span>
        </div>
      )}
    </div>
  );
}

export default MarriageStep;
