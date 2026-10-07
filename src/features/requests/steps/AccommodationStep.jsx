import { RECORDS, emptyRecord } from "../../../config/workflow";
import { normalizeList } from "../../../utils/collections";
import { getFieldError } from "../../../utils/validation";
import ListEditor from "../../../components/form/ListEditor";
import FieldInput from "../../../components/form/FieldInput";
import GeoFields from "../../../components/form/GeoFields";

function AccommodationStep({ form, setForm, countries, readOnly, errors, clearValidationError }) {
  const fields = RECORDS.accommodation || [];
  const items = normalizeList(form?.records);

  return (
    <section className="record-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">تحصیل و اشتغال</span>
          <h2>اقامت و اسکان</h2>
          <p>سوابق خوابگاه، پانسیون یا مراکز اقامتی مورد استفاده را ثبت کنید.</p>
        </div>
      </div>
      <ListEditor
        title="خوابگاه و پانسیون"
        hint="در صورت نداشتن سابقه خوابگاه یا پانسیون، این قسمت را خالی بگذارید."
        items={items}
        setItems={(next) => setForm({ ...(form || {}), records: next })}
        clearValidationError={clearValidationError}
        errorPrefix="records"
        empty={() => emptyRecord(fields)}
        readOnly={readOnly}
        render={(record, setRecord, index) => {
          const prefix = `records.${index}`;
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

export default AccommodationStep;
