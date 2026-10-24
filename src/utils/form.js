import { RECORDS } from "../config/workflow.js";
import { normalizeList } from "./collections.js";
import { gregorianToJalaliString, jalaliToGregorianString } from "./date.js";

const SOCIAL_STEP_ROLES = {
  social_references: "REFERENCE",
  social_friends: "FRIEND",
  social_neighbors: "NEIGHBOR",
  social_relatives: "RELATIVE",
  social_family_friends: "FAMILY_FRIEND",
};

const SOCIAL_GROUP_REQUIREMENTS = {
  FRIEND: { count: 3, message: "مشخصات حداقل سه نفر از دوستان دوران تحصیل یا سربازی را ثبت کنید." },
  NEIGHBOR: { count: 4, message: "مشخصات حداقل چهار نفر از همسایگان و معتمدان محل را ثبت کنید." },
  RELATIVE: { count: 2, message: "مشخصات حداقل دو نفر از بستگان را ثبت کنید." },
  FAMILY_FRIEND: { count: 3, message: "مشخصات حداقل سه نفر از معاشرین و دوستان خانوادگی را ثبت کنید." },
};

function personBelongsToSocialStep(person, stepKey) {
  const role = SOCIAL_STEP_ROLES[stepKey];
  return !role
    || person?.role_type === role
    || (role === "FRIEND" && person?.role_type === "MILITARY_RELATIVE");
}

export { withSpouseAvailability } from "./spouseAvailability.js";

export function normalizeDigits(value) {
  return String(value || "")
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
}

const DATE_FIELD_PATTERN = /(^|_)(date)$/;

const NUMERIC_ONLY_TEXT_ALLOWED_KEYS = new Set([
  // These are textual input controls whose meaning legitimately permits digits alone.
  "passport_number",
  "body_number",
  "license_number",
  "service_number",
  "model",
  "caliber",
  "duration",
]);

const NON_NUMERIC_ONLY_FIELD_LABELS = {
  first_name: "نام",
  last_name: "نام خانوادگی",
  father_name: "نام پدر",
  previous_last_name: "نام خانوادگی قبلی",
  alias_first_name: "نام مستعار",
  alias_last_name: "نام خانوادگی مستعار",
  first_name_child: "نام",
  last_name_child: "نام خانوادگی",
  relative_first_name: "نام شخص",
  relative_last_name: "نام خانوادگی شخص",
  friend_first_name: "نام دوست",
  friend_last_name: "نام خانوادگی دوست",
  occupation: "شغل",
  relation_to_applicant: "نسبت با متقاضی",
  move_reason: "علت جابه‌جایی",
  details: "متن توضیحات تکمیلی",
  nationality: "تابعیت",
  religion: "دین",
  sect: "مذهب",
  physical_status: "وضعیت جسمانی",
  disease_description: "شرح بیماری",
  disability_description: "شرح معلولیت",
  distinguishing_marks: "علائم مشخصه",
  birth_certificate_issue_location: "محل صدور شناسنامه",
  current_address_line: "نشانی محل سکونت",
  address_line: "نشانی",
  address: "نشانی",
  spouse_family_residence_address: "نشانی محل سکونت خانواده همسر",
  custom_label: "نام شبکه اجتماعی یا پیام‌رسان",
  owner_name: "نام مالک",
  organization_name: "نام سازمان یا محل کار",
  unit_name: "یگان خدمتی",
  manager_name: "نام مسئول",
  day_manager_name: "نام مسئول روز",
  night_manager_name: "نام مسئول شب",
  name: "نام محل",
  country_name: "نام کشور",
  entity_name: "نام فرد یا مؤسسه",
  contact_type: "نوع ارتباط",
  reason: "علت یا توضیحات",
  result: "نتیجه",
  notes: "توضیحات",
  current_status: "وضعیت فعلی",
  rejection_reason: "علت عدم پذیرش",
  responsibility: "مسئولیت یا نوع فعالیت",
  motivation: "علت یا انگیزه فعالیت",
  acquaintance_method: "نحوه آشنایی",
  use_reason: "علت استفاده",
  statement_text: "متن تعهدنامه",
};

function isNumericOnlyText(value) {
  if (typeof value !== "string" && typeof value !== "number") return false;
  const normalized = normalizeDigits(String(value)).trim();
  if (!normalized) return false;

  // Ignore common numeric formatting characters, but preserve any real letter.
  const compact = normalized.replace(/[\s.,،٬٫\/\\()+-]/g, "");
  return compact.length > 0 && /^\d+$/.test(compact);
}

function validateNonNumericTextFields(value, path, add) {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      validateNonNumericTextFields(item, path ? path + "." + index : String(index), add);
    });
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    const fieldPath = path ? path + "." + key : key;
    const label = NON_NUMERIC_ONLY_FIELD_LABELS[key];
    if (label && isNumericOnlyText(item)) {
      add(fieldPath, "«" + label + "» نمی‌تواند فقط عدد باشد؛ لطفاً متن معتبر وارد کنید.");
    }
    validateNonNumericTextFields(item, fieldPath, add);
  }
}

export function cleanPayload(value, key = "") {
  if (Array.isArray(value)) return value.map((entry) => cleanPayload(entry, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entry]) => [entryKey, cleanPayload(entry, entryKey)])
    );
  }

  if (value === "") return null;
  if (DATE_FIELD_PATTERN.test(key) && typeof value === "string" && value.includes("/")) {
    return jalaliToGregorianString(value);
  }
  return value;
}

function hydrateDateValue(value) {
  if (typeof value !== "string") return value;
  if (/^\\d{4}-\\d{1,2}-\\d{1,2}/.test(value.trim())) return gregorianToJalaliString(value);
  return value;
}

function hydrateDateFields(value, key = "") {
  if (Array.isArray(value)) return value.map((entry) => hydrateDateFields(entry, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entry]) => [entryKey, hydrateDateFields(entry, entryKey)])
    );
  }
  return DATE_FIELD_PATTERN.test(key) ? hydrateDateValue(value) : value;
}

export function sanitizeMarriageForm(value) {
  const marriages = Array.isArray(value?.marriages) ? value.marriages : [];
  return {
    marriages: marriages.map((entry) => {
      const next = {
        ...entry,
        spouse: { ...(entry?.spouse || {}) },
      };
      if (next.status === "current") {
        next.end_date = "";
        next.end_reason = "";
      }
      return next;
    }),
  };
}

export function cleanMarriagePayload(value) {
  const sanitized = sanitizeMarriageForm(value || {});
  return cleanPayload(sanitized);
}

export function cleanLegalIncidentPayload(value) {
  const records = Array.isArray(value?.records) ? value.records : [];
  return cleanPayload({
    ...value,
    records: records.map((record) => {
      const next = { ...record };
      delete next.person_role;
      return next;
    }),
  });
}

export function sanitizeMilitaryForm(value) {
  const next = { ...(value || {}) };

  if (next.status === "completed_service") {
    next.exemption_type = "";
    next.booklet_status = "";
    next.absence_status = "";
    next.conscription_date = "";
  } else if (next.status === "exempt") {
    next.organization_name = "";
    next.unit_name = "";
    next.start_date = "";
    next.end_date = "";
    next.service_city_id = "";
    next.service_province_id = "";
    next.booklet_status = "";
    next.absence_status = "";
    next.conscription_date = "";
  } else if (next.status === "subject") {
    next.organization_name = "";
    next.unit_name = "";
    next.start_date = "";
    next.end_date = "";
    next.service_city_id = "";
    next.service_province_id = "";
    next.exemption_type = "";
    if (next.booklet_status !== "has_booklet") next.conscription_date = "";
  } else {
    next.organization_name = "";
    next.unit_name = "";
    next.start_date = "";
    next.end_date = "";
    next.service_city_id = "";
    next.service_province_id = "";
    next.exemption_type = "";
    next.booklet_status = "";
    next.absence_status = "";
    next.conscription_date = "";
  }

  return next;
}

export function cleanMilitaryPayload(value) {
  const cleaned = cleanPayload(sanitizeMilitaryForm(value || {}));
  delete cleaned.service_province_id;
  return cleaned;
}

export function mergeDraft(base, draft, stepKey) {
  const hydratedBase = hydrateDateFields(base);
  const hydratedDraft = draft && typeof draft === "object" ? hydrateDateFields(draft) : null;
  const socialRole = SOCIAL_STEP_ROLES[stepKey];
  if (stepKey === "family" || stepKey === "social_relations" || socialRole) {
    const isFamily = stepKey === "family";
    const sourcePeople = normalizeList(hydratedDraft?.people ?? hydratedBase?.people)
      .filter((person) => personBelongsToSocialStep(person, stepKey));
    const people = sourcePeople.map((person) => {
      const nextPerson = { ...(person || {}) };
      delete nextPerson.contacts;
      if (isFamily) {
        delete nextPerson.relation_to_applicant;
        delete nextPerson.father_name;
        delete nextPerson.gender;
        delete nextPerson.national_id;
      }
      nextPerson.addresses = normalizeList(person?.addresses).map((address) => {
        const nextAddress = { ...(address || {}) };
        delete nextAddress.country_id;
        delete nextAddress.postal_code;
        delete nextAddress.from_date;
        delete nextAddress.to_date;
        if (nextAddress.address_type === "FAMILY") nextAddress.address_type = "CURRENT";
        return nextAddress;
      });
      return nextPerson;
    });
    return { ...(hydratedBase || {}), ...(hydratedDraft || {}), people };
  }
  if (!hydratedDraft) return hydratedBase;
  if (Array.isArray(hydratedBase)) return Array.isArray(hydratedDraft) ? hydratedDraft : hydratedBase;

  if (stepKey === "weapons" && Array.isArray(hydratedDraft.records)) {
    const records = hydratedDraft.records.map((record) => {
      const next = { ...(record || {}) };
      // Upgrade drafts created before manufacturer country became free text.
      if (!next.manufacturer_country_name && next.manufacturer_country_id !== undefined && next.manufacturer_country_id !== null) {
        next.manufacturer_country_name = String(next.manufacturer_country_id);
      }
      delete next.manufacturer_country_id;
      return next;
    });
    return { ...(hydratedBase || {}), ...hydratedDraft, records };
  }

  if (stepKey === "veteran" && Array.isArray(hydratedDraft.records)) {
    const records = hydratedDraft.records.map((record) => {
      const next = { ...(record || {}) };
      // Older UI versions exposed SPOUSE, while the API models spouse as a relative.
      if (next.beneficiary_type === "SPOUSE") {
        next.beneficiary_type = "RELATIVE";
        next.relative_relation = next.relative_relation || "همسر";
      }
      return next;
    });
    return { ...(hydratedBase || {}), ...hydratedDraft, records };
  }

  if (["affiliations", "foreign_company_relations", "embassy_relations", "exit_restrictions"].includes(stepKey) && Array.isArray(hydratedDraft.records)) {
    const records = hydratedDraft.records.map((record) => {
      const next = { ...(record || {}) };
      // Upgrade drafts created by older frontend builds.
      if (!next.beneficiary_type && next.person_role) {
        next.beneficiary_type = next.person_role;
      }
      delete next.person_role;

      if (["foreign_company_relations", "embassy_relations"].includes(stepKey)) {
        // Preserve legacy drafts that stored a selected country ID.
        if (!next.country_name && next.country_id !== undefined && next.country_id !== null) {
          next.country_name = String(next.country_id);
        }
        delete next.country_id;
        if (stepKey === "foreign_company_relations") delete next.dependent_country_id;
      }
      return next;
    });
    return { ...(hydratedBase || {}), ...hydratedDraft, records };
  }

  return { ...(hydratedBase || {}), ...hydratedDraft };
}

const SPOUSE_DEPENDENT_BENEFICIARY_STEPS = new Set([
  "veteran",
  "travel",
  "legal_incidents",
  "migration",
  "affiliations",
  "addiction",
  "foreign_company_relations",
  "embassy_relations",
  "exit_restrictions",
]);

export function validateStep(stepKey, form, hasSpouse = false) {
  const empty = (value) => value === undefined || value === null || String(value).trim() === "";
  const errors = {};
  const add = (path, message) => {
    if (!errors[path]) errors[path] = message;
  };

  if (!hasSpouse && SPOUSE_DEPENDENT_BENEFICIARY_STEPS.has(stepKey)) {
    const records = Array.isArray(form?.records) ? form.records : [];
    for (let i = 0; i < records.length; i += 1) {
      if (["SPOUSE", "SPOUSE_RELATIVE"].includes(records[i]?.beneficiary_type)) {
        add(
          "records." + i + ".beneficiary_type",
          "برای ثبت سابقه مربوط به همسر یا بستگان همسر، ابتدا مشخصات همسر را در بخش «سوابق ازدواج» ثبت کنید.",
        );
      }
    }
  }

  if (stepKey === "personal") {
    if (empty(form?.first_name)) add("first_name", "نام را وارد کنید.");
    if (empty(form?.last_name)) add("last_name", "نام خانوادگی را وارد کنید.");
    if (!["مرد", "زن"].includes(String(form?.gender || ""))) add("gender", "جنسیت را انتخاب کنید.");
    if (!["single", "married"].includes(String(form?.marital_status || ""))) add("marital_status", "وضعیت تأهل را انتخاب کنید.");
    const nid = normalizeDigits(String(form?.national_id || "")).replace(/[-\s]/g, "");
    if (!/^\d{10}$/.test(nid)) add("national_id", "کد ملی باید ۱۰ رقم باشد.");
    for (const [key, label, maximum] of [
      ["weight_kg", "وزن", 500],
      ["height_cm", "قد", 300],
    ]) {
      const value = form?.[key];
      if (!empty(value)) {
        const normalized = normalizeDigits(String(value)).trim();
        if (!/^\d+(?:\.\d+)?$/.test(normalized)) add(key, `${label} باید عددی باشد.`);
        else if (Number(normalized) < 0 || Number(normalized) > maximum) add(key, `${label} باید بین ۰ و ${maximum} باشد.`);
      }
    }
    if (!empty(form?.blood_type) && !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(String(form.blood_type))) {
      add("blood_type", "گروه خونی را از فهرست انتخاب کنید.");
    }
    if (form?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) add("email", "ایمیل واردشده معتبر نیست.");

    if (!form?.current_address || empty(form.current_address.address_line)) {
      add("current_address.address_line", "آدرس محل سکونت را وارد کنید.");
    }
    if (!form?.current_address || empty(form.current_address.country_id)) {
      add("current_address.country_id", "کشور محل سکونت را انتخاب کنید.");
    }
    if (!form?.current_address || empty(form.current_address.province_id)) {
      add("current_address.province_id", "استان محل سکونت را انتخاب کنید.");
    }
    if (!form?.current_address || empty(form.current_address.city_id)) {
      add("current_address.city_id", "شهر محل سکونت را انتخاب کنید.");
    }

    const socialNetworkLabels = {
      Twitter: "توییتر",
      Instagram: "اینستاگرام",
      Telegram: "تلگرام",
      Eitaa: "ایتا",
      Bale: "بله",
      OTHER_SOCIAL: "سایر شبکه‌های اجتماعی",
    };
    if (!empty(form?.current_address?.postal_code)) {
      const postalCode = normalizeDigits(String(form.current_address.postal_code));
      if (!/^\d{10}$/.test(postalCode)) add("current_address.postal_code", "کد پستی باید دقیقاً ۱۰ رقم باشد.");
    }
    if (!empty(form?.current_address?.phone)) {
      const phone = normalizeDigits(String(form.current_address.phone));
      if (!/^\d{11}$/.test(phone)) add("current_address.phone", "تلفن باید دقیقاً ۱۱ رقم باشد؛ نمونه: 02112345678.");
    }

    const contacts = Array.isArray(form?.contacts) ? form.contacts : [];
    const hasMobile = contacts.some((contact) => (
      contact?.contact_type === "موبایل" && !empty(contact?.value)
    ));
    const hasLandline = contacts.some((contact) => (
      contact?.contact_type === "تلفن ثابت" && !empty(contact?.value)
    ));
    if (!hasMobile) {
      add("contacts.mobile", "ثبت حداقل یک شماره موبایل الزامی است.");
    }
    if (!hasLandline) {
      add("contacts.landline", "ثبت حداقل یک شماره تلفن ثابت الزامی است.");
    }

    for (let i = 0; i < contacts.length; i += 1) {
      const contact = contacts[i];
      const prefix = "contacts." + i;
      const isSocialNetwork = Boolean(socialNetworkLabels[contact?.contact_type]);
      const allowedContactTypes = ["موبایل", "تلفن ثابت"];
      if (!isSocialNetwork && !allowedContactTypes.includes(contact?.contact_type)) {
        add(prefix + ".contact_type", "نوع تماس را از فهرست انتخاب کنید.");
      }
      if (contact?.contact_type === "OTHER_SOCIAL") {
        if (empty(contact?.custom_label)) add(prefix + ".custom_label", "نام شبکه اجتماعی یا پیام‌رسان را وارد کنید.");
        if (empty(contact?.value)) add(prefix + ".value", "شناسه اکانت را وارد کنید.");
      } else if (isSocialNetwork) {
        if (!empty(contact?.value) && String(contact.value).trim().length > 500) {
          add(prefix + ".value", "شناسه اکانت بیش از حد مجاز است.");
        }
      } else if (empty(contact?.value)) {
        add(prefix + ".value", "شماره تماس را وارد کنید.");
      } else {
        const phone = normalizeDigits(String(contact.value)).replace(/\s+/g, "");
        if (contact?.contact_type === "موبایل" && !/^09\d{9}$/.test(phone)) {
          add(prefix + ".value", "شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.");
        } else if (contact?.contact_type === "تلفن ثابت" && !/^\d{11}$/.test(phone)) {
          add(prefix + ".value", "تلفن ثابت باید دقیقاً ۱۱ رقم باشد؛ نمونه: 02112345678.");
        }
      }
      if (empty(contact?.owner_type)) add(prefix + ".owner_type", "نوع مالکیت را انتخاب کنید.");
      if (contact?.owner_type === "OPERATOR" && empty(contact?.owner_name)) {
        add(prefix + ".owner_name", "نام مالک را وارد کنید.");
      }
    }
  }

  if (stepKey === "addiction") {
    const records = Array.isArray(form?.records) ? form.records : [];
    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];
      const prefix = "records." + i;
      if (empty(record?.beneficiary_type)) {
        add(prefix + ".beneficiary_type", "مشخص کنید این سابقه اعتیاد مربوط به چه کسی است.");
      }
      if (record?.beneficiary_type === "RELATIVE") {
        if (empty(record?.relative_relation)) add(prefix + ".relative_relation", "نسبت با متقاضی را انتخاب کنید.");
        if (empty(record?.relative_first_name)) add(prefix + ".relative_first_name", "نام شخص را وارد کنید.");
        if (empty(record?.relative_last_name)) add(prefix + ".relative_last_name", "نام خانوادگی شخص را وارد کنید.");
      }
      if (record?.start_date && record?.end_date && record.end_date < record.start_date) {
        add(prefix + ".end_date", "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.");
      }
    }
  }

  if (stepKey === "legal_incidents") {
    const records = Array.isArray(form?.records) ? form.records : [];
    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];
      const prefix = "records." + i;
      if (empty(record?.beneficiary_type)) add(prefix + ".beneficiary_type", "مشخص کنید این سابقه قضایی و انتظامی مربوط به چه کسی است.");
      if (record?.beneficiary_type === "RELATIVE") {
        if (empty(record?.relative_relation)) add(prefix + ".relative_relation", "نسبت با متقاضی را انتخاب کنید.");
        if (empty(record?.relative_first_name)) add(prefix + ".relative_first_name", "نام شخص را وارد کنید.");
        if (empty(record?.relative_last_name)) add(prefix + ".relative_last_name", "نام خانوادگی شخص را وارد کنید.");
      }
    }
  }

  if (stepKey === "marriage") {
    const marriages = Array.isArray(form?.marriages) ? form.marriages : [];
    for (let i = 0; i < marriages.length; i += 1) {
      const marriage = marriages[i];
      const prefix = "marriages." + i;
      if (empty(marriage?.status)) add(prefix + ".status", "وضعیت این ازدواج را انتخاب کنید.");
      if (empty(marriage?.spouse?.first_name)) add(prefix + ".spouse.first_name", "نام همسر را وارد کنید.");
      if (empty(marriage?.spouse?.last_name)) add(prefix + ".spouse.last_name", "نام خانوادگی همسر را وارد کنید.");
      if (!empty(marriage?.spouse?.national_id) && !/^\d{10}$/.test(normalizeDigits(String(marriage.spouse.national_id)))) {
        add(prefix + ".spouse.national_id", "کد ملی همسر باید ۱۰ رقم باشد.");
      }
      if (empty(marriage?.marriage_date)) add(prefix + ".marriage_date", "تاریخ ازدواج را وارد کنید.");

      if (empty(marriage?.spouse?.physical_status)) add(prefix + ".spouse.physical_status", "وضعیت جسمانی همسر را انتخاب کنید.");
      if (marriage?.spouse?.physical_status === "بیمار" && empty(marriage?.spouse?.disease_description)) {
        add(prefix + ".spouse.disease_description", "توضیحات بیماری همسر را وارد کنید.");
      }
      if (marriage?.status === "ended") {
        if (empty(marriage?.end_date)) add(prefix + ".end_date", "تاریخ پایان ازدواج را وارد کنید.");
        if (empty(marriage?.end_reason)) add(prefix + ".end_reason", "علت پایان ازدواج را انتخاب کنید.");
        if (marriage?.marriage_date && marriage?.end_date && marriage.end_date < marriage.marriage_date) {
          add(prefix + ".end_date", "تاریخ پایان ازدواج نمی‌تواند قبل از تاریخ ازدواج باشد.");
        }
      }
    }
  }

  if (stepKey === "passport") {
    const records = Array.isArray(form?.records) ? form.records : [];
    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];
      const prefix = "records." + i;
      if (record?.issue_date && record?.expiry_date && record.expiry_date < record.issue_date) {
        add(prefix + ".expiry_date", "مدت اعتبار نمی‌تواند قبل از تاریخ صدور باشد.");
      }
    }
  }

  if (stepKey === "declaration" && !form?.accepted) add("accepted", "برای ثبت نهایی باید تعهدنامه را تأیید کنید.");

  if (stepKey === "military") {
    const status = form?.status;
    if (empty(status)) {
      add("status", "وضعیت نظام‌وظیفه را انتخاب کنید.");
    } else if (status === "completed_service") {
      if (empty(form?.organization_name)) add("organization_name", "سازمان خدمتی را وارد کنید.");
      if (empty(form?.unit_name)) add("unit_name", "یگان خدمتی را وارد کنید.");
      if (empty(form?.start_date)) add("start_date", "تاریخ شروع خدمت را وارد کنید.");
      if (empty(form?.end_date)) add("end_date", "تاریخ پایان خدمت را وارد کنید.");
      if (empty(form?.service_city_id)) add("service_city_id", "شهر محل خدمت را انتخاب کنید.");
      if (form?.start_date && form?.end_date && form.end_date < form.start_date) {
        add("end_date", "تاریخ پایان خدمت نمی‌تواند قبل از تاریخ شروع خدمت باشد.");
      }
    } else if (status === "exempt") {
      if (empty(form?.exemption_type)) add("exemption_type", "نوع معافیت را انتخاب کنید.");
    } else if (status === "subject") {
      if (empty(form?.booklet_status)) add("booklet_status", "وضعیت دفترچه را انتخاب کنید.");
      if (empty(form?.absence_status)) add("absence_status", "وضعیت غیبت را انتخاب کنید.");
      if (form?.booklet_status === "no_booklet" && !empty(form?.conscription_date)) {
        add("conscription_date", "تاریخ اعزام بدون داشتن دفترچه معتبر نیست.");
      }
    }
  }

  if (stepKey === "veteran") {
    const records = Array.isArray(form?.records) ? form.records : [];
    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];
      const prefix = "records." + i;
      if (empty(record?.beneficiary_type)) {
        add(prefix + ".beneficiary_type", "مشخص کنید این سابقه ایثارگری مربوط به چه کسی است.");
      }
      if (empty(record?.veteran_type)) {
        add(prefix + ".veteran_type", "نوع ایثارگری را وارد کنید.");
      }
      if (record?.beneficiary_type === "RELATIVE") {
        if (empty(record?.relative_relation)) add(prefix + ".relative_relation", "نسبت با متقاضی را انتخاب کنید.");
        if (empty(record?.relative_first_name)) add(prefix + ".relative_first_name", "نام شخص ایثارگر را وارد کنید.");
        if (empty(record?.relative_last_name)) add(prefix + ".relative_last_name", "نام خانوادگی شخص ایثارگر را وارد کنید.");
      }
    }
  }

  if (stepKey === "travel") {
    const records = Array.isArray(form?.records) ? form.records : [];
    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];
      const prefix = "records." + i;
      if (empty(record?.beneficiary_type)) add(prefix + ".beneficiary_type", "مشخص کنید این سابقه مربوط به چه کسی است.");
      if (record?.beneficiary_type === "RELATIVE") {
        if (empty(record?.relative_relation)) add(prefix + ".relative_relation", "نسبت با متقاضی را انتخاب کنید.");
        if (empty(record?.relative_first_name)) add(prefix + ".relative_first_name", "نام شخص را وارد کنید.");
        if (empty(record?.relative_last_name)) add(prefix + ".relative_last_name", "نام خانوادگی شخص را وارد کنید.");
      }
      if (empty(record?.country_name)) add(prefix + ".country_name", "کشور خارجی را وارد کنید.");
      if (empty(record?.travel_type)) add(prefix + ".travel_type", "نوع مسافرت / اقامت را وارد کنید.");
      if (record?.start_date && record?.end_date && record.end_date < record.start_date) {
        add(prefix + ".end_date", "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.");
      }
    }
  }

  if (stepKey === "accommodation") {
    const records = Array.isArray(form?.records) ? form.records : [];
    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];
      const prefix = "records." + i;
      if (empty(record?.name)) add(prefix + ".name", "نام خوابگاه یا پانسیون را وارد کنید.");
      if (empty(record?.start_date)) add(prefix + ".start_date", "تاریخ شروع اسکان را وارد کنید.");
      if (record?.start_date && record?.end_date && record.end_date < record.start_date) {
        add(prefix + ".end_date", "تاریخ پایان اسکان نمی‌تواند قبل از تاریخ شروع باشد.");
      }
    }
  }

  const socialRole = SOCIAL_STEP_ROLES[stepKey];
  const isLegacySocialStep = stepKey === "social_relations";
  if (stepKey === "family" || isLegacySocialStep || socialRole) {
    const people = Array.isArray(form?.people) ? form.people : [];
    for (let i = 0; i < people.length; i += 1) {
      const person = people[i];
      if (empty(person.first_name)) add("people." + i + ".first_name", "نام را وارد کنید.");
      if (empty(person.last_name)) add("people." + i + ".last_name", "نام خانوادگی را وارد کنید.");
      for (let addressIndex = 0; addressIndex < (person.addresses || []).length; addressIndex += 1) {
        const address = person.addresses[addressIndex];
        if (!empty(address.phone) && !/^\d{11}$/.test(normalizeDigits(String(address.phone)))) {
          add("people." + i + ".addresses." + addressIndex + ".phone", "تلفن باید دقیقاً ۱۱ رقم باشد؛ نمونه: 02112345678.");
        }
      }
    }

    if (isLegacySocialStep) {
      for (const [role, requirement] of Object.entries(SOCIAL_GROUP_REQUIREMENTS)) {
        const count = people.filter((person) => person.role_type === role
          || (role === "FRIEND" && person.role_type === "MILITARY_RELATIVE")).length;
        if (count < requirement.count) add("people.requirements." + role, requirement.message);
      }
    } else if (socialRole) {
      const requirement = SOCIAL_GROUP_REQUIREMENTS[socialRole];
      if (requirement) {
        const count = people.filter((person) => person.role_type === socialRole
          || (socialRole === "FRIEND" && person.role_type === "MILITARY_RELATIVE")).length;
        if (count < requirement.count) add("people.requirements." + socialRole, requirement.message);
      }
    }

    if (isLegacySocialStep) {
      const normalizedName = (person) => [person?.first_name, person?.last_name]
        .map((value) => normalizeDigits(String(value || ""))
          .normalize("NFKC")
          .replace(/[يىك]/g, (character) => ({ ي: "ی", ى: "ی", ك: "ک" })[character])
          .trim()
          .replace(/\s+/g, " ")
          .toLocaleLowerCase("fa"))
        .join(" ");
      const seenNames = new Map();
      people.forEach((person, index) => {
        const fullName = normalizedName(person);
        if (!fullName.trim()) return;
        if (seenNames.has(fullName)) {
          add("people." + index + ".first_name", "این فرد قبلاً در یکی از گروه‌ها ثبت شده است؛ از ثبت تکراری نام خودداری کنید.");
        } else {
          seenNames.set(fullName, index);
        }
      });
    }
  }

  if (stepKey === "residence") {
    for (let i = 0; i < (form?.addresses || []).length; i += 1) {
      const address = form.addresses[i];
      if (empty(address.country_id)) add("addresses." + i + ".country_id", "کشور را انتخاب کنید.");
      if (empty(address.province_id)) add("addresses." + i + ".province_id", "استان را انتخاب کنید.");
      if (empty(address.city_id)) add("addresses." + i + ".city_id", "شهر را انتخاب کنید.");
      if (empty(address.address_line)) add("addresses." + i + ".address_line", "آدرس دقیق را وارد کنید.");
      if (!empty(address.postal_code) && !/^\d{10}$/.test(normalizeDigits(String(address.postal_code)))) {
        add("addresses." + i + ".postal_code", "کد پستی باید دقیقاً ۱۰ رقم باشد.");
      }
      if (!empty(address.phone) && !/^\d{11}$/.test(normalizeDigits(String(address.phone)))) {
        add("addresses." + i + ".phone", "تلفن باید دقیقاً ۱۱ رقم باشد؛ نمونه: 02112345678.");
      }
    }
  }

  const fields = RECORDS[stepKey];
  if (fields && Array.isArray(form?.records)) {
    for (let i = 0; i < form.records.length; i += 1) {
      for (const field of fields) {
        const value = form.records[i]?.[field.key];
        const path = "records." + i + "." + field.key;
        if (field.required && !(field.visibleWhen && !field.visibleWhen(form.records[i])) && empty(value)) {
          add(path, "«" + field.label + "» در این ردیف الزامی است.");
          continue;
        }
        if (empty(value) || (field.visibleWhen && !field.visibleWhen(form.records[i]))) continue;
        if (field.type === "phone") {
          if (!/^\d{11}$/.test(normalizeDigits(String(value)))) {
            add(path, "تلفن باید دقیقاً ۱۱ رقم باشد؛ نمونه: 02112345678.");
          }
        } else if (field.type === "number") {
          const normalized = normalizeDigits(String(value)).trim();
          if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
            add(path, "فقط عدد معتبر وارد کنید.");
          } else {
            const numeric = Number(normalized);
            if (field.min !== undefined && numeric < field.min) add(path, "مقدار نباید کمتر از " + field.min + " باشد.");
            if (field.max !== undefined && numeric > field.max) add(path, "مقدار نباید بیشتر از " + field.max + " باشد.");
          }
        } else if (
          (field.type === "text" || field.type === "textarea") &&
          !NUMERIC_ONLY_TEXT_ALLOWED_KEYS.has(field.key) &&
          isNumericOnlyText(value)
        ) {
          add(path, "«" + field.label + "» نمی‌تواند فقط عدد باشد؛ لطفاً متن معتبر وارد کنید.");
        }
      }
    }
  }

  validateNonNumericTextFields(form, "", add);

  return errors;
}

export function updatePersonField(item, key, value, setItem) {
  setItem({ ...item, [key]: value });
}

export function makeForm(stepKey, data, user) {
  if (stepKey === "personal") {
    const person = data?.person || {};
    const profile = data?.profile || {};
    return {
      first_name: person.first_name || "",
      last_name: person.last_name || "",
      father_name: person.father_name || "",
      national_id: person.national_id || user?.national_id || "",
      birth_date: person.birth_date || "",
      gender: person.gender || "",
      marital_status: profile.marital_status || "",
      previous_last_name: profile.previous_last_name || "",
      alias_first_name: profile.alias_first_name || "",
      alias_last_name: profile.alias_last_name || "",
      birth_certificate_no: profile.birth_certificate_no || "",
      birth_certificate_issue_location: profile.birth_certificate_issue_location || "",
      birth_country_id: profile.birth_country_id || "",
      birth_province_id: profile.birth_province_id || "",
      birth_city_id: profile.birth_city_id || "",
      nationality: person.nationality || "",
      religion: person.religion || "",
      sect: person.sect || "",
      physical_status: profile.physical_status || "",
      disease_description: profile.disease_description || "",
      disability_description: profile.disability_description || "",
      weight_kg: profile.weight_kg || "",
      height_cm: profile.height_cm || "",
      blood_type: profile.blood_type || "",
      distinguishing_marks: profile.distinguishing_marks || "",
      email: profile.email || "",
      contacts: normalizeList(data?.contacts).map((contact) => {
        const next = { ...contact };
        delete next.is_primary;
        return next;
      }),
      current_address: {
        country_id: profile.current_country_id || data?.current_address?.country_id || "",
        province_id: profile.current_province_id || data?.current_address?.province_id || "",
        city_id: profile.current_city_id || data?.current_address?.city_id || "",
        address_line: profile.current_address_line || data?.current_address?.address_line || "",
        postal_code: profile.current_postal_code || data?.current_address?.postal_code || "",
        phone: profile.current_address_phone || data?.current_address?.phone || "",
      },
    };
  }
  if (stepKey === "marriage") {
    return {
      marriages: normalizeList(data?.marriages).map((item) => ({
        id: item.id || "",
        status: item.status || "current",
        marriage_date: item.marriage_date || "",
        end_date: item.end_date || "",
        end_reason: item.end_reason || "",
        spouse: {
          first_name: item.spouse?.first_name || "",
          last_name: item.spouse?.last_name || "",
          father_name: item.spouse?.father_name || "",
          national_id: item.spouse?.national_id || "",
          birth_date: item.spouse?.birth_date || "",
          gender: item.spouse?.gender || "",
          occupation: item.spouse?.occupation || "",
          education: item.spouse?.education || "",
          physical_status: item.spouse?.physical_status || "",
          disease_description: item.spouse?.disease_description || "",
        },
        spouse_family_residence_address: item.spouse_family_residence_address || "",
      })),
    };
  }
  const socialRole = SOCIAL_STEP_ROLES[stepKey];
  if (stepKey === "family" || stepKey === "social_relations" || socialRole) {
    const isFamily = stepKey === "family";
    const people = normalizeList(data?.people)
      .filter((person) => personBelongsToSocialStep(person, stepKey))
      .map((person) => {
        const nextPerson = { ...(person || {}) };
        delete nextPerson.contacts;
        if (isFamily) {
          delete nextPerson.relation_to_applicant;
          delete nextPerson.father_name;
          delete nextPerson.gender;
          delete nextPerson.national_id;
        }
        nextPerson.addresses = normalizeList(person?.addresses).map((address) => {
          const nextAddress = { ...(address || {}) };
          delete nextAddress.country_id;
          delete nextAddress.postal_code;
          delete nextAddress.from_date;
          delete nextAddress.to_date;
          if (nextAddress.address_type === "FAMILY") nextAddress.address_type = "CURRENT";
          return nextAddress;
        });
        return nextPerson;
      });
    return { people };
  }
  if (stepKey === "residence") return { addresses: normalizeList(data?.addresses) };
  if (stepKey === "additional") return { details: data?.record?.details || "" };
  if (stepKey === "declaration") return { accepted: Boolean(data?.record?.accepted), declaration_version: data?.record?.declaration_version || "1" };
  if (stepKey === "military") {
    const record = data?.record || {};
    return {
      status: record.status || "",
      organization_name: record.organization_name || "",
      unit_name: record.unit_name || "",
      start_date: record.start_date || "",
      end_date: record.end_date || "",
      service_city_id: record.service_city_id || "",
      service_province_id: record.service_province_id || "",
      exemption_type: record.exemption_type || "",
      booklet_status: record.booklet_status || "",
      absence_status: record.absence_status || "",
      conscription_date: record.conscription_date || "",
    };
  }
  if (stepKey === "veteran") {
    return {
      records: normalizeList(data?.records).map((record) => hydrateDateFields(record)).map((record) => ({
        ...record,
        beneficiary_type: record.beneficiary_type || "APPLICANT",
        relative_relation: record.relative_relation || "",
        relative_first_name: record.relative_first_name || "",
        relative_last_name: record.relative_last_name || "",
      })),
    };
  }
  if (["embassy_relations", "exit_restrictions"].includes(stepKey)) {
    return {
      records: normalizeList(data?.records).map((record) => {
        const next = hydrateDateFields(record);
        return {
          ...next,
          beneficiary_type: next.beneficiary_type || next.person_role || "APPLICANT",
          relative_relation: next.relative_relation || "",
          relative_first_name: next.relative_first_name || "",
          relative_last_name: next.relative_last_name || "",
          friend_first_name: next.friend_first_name || "",
          friend_last_name: next.friend_last_name || "",
        };
      }),
    };
  }

  if (stepKey === "travel") {
    return {
      records: normalizeList(data?.records).map((record) => hydrateDateFields(record)).map((record) => ({
        ...record,
        beneficiary_type: record.beneficiary_type || "APPLICANT",
        relative_relation: record.relative_relation || "",
        relative_first_name: record.relative_first_name || "",
        relative_last_name: record.relative_last_name || "",
        country_name: record.country_name || "",
        travel_type: record.travel_type || "",
        duration: record.duration || "",
        exit_border: record.exit_border || "",
        passport_number: record.passport_number || "",
        reason: record.reason || "",
        transport_type: record.transport_type || "",
        stay_type: record.stay_type || "",
        stay_place: record.stay_place || "",
      })),
    };
  }
  if (stepKey === "legal_incidents") {
    return {
      records: normalizeList(data?.records).map((record) => hydrateDateFields(record)).map((record) => ({
        ...record,
        beneficiary_type: record.beneficiary_type || "APPLICANT",
        relative_relation: record.relative_relation || "",
        relative_first_name: record.relative_first_name || "",
        relative_last_name: record.relative_last_name || "",
      })),
    };
  }
  if (RECORDS[stepKey]) return { records: normalizeList(data?.records).map((record) => hydrateDateFields(record)) };
  return {};
}
