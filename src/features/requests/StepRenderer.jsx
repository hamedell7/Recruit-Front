import { RECORDS } from "../../config/workflow";
import PersonalStep from "./steps/PersonalStep";
import MarriageStep from "./steps/MarriageStep";
import PeopleStep from "./steps/PeopleStep";
import ResidenceStep from "./steps/ResidenceStep";
import DeclarationStep from "./steps/DeclarationStep";
import RecordStep from "./steps/RecordStep";
import TextareaStep from "./steps/TextareaStep";

function StepRenderer({ stepKey, form, setForm, data, countries, readOnly, errors, clearValidationError }) {
  if (!form && stepKey !== "additional") return <div className="loading-inline">در حال آماده‌سازی فرم…</div>;
  if (stepKey === "personal") return <PersonalStep form={form} setForm={setForm} countries={countries} readOnly={readOnly} errors={errors} clearValidationError={clearValidationError} />;
  if (stepKey === "marriage") return <MarriageStep form={form} setForm={setForm} readOnly={readOnly} errors={errors} clearValidationError={clearValidationError} />;
  if (stepKey === "family") return <PeopleStep kind="family" form={form} setForm={setForm} countries={countries} readOnly={readOnly} errors={errors} clearValidationError={clearValidationError} />;
  if (stepKey === "social_relations") return <PeopleStep kind="social" form={form} setForm={setForm} countries={countries} readOnly={readOnly} errors={errors} clearValidationError={clearValidationError} />;
  if (stepKey === "residence") return <ResidenceStep form={form} setForm={setForm} countries={countries} readOnly={readOnly} errors={errors} clearValidationError={clearValidationError} />;
  if (stepKey === "additional") return <TextareaStep value={form?.details || ""} onChange={(value) => { clearValidationError("details"); setForm({ details: value }); }} readOnly={readOnly} error={errors.details} />;
  if (stepKey === "declaration") return <DeclarationStep form={form} setForm={setForm} readOnly={readOnly} errors={errors} clearValidationError={clearValidationError} />;
  return <RecordStep fields={RECORDS[stepKey] || []} form={form || { records: [] }} setForm={setForm} countries={countries} readOnly={readOnly} errors={errors} clearValidationError={clearValidationError} />;
}

export default StepRenderer;
