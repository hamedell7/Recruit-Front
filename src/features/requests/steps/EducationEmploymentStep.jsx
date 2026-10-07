import { RECORDS } from "../../../config/workflow";
import { normalizeList } from "../../../utils/collections";
import RecordStep from "./RecordStep";

function EducationEmploymentStep({ stepKey, form, setForm, countries, readOnly, errors, clearValidationError }) {
  return (
    <RecordStep
      fields={RECORDS[stepKey] || []}
      form={{ records: normalizeList(form?.records) }}
      setForm={(next) => setForm({ ...(form || {}), records: next.records })}
      countries={countries}
      readOnly={readOnly}
      errors={errors}
      clearValidationError={clearValidationError}
    />
  );
}

export default EducationEmploymentStep;
