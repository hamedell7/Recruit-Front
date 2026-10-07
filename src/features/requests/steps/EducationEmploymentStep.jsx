import { RECORDS, emptyRecord } from "../../../config/workflow";
import { normalizeList } from "../../../utils/collections";
import { getFieldError } from "../../../utils/validation";
import ListEditor from "../../../components/form/ListEditor";
import FieldInput from "../../../components/form/FieldInput";
import GeoFields from "../../../components/form/GeoFields";
import RecordStep from "./RecordStep";

function AccommodationEditor({ accommodations, setAccommodations, countries, readOnly, errors, clearValidationError }) {
  const fields = RECORDS.accommodation || [];
  const items = normalizeList(accommodations);

  return (
    <section className="record-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">اقامت‌های مرتبط</span>
          <h2>خوابگاه و پانسیون</h2>
          <p>سوابق خوابگاه، پانسیون یا مراکز اقامتی مورد استفاده در دوره تحصیل یا اشتغال را ثبت کنید.</p>
        </div>
      </div>
      <ListEditor
        title="سوابق اسکان"
        hint="در صورت نداشتن سابقه خوابگاه یا پانسیون، این قسمت را خالی بگذارید."
        items={items}
        setItems={setAccommodations}
        clearValidationError={clearValidationError}
        errorPrefix="accommodations"
        empty={() => emptyRecord(fields)}
        readOnly={readOnly}
        render={(record, setRecord, index) => {
          const prefix = `accommodations.${index}`;
          return (
            <div className="record-card">
              <div className="record-head"><span>ردیف {index + 1}</span><strong>محل اسکان</strong></div>
              <div className="field-grid">
                {fields.filter((field) => !["province_id", "county_id", "city_id", "village_id"].includes(field.key)).map((field) => (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={record[field.key]}
                    countries={countries}
                    onChange={(value) => {
                      clearValidationError(`${prefix}.${field.key}`);
                      setRecord({ ...record, [field.key]: value });
                    }}
                    readOnly={readOnly}
                    record={record}
                    error={getFieldError(errors, `${prefix}.${field.key}`)}
                  />
                ))}
                {fields.some((field) => ["province_id", "county_id", "city_id", "village_id"].includes(field.key)) && (
                  <GeoFields
                    record={record}
                    setRecord={setRecord}
                    countries={countries}
                    readOnly={readOnly}
                    errors={errors}
                    errorPrefix={prefix}
                    clearValidationError={clearValidationError}
                  />
                )}
              </div>
            </div>
          );
        }}
      />
    </section>
  );
}

function EducationEmploymentStep({ stepKey, form, setForm, countries, readOnly, errors, clearValidationError }) {
  const title = stepKey === "education" ? "تحصیل" : "اشتغال";

  return (
    <div>
      <RecordStep
        fields={RECORDS[stepKey] || []}
        form={{ records: normalizeList(form?.records) }}
        setForm={(next) => setForm({ ...(form || {}), records: next.records })}
        countries={countries}
        readOnly={readOnly}
        errors={errors}
        clearValidationError={clearValidationError}
      />
      <AccommodationEditor
        accommodations={form?.accommodations}
        setAccommodations={(items) => setForm({ ...(form || {}), accommodations: items })}
        countries={countries}
        readOnly={readOnly}
        errors={errors}
        clearValidationError={clearValidationError}
        title={title}
      />
    </div>
  );
}

export default EducationEmploymentStep;
