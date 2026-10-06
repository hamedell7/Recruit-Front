import { normalizeList } from "../../../utils/collections";
import { getFieldError } from "../../../utils/validation";
import TextField, { TextArea, SelectField } from "../../../components/form/Fields";
import FormSection from "../../../components/form/FormSection";
import ListEditor from "../../../components/form/ListEditor";
import GeoFields from "../../../components/form/GeoFields";
import AddressFields from "./AddressFields";

function PersonalStep({ form, setForm, countries, readOnly, errors, clearValidationError }) {
  const update = (key, value) => {
    clearValidationError(key);
    setForm((current) => ({ ...current, [key]: value }));
  };
  const contacts = normalizeList(form?.contacts);
  const addresses = normalizeList(form?.addresses);
  return (
    <div className="form-stack">
      <FormSection title="اطلاعات هویتی" hint="اطلاعات پایه داوطلب را با دقت وارد کنید.">
        <div className="field-grid">
          <TextField label="نام" value={form.first_name} onChange={(v) => update("first_name", v)} error={getFieldError(errors, "first_name")} required readOnly={readOnly} />
          <TextField label="نام خانوادگی" value={form.last_name} onChange={(v) => update("last_name", v)} error={getFieldError(errors, "last_name")} required readOnly={readOnly} />
          <TextField label="نام پدر" value={form.father_name} onChange={(v) => update("father_name", v)} error={getFieldError(errors, "father_name")} readOnly={readOnly} />
          <TextField label="کد ملی" value={form.national_id} onChange={(v) => update("national_id", v)} error={getFieldError(errors, "national_id")} required inputMode="numeric" readOnly={readOnly} />
          <TextField label="شماره شناسنامه" value={form.birth_certificate_no} onChange={(v) => update("birth_certificate_no", v)} error={getFieldError(errors, "birth_certificate_no")} readOnly={readOnly} />
          <TextField label="نام خانوادگی قبلی" value={form.previous_last_name} onChange={(v) => update("previous_last_name", v)} error={getFieldError(errors, "previous_last_name")} readOnly={readOnly} />
          <TextField label="تاریخ تولد" type="date" value={form.birth_date} onChange={(v) => update("birth_date", v)} error={getFieldError(errors, "birth_date")} readOnly={readOnly} />
          <SelectField label="جنسیت" value={form.gender} onChange={(v) => update("gender", v)} error={getFieldError(errors, "gender")} options={["مرد", "زن"]} readOnly={readOnly} />
          <TextField label="تابعیت" value={form.nationality} onChange={(v) => update("nationality", v)} error={getFieldError(errors, "nationality")} readOnly={readOnly} />
          <TextField label="دین" value={form.religion} onChange={(v) => update("religion", v)} error={getFieldError(errors, "religion")} readOnly={readOnly} />
          <TextField label="مذهب" value={form.sect} onChange={(v) => update("sect", v)} error={getFieldError(errors, "sect")} readOnly={readOnly} />
          <SelectField label="وضعیت جسمانی" value={form.physical_status} onChange={(v) => update("physical_status", v)} error={getFieldError(errors, "physical_status")} options={["سالم", "بیمار"]} readOnly={readOnly} />
          <TextField label="وزن (کیلوگرم)" type="number" value={form.weight_kg} onChange={(v) => update("weight_kg", v)} error={getFieldError(errors, "weight_kg")} readOnly={readOnly} />
          <TextField label="قد (سانتی‌متر)" type="number" value={form.height_cm} onChange={(v) => update("height_cm", v)} error={getFieldError(errors, "height_cm")} readOnly={readOnly} />
          <TextField label="گروه خون" value={form.blood_type} onChange={(v) => update("blood_type", v)} error={getFieldError(errors, "blood_type")} readOnly={readOnly} />
          <TextField label="ایمیل" value={form.email} onChange={(v) => update("email", v)} error={getFieldError(errors, "email")} readOnly={readOnly} />
          <TextArea label="نوع بیماری / توضیحات جسمانی" value={form.disease_description} onChange={(v) => update("disease_description", v)} error={getFieldError(errors, "disease_description")} full readOnly={readOnly} />
          <TextArea label="معلولیت" value={form.disability_description} onChange={(v) => update("disability_description", v)} error={getFieldError(errors, "disability_description")} full readOnly={readOnly} />
          <TextArea label="علائم مشخصه" value={form.distinguishing_marks} onChange={(v) => update("distinguishing_marks", v)} error={getFieldError(errors, "distinguishing_marks")} full readOnly={readOnly} />
          <GeoFields record={form} setRecord={setForm} countries={countries} readOnly={readOnly} prefix="birth_" errors={errors} errorPrefix="" clearValidationError={clearValidationError} />
        </div>
      </FormSection>

      <ListEditor title="راه‌های تماس" hint="می‌توانید چند شماره تلفن یا شناسه فضای مجازی ثبت کنید." readOnly={readOnly}
        items={contacts} setItems={(items) => setForm((current) => ({ ...current, contacts: items }))}
        clearValidationError={clearValidationError} errorPrefix="contacts"
        empty={() => ({ contact_type: "موبایل", value: "", owner_type: "APPLICANT", owner_name: "", is_primary: false })}
        render={(item, setItem, index) => (
          <div className="mini-grid">
            <TextField label="نوع تماس" value={item.contact_type} onChange={(v) => { const p=`contacts.${index}.contact_type`; clearValidationError(p); setItem({ ...item, contact_type: v }); }} error={getFieldError(errors, `contacts.${index}.contact_type`)} readOnly={readOnly} />
            <TextField label="شماره / شناسه" value={item.value} onChange={(v) => { const p=`contacts.${index}.value`; clearValidationError(p); setItem({ ...item, value: v }); }} error={getFieldError(errors, `contacts.${index}.value`)} readOnly={readOnly} />
            <TextField label="نوع مالکیت" value={item.owner_type} onChange={(v) => { const p=`contacts.${index}.owner_type`; clearValidationError(p); setItem({ ...item, owner_type: v }); }} error={getFieldError(errors, `contacts.${index}.owner_type`)} readOnly={readOnly} />
            <TextField label="نام مالک" value={item.owner_name} onChange={(v) => { const p=`contacts.${index}.owner_name`; clearValidationError(p); setItem({ ...item, owner_name: v }); }} error={getFieldError(errors, `contacts.${index}.owner_name`)} readOnly={readOnly} />
            <label className="checkbox-line"><input type="checkbox" checked={Boolean(item.is_primary)} onChange={(e) => { clearValidationError(`contacts.${index}.is_primary`); setItem({ ...item, is_primary: e.target.checked }); }} disabled={readOnly} /> تماس اصلی</label>
          </div>
        )}
      />

      <ListEditor title="نشانی محل سکونت و آدرس‌ها" hint="برای آدرس فعلی یا سوابق آدرس می‌توانید چند مورد ثبت کنید." readOnly={readOnly}
        items={addresses} setItems={(items) => setForm((current) => ({ ...current, addresses: items }))}
        clearValidationError={clearValidationError} errorPrefix="addresses"
        empty={() => ({ address_type: "CURRENT", country_id: countries[0]?.id || "", postal_code: "", address_line: "", phone: "", from_date: "", to_date: "" })}
        render={(item, setItem, index) => <AddressFields item={item} setItem={setItem} countries={countries} readOnly={readOnly} errors={errors} errorPrefix={`addresses.${index}`} clearValidationError={clearValidationError} />}
      />
    </div>
  );
}

export default PersonalStep;
