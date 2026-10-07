import { normalizeList } from "../../../utils/collections";
import { getFieldError } from "../../../utils/validation";
import TextField, { TextArea, SelectField } from "../../../components/form/Fields";
import FormSection from "../../../components/form/FormSection";
import ListEditor from "../../../components/form/ListEditor";
import GeoFields from "../../../components/form/GeoFields";

const OWNERSHIP_OPTIONS = [
  { value: "OWNER", label: "مالک" },
  { value: "OPERATOR", label: "بهره‌بردار" },
];

function PersonalStep({ form, setForm, countries, readOnly, errors, clearValidationError }) {
  const update = (key, value) => {
    clearValidationError(key);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateContact = (index, key, value) => {
    const path = `contacts.${index}.${key}`;
    clearValidationError(path);
    setForm((current) => ({
      ...current,
      contacts: normalizeList(current.contacts).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const updateCurrentAddress = (key, value) => {
    clearValidationError(`current_address.${key}`);
    setForm((current) => ({
      ...current,
      current_address: {
        ...(current.current_address || { address_line: "", postal_code: "", phone: "" }),
        [key]: value,
      },
    }));
  };

  const updatePhysicalStatus = (value) => {
    clearValidationError("physical_status");
    setForm((current) => ({
      ...current,
      physical_status: value,
      ...(value === "سالم"
        ? {
            disease_description: "",
            disability_description: "",
            distinguishing_marks: "",
          }
        : {}),
    }));
  };

  const clearCurrentAddress = () => {
    clearValidationError("current_address");
    setForm((current) => ({
      ...current,
      current_address: { address_line: "", postal_code: "", phone: "" },
    }));
  };

  const contacts = normalizeList(form?.contacts);
  const currentAddress = form?.current_address || { address_line: "", postal_code: "", phone: "" };

  return (
    <div className="form-stack">
      <FormSection title="اطلاعات هویتی" hint="اطلاعات پایه داوطلب را با دقت وارد کنید.">
        <div className="field-grid">
          <TextField label="نام" value={form.first_name} onChange={(v) => update("first_name", v)} error={getFieldError(errors, "first_name")} required readOnly={readOnly} />
          <TextField label="نام خانوادگی" value={form.last_name} onChange={(v) => update("last_name", v)} error={getFieldError(errors, "last_name")} required readOnly={readOnly} />
          <TextField label="نام مستعار" value={form.alias_first_name} onChange={(v) => update("alias_first_name", v)} error={getFieldError(errors, "alias_first_name")} readOnly={readOnly} />
          <TextField label="نام خانوادگی مستعار" value={form.alias_last_name} onChange={(v) => update("alias_last_name", v)} error={getFieldError(errors, "alias_last_name")} readOnly={readOnly} />
          <TextField label="نام پدر" value={form.father_name} onChange={(v) => update("father_name", v)} error={getFieldError(errors, "father_name")} readOnly={readOnly} />
          <TextField label="کد ملی" value={form.national_id} onChange={(v) => update("national_id", v)} error={getFieldError(errors, "national_id")} required inputMode="numeric" readOnly={readOnly} />
          <TextField label="شماره شناسنامه" value={form.birth_certificate_no} onChange={(v) => update("birth_certificate_no", v)} error={getFieldError(errors, "birth_certificate_no")} readOnly={readOnly} />
          <TextField label="نام خانوادگی قبلی" value={form.previous_last_name} onChange={(v) => update("previous_last_name", v)} error={getFieldError(errors, "previous_last_name")} readOnly={readOnly} />
          <TextField label="تاریخ تولد" type="date" value={form.birth_date} onChange={(v) => update("birth_date", v)} error={getFieldError(errors, "birth_date")} readOnly={readOnly} />
          <SelectField label="جنسیت" value={form.gender} onChange={(v) => update("gender", v)} error={getFieldError(errors, "gender")} options={["مرد", "زن"]} readOnly={readOnly} />
          <TextField label="تابعیت" value={form.nationality} onChange={(v) => update("nationality", v)} error={getFieldError(errors, "nationality")} readOnly={readOnly} />
          <TextField label="دین" value={form.religion} onChange={(v) => update("religion", v)} error={getFieldError(errors, "religion")} readOnly={readOnly} />
          <TextField label="مذهب" value={form.sect} onChange={(v) => update("sect", v)} error={getFieldError(errors, "sect")} readOnly={readOnly} />
          <TextField label="ایمیل" value={form.email} onChange={(v) => update("email", v)} error={getFieldError(errors, "email")} readOnly={readOnly} />
          <GeoFields record={form} setRecord={setForm} countries={countries} readOnly={readOnly} prefix="birth_" errors={errors} errorPrefix="" clearValidationError={clearValidationError} />
        </div>
      </FormSection>

      <FormSection title="وضعیت جسمانی" hint="ابتدا وضعیت جسمانی را انتخاب کنید؛ جزئیات بیماری فقط برای وضعیت «بیمار» نمایش داده می‌شود.">
        <div className="field-grid">
          <SelectField
            label="وضعیت جسمانی"
            value={form.physical_status}
            onChange={updatePhysicalStatus}
            error={getFieldError(errors, "physical_status")}
            options={["سالم", "بیمار"]}
            readOnly={readOnly}
          />
          <TextField label="وزن (کیلوگرم)" type="number" value={form.weight_kg} onChange={(v) => update("weight_kg", v)} error={getFieldError(errors, "weight_kg")} readOnly={readOnly} />
          <TextField label="قد (سانتی‌متر)" type="number" value={form.height_cm} onChange={(v) => update("height_cm", v)} error={getFieldError(errors, "height_cm")} readOnly={readOnly} />
          <TextField label="گروه خون" value={form.blood_type} onChange={(v) => update("blood_type", v)} error={getFieldError(errors, "blood_type")} readOnly={readOnly} />

          {form.physical_status === "بیمار" && (
            <>
              <TextArea label="نوع بیماری / توضیحات جسمانی" value={form.disease_description} onChange={(v) => update("disease_description", v)} error={getFieldError(errors, "disease_description")} full readOnly={readOnly} />
              <TextArea label="معلولیت" value={form.disability_description} onChange={(v) => update("disability_description", v)} error={getFieldError(errors, "disability_description")} full readOnly={readOnly} />
              <TextArea label="علائم مشخصه" value={form.distinguishing_marks} onChange={(v) => update("distinguishing_marks", v)} error={getFieldError(errors, "distinguishing_marks")} full readOnly={readOnly} />
            </>
          )}
        </div>
      </FormSection>

      <ListEditor
        title="راه‌های تماس"
        hint="می‌توانید چند شماره تماس ثبت کنید."
        readOnly={readOnly}
        items={contacts}
        setItems={(items) => setForm((current) => ({ ...current, contacts: items }))}
        clearValidationError={clearValidationError}
        errorPrefix="contacts"
        empty={() => ({ contact_type: "موبایل", value: "", owner_type: "OWNER", owner_name: "", is_primary: false })}
        render={(item, setItem, index) => (
          <div className="mini-grid">
            <TextField
              label="نوع تماس"
              value={item.contact_type}
              onChange={(v) => updateContact(index, "contact_type", v)}
              error={getFieldError(errors, `contacts.${index}.contact_type`)}
              readOnly={readOnly}
            />
            <TextField
              label="شماره تماس"
              value={item.value}
              onChange={(v) => updateContact(index, "value", v)}
              error={getFieldError(errors, `contacts.${index}.value`)}
              readOnly={readOnly}
            />
            <SelectField
              label="نوع مالکیت"
              value={item.owner_type || "OWNER"}
              onChange={(v) => {
                updateContact(index, "owner_type", v);
                if (v === "OWNER") updateContact(index, "owner_name", "");
              }}
              error={getFieldError(errors, `contacts.${index}.owner_type`)}
              options={OWNERSHIP_OPTIONS}
              readOnly={readOnly}
            />
            {item.owner_type === "OPERATOR" && (
              <TextField
                label="نام مالک"
                value={item.owner_name}
                onChange={(v) => updateContact(index, "owner_name", v)}
                error={getFieldError(errors, `contacts.${index}.owner_name`)}
                required
                readOnly={readOnly}
              />
            )}
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={Boolean(item.is_primary)}
                onChange={(e) => {
                  clearValidationError(`contacts.${index}.is_primary`);
                  setItem({ ...item, is_primary: e.target.checked });
                }}
                disabled={readOnly}
              />
              تماس اصلی
            </label>
          </div>
        )}
      />

      <FormSection title="نشانی محل سکونت" hint="آدرس محل سکونت فعلی خود را وارد کنید. فقط یک نشانی در این مرحله ثبت می‌شود.">
        <div className="field-grid">
          <TextArea
            label="آدرس دقیق"
            value={currentAddress.address_line}
            onChange={(v) => updateCurrentAddress("address_line", v)}
            error={getFieldError(errors, "current_address.address_line")}
            full
            required
            readOnly={readOnly}
          />
          <TextField
            label="کد پستی"
            value={currentAddress.postal_code}
            onChange={(v) => updateCurrentAddress("postal_code", v)}
            error={getFieldError(errors, "current_address.postal_code")}
            readOnly={readOnly}
          />
          <TextField
            label="تلفن"
            value={currentAddress.phone}
            onChange={(v) => updateCurrentAddress("phone", v)}
            error={getFieldError(errors, "current_address.phone")}
            readOnly={readOnly}
          />
          {!readOnly && (
            <button className="text-button" type="button" onClick={clearCurrentAddress}>
              پاک کردن نشانی
            </button>
          )}
        </div>
      </FormSection>
    </div>
  );
}

export default PersonalStep;
