import { normalizeList } from "../../../utils/collections";
import { getFieldError } from "../../../utils/validation";
import TextField, { TextArea, SelectField } from "../../../components/form/Fields";
import ListEditor from "../../../components/form/ListEditor";
import FormSection from "../../../components/form/FormSection";
import AddressFields from "./AddressFields";

function PeopleStep({ kind, form, setForm, countries, readOnly, errors, clearValidationError }) {
  const people = normalizeList(form?.people);
  const isFamily = kind === "family";
  const empty = () => ({
    person_id: null, role_type: isFamily ? "FATHER" : "FRIEND", relation_to_applicant: "",
    first_name: "", last_name: "", father_name: "", national_id: "", birth_date: "",
    alive_status: "", education: "", occupation: "", ...(isFamily ? {} : { contacts: [] }), addresses: [], notes: "",
  });

  return (
    <ListEditor title={isFamily ? "اعضای خانواده" : "منابع شناخت و معاشرین"}
      hint={isFamily ? "والدین، خواهر و برادر، همسر، فرزندان و سایر اعضای خانوادگی را ثبت کنید." : "دوستان، همسایگان، معرفین و بستگانی که شناخت کافی از شما دارند را ثبت کنید."}
      readOnly={readOnly} items={people} setItems={(items) => setForm({ people: items })}
      clearValidationError={clearValidationError} errorPrefix="people" empty={empty}
      render={(item, setItem, index) => {
        const prefix = `people.${index}`;
        const update = (key, value) => { clearValidationError(`${prefix}.${key}`); setItem({ ...item, [key]: value }); };
        return (
          <div className="person-card">
            <div className="card-badge">{isFamily ? "اعضای خانواده" : "منبع شناخت"}</div>
            <div className="field-grid">
              <SelectField label="نقش" value={item.role_type} onChange={(v) => update("role_type", v)} error={getFieldError(errors, `${prefix}.role_type`)} options={isFamily ? [
                { value: "FATHER", label: "پدر" },
                { value: "MOTHER", label: "مادر" },
                { value: "SIBLING", label: "خواهر / برادر" },
                { value: "CHILD", label: "فرزند" },
                { value: "SPOUSE_FATHER", label: "پدر همسر" },
                { value: "SPOUSE_MOTHER", label: "مادر همسر" },
                { value: "SPOUSE_SIBLING", label: "خواهر / برادر همسر" },
                { value: "GRANDPARENT", label: "پدربزرگ / مادربزرگ" },
              ] : [
                { value: "FRIEND", label: "دوست" },
                { value: "NEIGHBOR", label: "همسایه" },
                { value: "REFERENCE", label: "معرف" },
                { value: "RELATIVE", label: "بستگان" },
                { value: "FAMILY_FRIEND", label: "دوست خانوادگی" },
                { value: "MILITARY_RELATIVE", label: "آشنای مرتبط با خدمت نظامی" },
              ]} readOnly={readOnly} />
              {!isFamily && <TextField label="نسبت" value={item.relation_to_applicant} onChange={(v) => update("relation_to_applicant", v)} error={getFieldError(errors, `${prefix}.relation_to_applicant`)} readOnly={readOnly} />}
              <TextField label="نام" value={item.first_name} onChange={(v) => update("first_name", v)} error={getFieldError(errors, `${prefix}.first_name`)} readOnly={readOnly} />
              <TextField label="نام خانوادگی" value={item.last_name} onChange={(v) => update("last_name", v)} error={getFieldError(errors, `${prefix}.last_name`)} readOnly={readOnly} />
              {!isFamily && <TextField label="نام پدر" value={item.father_name} onChange={(v) => update("father_name", v)} error={getFieldError(errors, `${prefix}.father_name`)} readOnly={readOnly} />}
              {isFamily && <TextField label="کد ملی" value={item.national_id} onChange={(v) => update("national_id", v)} error={getFieldError(errors, `${prefix}.national_id`)} readOnly={readOnly} />}
              <TextField label="تاریخ تولد" type="date" value={item.birth_date} onChange={(v) => update("birth_date", v)} error={getFieldError(errors, `${prefix}.birth_date`)} readOnly={readOnly} />
              <TextField label="تحصیلات" value={item.education} onChange={(v) => update("education", v)} error={getFieldError(errors, `${prefix}.education`)} readOnly={readOnly} />
              <TextField label="شغل" value={item.occupation} onChange={(v) => update("occupation", v)} error={getFieldError(errors, `${prefix}.occupation`)} readOnly={readOnly} />
              {isFamily && <SelectField label="وضعیت حیات" value={item.alive_status} onChange={(v) => update("alive_status", v)} error={getFieldError(errors, `${prefix}.alive_status`)} options={["زنده", "فوت شده"]} readOnly={readOnly} />}
              <TextArea label="توضیحات" value={item.notes} onChange={(v) => update("notes", v)} error={getFieldError(errors, `${prefix}.notes`)} full readOnly={readOnly} />
            </div>

            <div className="subeditor">
              {!isFamily && <ListEditor title="تماس‌ها" items={normalizeList(item.contacts)} setItems={(items) => setItem({ ...item, contacts: items })}
                clearValidationError={clearValidationError} errorPrefix={`${prefix}.contacts`}
                empty={() => ({ contact_type: "موبایل", value: "", owner_type: "", owner_name: "", is_primary: false })} readOnly={readOnly} compact
                render={(contact, setContact, contactIndex) => (
                  <div className="mini-grid">
                    <TextField label="نوع" value={contact.contact_type} onChange={(v) => { const p=`${prefix}.contacts.${contactIndex}.contact_type`; clearValidationError(p); setContact({ ...contact, contact_type: v }); }} error={getFieldError(errors, `${prefix}.contacts.${contactIndex}.contact_type`)} readOnly={readOnly} />
                    <TextField label="شماره / شناسه" value={contact.value} onChange={(v) => { const p=`${prefix}.contacts.${contactIndex}.value`; clearValidationError(p); setContact({ ...contact, value: v }); }} error={getFieldError(errors, `${prefix}.contacts.${contactIndex}.value`)} readOnly={readOnly} />
                  </div>
                )}
              />}
              <ListEditor title="نشانی‌ها" items={normalizeList(item.addresses)} setItems={(items) => setItem({ ...item, addresses: items })}
                clearValidationError={clearValidationError} errorPrefix={`${prefix}.addresses`}
                empty={() => ({ address_type: "CURRENT", country_id: countries[0]?.id || "", postal_code: "", address_line: "", phone: "", from_date: "", to_date: "" })}
                readOnly={readOnly} compact
                render={(address, setAddress, addressIndex) => <AddressFields item={address} setItem={setAddress} countries={countries} readOnly={readOnly} family={isFamily} errors={errors} errorPrefix={`${prefix}.addresses.${addressIndex}`} clearValidationError={clearValidationError} />}
              />
            </div>
          </div>
        );
      }}
    />
  );
}

export default PeopleStep;
