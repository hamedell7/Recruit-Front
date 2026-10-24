import { RECORDS } from "../../config/workflow";
import PersonalStep from "./steps/PersonalStep";
import MarriageStep from "./steps/MarriageStep";
import PeopleStep from "./steps/PeopleStep";
import ResidenceStep from "./steps/ResidenceStep";
import MilitaryStep from "./steps/MilitaryStep";
import VeteranStep from "./steps/VeteranStep";
import TravelStep from "./steps/TravelStep";
import DeclarationStep from "./steps/DeclarationStep";
import RecordStep from "./steps/RecordStep";
import EducationEmploymentStep from "./steps/EducationEmploymentStep";
import AccommodationStep from "./steps/AccommodationStep";
import PassportStep from "./steps/PassportStep";
import TextareaStep from "./steps/TextareaStep";

const sharedRecordProps = (props) => ({
  form: props.form,
  setForm: props.setForm,
  countries: props.countries,
  hasSpouse: props.hasSpouse,
  readOnly: props.readOnly,
  errors: props.errors,
  clearValidationError: props.clearValidationError,
});

const HANDLER_RENDERERS = {
  personal_v1: (props) => <PersonalStep {...sharedRecordProps(props)} />,
  marriage_v1: (props) => <MarriageStep {...sharedRecordProps(props)} />,
  military_v1: (props) => <MilitaryStep {...sharedRecordProps(props)} data={props.data} />,
  veteran_v1: (props) => <VeteranStep {...sharedRecordProps(props)} />,
  travel_v1: (props) => <TravelStep {...sharedRecordProps(props)} />,
  family_v1: (props) => <PeopleStep {...sharedRecordProps(props)} kind="family" />,
  social_relations_v1: (props) => <PeopleStep {...sharedRecordProps(props)} kind="social" />,
  social_references_v1: (props) => <PeopleStep {...sharedRecordProps(props)} kind="social" groupRole="REFERENCE" />,
  social_friends_v1: (props) => <PeopleStep {...sharedRecordProps(props)} kind="social" groupRole="FRIEND" />,
  social_neighbors_v1: (props) => <PeopleStep {...sharedRecordProps(props)} kind="social" groupRole="NEIGHBOR" />,
  social_relatives_v1: (props) => <PeopleStep {...sharedRecordProps(props)} kind="social" groupRole="RELATIVE" />,
  social_family_friends_v1: (props) => <PeopleStep {...sharedRecordProps(props)} kind="social" groupRole="FAMILY_FRIEND" />,
  residence_v1: (props) => <ResidenceStep {...sharedRecordProps(props)} />,
  passport_v1: (props) => <PassportStep {...sharedRecordProps(props)} />,
  education_records_v1: (props) => <EducationEmploymentStep {...sharedRecordProps(props)} stepKey="education" />,
  employment_records_v1: (props) => <EducationEmploymentStep {...sharedRecordProps(props)} stepKey="employment" />,
  accommodation_records_v1: (props) => <AccommodationStep {...sharedRecordProps(props)} />,
  additional_v1: (props) => (
    <TextareaStep
      value={props.form?.details || ""}
      onChange={(value) => {
        props.clearValidationError("details");
        props.setForm({ details: value });
      }}
      readOnly={props.readOnly}
      error={props.errors?.details}
    />
  ),
  declaration_v1: (props) => <DeclarationStep {...sharedRecordProps(props)} />,
};

const RECORD_HANDLER_KEYS = new Set([
  "foreign_contacts_v1",
  "screening_history_v1",
  "legal_incidents_v1",
  "migration_v1",
  "affiliations_v1",
  "addiction_v1",
  "foreign_company_relations_v1",
  "embassy_relations_v1",
  "exit_restrictions_v1",
  "activities_v1",
  "weapons_v1",
]);

function StepRenderer({ stepKey, handlerKey, form, setForm, data, countries, readOnly, errors, clearValidationError, hasSpouse = false }) {
  if (!form && handlerKey !== "additional_v1") {
    return <div className="loading-inline">در حال آماده‌سازی فرم…</div>;
  }

  const props = { stepKey, form, setForm, data, countries, readOnly, errors, clearValidationError, hasSpouse };
  const Renderer = HANDLER_RENDERERS[handlerKey];
  if (Renderer) return Renderer(props);

  if (RECORD_HANDLER_KEYS.has(handlerKey)) {
    return (
      <RecordStep
        {...sharedRecordProps(props)}
        fields={RECORDS[stepKey] || []}
        form={form || { records: [] }}
      />
    );
  }

  return (
    <section className="workflow-load-error" role="alert">
      <h2>پردازشگر این مرحله در رابط کاربری ثبت نشده است</h2>
      <p>برای فعال‌سازی این مرحله باید یک renderer تأییدشده برای پردازشگر «{handlerKey || "نامشخص"}» اضافه شود.</p>
    </section>
  );
}

export default StepRenderer;
