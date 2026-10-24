import { normalizeList } from "../../../utils/collections";
import { getFieldError } from "../../../utils/validation";
import TextField, { TextArea, SelectField } from "../../../components/form/Fields";
import ListEditor from "../../../components/form/ListEditor";
import FormSection from "../../../components/form/FormSection";
import FieldError from "../../../components/form/FieldError";
import AddressFields from "./AddressFields";
import { EDUCATION_LEVEL_OPTIONS } from "../../../config/workflow";

function withCurrentOption(options, currentValue) {
  return currentValue && !options.includes(currentValue) ? [...options, currentValue] : options;
}

const SOCIAL_GROUPS = [
  {
    role: "REFERENCE",
    title: "معرفین",
    hint: "مشخصات معرفین خود را وارد کنید؛ افرادی که شناخت کافی از شما دارند.",
    minimum: 1,
    minimumLabel: "حداقل یک معرف",
  },
  {
    role: "FRIEND",
    title: "دوستان دوران تحصیل و سربازی",
    hint: "مشخصات سه نفر از دوستان دوران تحصیل در مدارس و دانشگاه یا دوران سربازی را ثبت کنید که همچنان با شما در ارتباط هستند. ترجیحاً افرادی را معرفی کنید که در شهر محل زندگی شما ساکن‌اند.",
    minimum: 3,
    minimumLabel: "سه نفر",
  },
  {
    role: "NEIGHBOR",
    title: "همسایگان و معتمدان محل",
    hint: "مشخصات چهار نفر از همسایگان، مدیر ساختمان، کسبه محل یا امام جماعت مسجد محل سکونت را وارد کنید که شما را می‌شناسند.",
    minimum: 4,
    minimumLabel: "چهار نفر",
  },
  {
    role: "RELATIVE",
    title: "بستگان",
    hint: "مشخصات دو نفر از بستگانی را ثبت کنید که شناخت کافی از شما دارند.",
    minimum: 2,
    minimumLabel: "دو نفر",
  },
  {
    role: "FAMILY_FRIEND",
    title: "معاشرین و دوستان خانوادگی",
    hint: "مشخصات سه نفر از معاشرین و دوستانی را وارد کنید که با آن‌ها رفت‌وآمد خانوادگی دارید. از معرفی افرادی که در بخش‌های قبلی ثبت کرده‌اید خودداری کنید.",
    minimum: 3,
    minimumLabel: "سه نفر",
  },
];

function PeopleStep({ kind, form, setForm, countries, readOnly, errors, clearValidationError }) {
  const people = normalizeList(form?.people);
  const isFamily = kind === "family";
  const empty = (role = (isFamily ? "FATHER" : "REFERENCE")) => ({
    person_id: null,
    role_type: role,
    relation_to_applicant: "",
    first_name: "",
    last_name: "",
    father_name: "",
    birth_date: "",
    alive_status: "",
    education: "",
    occupation: "",
    addresses: [],
    notes: "",
  });

  const updateGroup = (role, items) => {
    const retained = people.filter((person) => person.role_type !== role && !(role === "FRIEND" && person.role_type === "MILITARY_RELATIVE"));
    setForm({ people: [...retained, ...items] });
  };

  const renderPerson = (item, setItem) => {
    const globalIndex = Math.max(0, people.findIndex((person) => person === item));
    const prefix = `people.${globalIndex}`;
    const update = (key, value) => {
      clearValidationError(`${prefix}.${key}`);
      setItem({ ...item, [key]: value });
    };

    return (
      <div className="person-card">
        <div className="card-badge">{isFamily ? "عضو خانواده" : "مشخصات فرد"}</div>
        <div className="field-grid">
          {!isFamily && <TextField label="نسبت / نحوه آشنایی" value={item.relation_to_applicant} onChange={(v) => update("relation_to_applicant", v)} error={getFieldError(errors, `${prefix}.relation_to_applicant`)} readOnly={readOnly} />}
          <TextField label="نام" value={item.first_name} onChange={(v) => update("first_name", v)} error={getFieldError(errors, `${prefix}.first_name`)} readOnly={readOnly} />
          <TextField label="نام خانوادگی" value={item.last_name} onChange={(v) => update("last_name", v)} error={getFieldError(errors, `${prefix}.last_name`)} readOnly={readOnly} />
          {!isFamily && <TextField label="نام پدر" value={item.father_name} onChange={(v) => update("father_name", v)} error={getFieldError(errors, `${prefix}.father_name`)} readOnly={readOnly} />}
          <TextField label="تاریخ تولد" type="date" value={item.birth_date} onChange={(v) => update("birth_date", v)} error={getFieldError(errors, `${prefix}.birth_date`)} readOnly={readOnly} />
          <SelectField label="تحصیلات" value={item.education} onChange={(v) => update("education", v)} error={getFieldError(errors, `${prefix}.education`)} options={withCurrentOption(EDUCATION_LEVEL_OPTIONS, item.education)} readOnly={readOnly} />
          <TextField label="شغل" value={item.occupation} onChange={(v) => update("occupation", v)} error={getFieldError(errors, `${prefix}.occupation`)} readOnly={readOnly} />
          {isFamily && <SelectField label="وضعیت حیات" value={item.alive_status} onChange={(v) => update("alive_status", v)} error={getFieldError(errors, `${prefix}.alive_status`)} options={[{ value: "زنده", label: "زنده" }, { value: "فوت شده", label: "فوت شده" }]} readOnly={readOnly} />}
          <TextArea label="توضیحات" value={item.notes} onChange={(v) => update("notes", v)} error={getFieldError(errors, `${prefix}.notes`)} full readOnly={readOnly} />
        </div>
        <div className="subeditor">
          <ListEditor
            title="نشانی‌ها"
            items={normalizeList(item.addresses)}
            setItems={(items) => setItem({ ...item, addresses: items })}
            clearValidationError={clearValidationError}
            errorPrefix={`${prefix}.addresses`}
            empty={() => ({ address_type: "CURRENT", address_line: "", phone: "" })}
            readOnly={readOnly}
            compact
            render={(address, setAddress, addressIndex) => (
              <AddressFields
                item={address}
                setItem={setAddress}
                countries={countries}
                readOnly={readOnly}
                family={isFamily}
                simplified={!isFamily}
                errors={errors}
                errorPrefix={`${prefix}.addresses.${addressIndex}`}
                clearValidationError={clearValidationError}
              />
            )}
          />
        </div>
      </div>
    );
  };

  if (isFamily) {
    return (
      <ListEditor
        title="اعضای خانواده"
        hint="والدین، خواهر و برادر، همسر، فرزندان و سایر اعضای خانوادگی را ثبت کنید."
        readOnly={readOnly}
        items={people}
        setItems={(items) => setForm({ people: items })}
        clearValidationError={clearValidationError}
        errorPrefix="people"
        empty={() => empty("FATHER")}
        render={(item, setItem) => renderPerson(item, setItem)}
      />
    );
  }

  return (
    <div className="form-stack">
      <FormSection
        title="معرفین، دوستان و همسایگان"
        hint="افرادی را معرفی کنید که شناخت کافی از شما دارند. هر گروه را در بخش مربوط به خودش ثبت کنید؛ برای ثبت هر فرد از دکمه افزودن همان بخش استفاده کنید."
      >
        <div className="inline-info" role="note">
          اطلاعات این پنج گروه جداگانه تکمیل می‌شوند. نام افراد را در بیش از یک گروه وارد نکنید.
        </div>
      </FormSection>
      {SOCIAL_GROUPS.map((group) => {
        const groupPeople = people.filter((person) => person.role_type === group.role || (group.role === "FRIEND" && person.role_type === "MILITARY_RELATIVE"));
        return (
          <div key={group.role} className="social-group-editor">
          <ListEditor
            title={group.title}
            hint={group.hint}
            items={groupPeople}
            setItems={(items) => updateGroup(group.role, items)}
            clearValidationError={clearValidationError}
            errorPrefix="people"
            empty={() => empty(group.role)}
            addLabel="افزودن فرد"
            readOnly={readOnly}
            render={(item, setItem) => renderPerson(item, setItem)}
          />
          <FieldError error={getFieldError(errors, `people.requirements.${group.role}`)} />
          </div>
        );
      })}
    </div>
  );
}

export default PeopleStep;
