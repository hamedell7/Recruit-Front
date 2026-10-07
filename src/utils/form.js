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
    const marriages = Array.isArray(form?.marriages) ? form.marriages : [];
    for (let i = 0; i < marriages.length; i += 1) {
      const marriage = marriages[i];
      const prefix = "marriages." + i;
      if (empty(marriage?.status)) add(prefix + ".status", "وضعیت این ازدواج را انتخاب کنید.");
      if (empty(marriage?.spouse?.first_name)) add(prefix + ".spouse.first_name", "نام همسر را وارد کنید.");
      if (empty(marriage?.spouse?.last_name)) add(prefix + ".spouse.last_name", "نام خانوادگی همسر را وارد کنید.");
      if (empty(marriage?.marriage_date)) add(prefix + ".marriage_date", "تاریخ ازدواج را وارد کنید.");

      if (marriage?.status === "ended") {
        if (empty(marriage?.end_date)) add(prefix + ".end_date", "تاریخ پایان ازدواج را وارد کنید.");
        if (empty(marriage?.end_reason)) add(prefix + ".end_reason", "علت پایان ازدواج را انتخاب کنید.");
        if (marriage?.marriage_date && marriage?.end_date && marriage.end_date < marriage.marriage_date) {
          add(prefix + ".end_date", "تاریخ پایان ازدواج نمی‌تواند قبل از تاریخ ازدواج باشد.");
        }
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
        },
        notes: item.notes || "",
      })),
    };
  }
  if (stepKey === "family" || stepKey === "social_relations") return { people: normalizeList(data?.people) };
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
  if (RECORDS[stepKey]) return { records: normalizeList(data?.records) };
  return {};
}
