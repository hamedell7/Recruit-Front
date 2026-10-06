import { RECORDS } from "../config/workflow";
import { normalizeList } from "./collections";

export function normalizeDigits(value) {
  return String(value || "")
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
}

export function cleanPayload(value) {
  if (Array.isArray(value)) return value.map(cleanPayload);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cleanPayload(entry)])
    );
  }
  return value === "" ? null : value;
}

export function mergeDraft(base, draft) {
  if (!draft || typeof draft !== "object") return base;
  if (Array.isArray(base)) return Array.isArray(draft) ? draft : base;
  return { ...(base || {}), ...draft };
}

export function validateStep(stepKey, form) {
  const empty = (value) => value === undefined || value === null || String(value).trim() === "";
  const errors = {};
  const add = (path, message) => {
    if (!errors[path]) errors[path] = message;
  };

  if (stepKey === "personal") {
    if (empty(form?.first_name)) add("first_name", "نام را وارد کنید.");
    if (empty(form?.last_name)) add("last_name", "نام خانوادگی را وارد کنید.");
    const nid = normalizeDigits(String(form?.national_id || "")).replace(/[-\s]/g, "");
    if (!/^\d{10}$/.test(nid)) add("national_id", "کد ملی باید ۱۰ رقم باشد.");
    if (form?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) add("email", "ایمیل واردشده معتبر نیست.");
  }

  if (stepKey === "marriage") {
    if (empty(form?.status)) add("status", "وضعیت تأهل را انتخاب کنید.");
    if (["متأهل", "ازدواج مجدد"].includes(form?.status)) {
      if (empty(form?.spouse?.first_name)) add("spouse.first_name", "نام همسر را وارد کنید.");
      if (empty(form?.spouse?.last_name)) add("spouse.last_name", "نام خانوادگی همسر را وارد کنید.");
    }
  }

  if (stepKey === "declaration" && !form?.accepted) add("accepted", "برای ثبت نهایی باید تعهدنامه را تأیید کنید.");

  if (stepKey === "family" || stepKey === "social_relations") {
    for (let i = 0; i < (form?.people || []).length; i += 1) {
      const person = form.people[i];
      if (empty(person.first_name)) add("people." + i + ".first_name", "نام را وارد کنید.");
      if (empty(person.last_name)) add("people." + i + ".last_name", "نام خانوادگی را وارد کنید.");
    }
  }

  if (stepKey === "residence") {
    for (let i = 0; i < (form?.addresses || []).length; i += 1) {
      const address = form.addresses[i];
      if (empty(address.country_id)) add("addresses." + i + ".country_id", "کشور را انتخاب کنید.");
      if (empty(address.address_line)) add("addresses." + i + ".address_line", "آدرس دقیق را وارد کنید.");
    }
  }

  const fields = RECORDS[stepKey];
  if (fields && Array.isArray(form?.records)) {
    for (let i = 0; i < form.records.length; i += 1) {
      for (const field of fields) {
        if (!field.required || (field.visibleWhen && !field.visibleWhen(form.records[i]))) continue;
        if (empty(form.records[i]?.[field.key])) add("records." + i + "." + field.key, "«" + field.label + "» در این ردیف الزامی است.");
      }
    }
  }

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
      previous_last_name: person.previous_last_name || "",
      birth_certificate_no: person.birth_certificate_no || "",
      birth_province_id: person.birth_province_id || "",
      birth_county_id: person.birth_county_id || "",
      birth_city_id: person.birth_city_id || "",
      birth_village_id: person.birth_village_id || "",
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
      contacts: normalizeList(data?.contacts),
      addresses: normalizeList(data?.addresses),
    };
  }
  if (stepKey === "marriage") return { ...(data?.record || {}), spouse: data?.spouse || null };
  if (stepKey === "family" || stepKey === "social_relations") return { people: normalizeList(data?.people) };
  if (stepKey === "residence") return { addresses: normalizeList(data?.addresses) };
  if (stepKey === "additional") return { details: data?.record?.details || "" };
  if (stepKey === "declaration") return { accepted: Boolean(data?.record?.accepted), declaration_version: data?.record?.declaration_version || "1" };
  if (RECORDS[stepKey]) return { records: normalizeList(data?.records) };
  return {};
}
