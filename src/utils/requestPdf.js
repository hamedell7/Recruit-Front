import { STEP_META, STATUS } from "../config/workflow";
import regularFont from "../assets/fonts/IRANYekanWebRegular.woff2?url";
import mediumFont from "../assets/fonts/IRANYekanWebMedium.woff2?url";
import boldFont from "../assets/fonts/IRANYekanWebBold.woff2?url";

const FIELD_LABELS = {
  person: "مشخصات فرد", profile: "اطلاعات تکمیلی فردی", contacts: "راه‌های تماس",
  current_address: "نشانی فعلی", addresses: "نشانی‌ها", marriages: "سوابق ازدواج",
  spouse: "مشخصات همسر", record: "اطلاعات ثبت‌شده", records: "سوابق ثبت‌شده",
  people: "اشخاص ثبت‌شده", relative: "مشخصات بستگان", declaration: "تعهدنامه",
  first_name: "نام", last_name: "نام خانوادگی", father_name: "نام پدر", mother_name: "نام مادر",
  national_id: "کد ملی", mobile: "شماره همراه", phone: "شماره تماس", telephone: "تلفن",
  birth_date: "تاریخ تولد", birth_place: "محل تولد", gender: "جنسیت", marital_status: "وضعیت تأهل",
  physical_status: "وضعیت جسمانی", disease_description: "شرح بیماری", alive_status: "وضعیت حیات",
  relation_to_applicant: "نسبت با متقاضی", role_type: "نقش در پرونده", education: "تحصیلات",
  occupation: "شغل", notes: "ملاحظات", description: "توضیحات", reason: "علت / دلیل",
  result: "نتیجه", status: "وضعیت", start_date: "تاریخ شروع", end_date: "تاریخ پایان",
  from_date: "از تاریخ", to_date: "تا تاریخ", date: "تاریخ", marriage_date: "تاریخ ازدواج",
  divorce_date: "تاریخ طلاق", termination_date: "تاریخ پایان", termination_reason: "علت پایان",
  issue_date: "تاریخ صدور", expiry_date: "تاریخ انقضا", registration_date: "تاریخ ثبت",
  occurrence_date: "تاریخ وقوع", screening_date: "تاریخ گزینش", submitted_at: "تاریخ ثبت نهایی",
  created_at: "تاریخ ایجاد", updated_at: "آخرین به‌روزرسانی", completed_at: "تاریخ تکمیل",
  country: "کشور", country_name: "کشور", province: "استان", province_name: "استان",
  city: "شهر", city_name: "شهر", county_name: "شهرستان", village_name: "روستا",
  address: "نشانی", address_line: "نشانی", postal_code: "کد پستی", current_address_line: "نشانی محل سکونت",
  phone_number: "شماره تلفن", email: "پست الکترونیکی", contact_type: "نوع تماس",
  contact_method: "روش ارتباط", value: "شماره / شناسه", owner_type: "نوع مالکیت",
  owner_name: "نام مالک", relation: "نسبت", person_role: "اطلاعات مربوط به",
  degree_level: "مقطع تحصیلی / سطح", institution_name: "نام دانشگاه / مرکز آموزشی",
  institution_type: "نوع مرکز آموزشی", field_of_study: "رشته / گرایش", gpa: "معدل",
  is_current: "وضعیت فعلی", organization_name: "نام سازمان / محل کار", membership_type: "نوع همکاری",
  position: "سمت و شغل", work_address: "نشانی محل کار", manager_name: "نام مسئول",
  manager_phone: "تلفن مسئول", work_phone: "تلفن محل کار", name: "نام",
  passport_type: "نوع گذرنامه", passport_number: "شماره گذرنامه", issue_location: "محل صدور",
  country_code: "کد کشور", entity_name: "نام فرد / مؤسسه", reason_for_contact: "علت ارتباط",
  contact_reason: "موضوع ارتباط", relationship_type: "نوع ارتباط", duration: "مدت",
  notes_text: "توضیحات", rejection_reason: "علت عدم پذیرش", address_phone: "تلفن نشانی",
  service_type: "نوع خدمت", service_status: "وضعیت خدمت", service_number: "شماره خدمت",
  exemption_type: "نوع معافیت", exemption_reason: "علت معافیت", absence_status: "وضعیت غیبت",
  service_start_date: "تاریخ شروع خدمت", service_end_date: "تاریخ پایان خدمت",
  book_number: "شماره دفترچه", booklet_status: "وضعیت دفترچه", absence_status: "وضعیت غیبت",
  conscription_date: "تاریخ اعزام", service_organization: "سازمان محل خدمت", service_unit: "یگان خدمتی",
  issuing_authority: "مرجع صادرکننده", veteran_type: "نوع ایثارگری", exemption_type: "نوع معافیت",
  beneficiary_type: "سابقه مربوط به", relative_relation: "نسبت با شخص", relative_first_name: "نام شخص",
  relative_last_name: "نام خانوادگی شخص", percentage: "درصد", location: "محل",
  travel_type: "نوع سفر / اقامت", exit_border: "مرز خروجی", transport_type: "نحوه سفر",
  stay_type: "نوع اقامت", country_name: "کشور", passport_number: "شماره گذرنامه",
  organization: "سازمان", court_name: "مرجع قضایی", case_number: "شماره پرونده قضایی",
  incident_type: "نوع واقعه", incident_date: "تاریخ واقعه", legal_status: "وضعیت قضایی",
  case_result: "نتیجه پرونده", migration_type: "نوع مهاجرت", residence_type: "نوع اقامت",
  return_date: "تاریخ بازگشت", destination_country: "کشور مقصد", affiliation_type: "نوع ارتباط / عضویت",
  group_name: "نام گروه / تشکل", role: "نقش", collaboration_type: "نوع همکاری",
  company_name: "نام شرکت", company_country: "کشور شرکت", embassy_name: "نام سفارتخانه / کنسولگری",
  restriction_type: "نوع ممنوعیت", authority: "مرجع صادرکننده", removal_date: "تاریخ رفع ممنوعیت",
  activity_type: "نوع فعالیت", activity_title: "عنوان فعالیت", weapon_type: "نوع سلاح",
  weapon_model: "مدل سلاح", license_number: "شماره مجوز", license_status: "وضعیت مجوز",
  relative_first_name: "نام فرد", relative_last_name: "نام خانوادگی فرد", siblings_count: "تعداد خواهر و برادر",
  spouse: "همسر", children_count: "تعداد فرزندان", father: "پدر", mother: "مادر",
  day_manager_name: "نام مسئول روز", day_manager_phone: "تلفن مسئول روز",
  night_manager_name: "نام مسئول شب", night_manager_phone: "تلفن مسئول شب",
  current_country_id: "کشور محل سکونت", current_country_name: "کشور محل سکونت", current_province_id: "استان محل سکونت",
  current_province_name: "استان محل سکونت", current_city_id: "شهر محل سکونت", current_city_name: "شهر محل سکونت",
  birth_country_id: "کشور محل تولد", birth_country_name: "کشور محل تولد",
  birth_province_id: "استان محل تولد", birth_province_name: "استان محل تولد", birth_city_id: "شهر محل تولد", birth_city_name: "شهر محل تولد",
  service_city_name: "شهر محل خدمت", service_province_name: "استان محل خدمت", county_name: "شهرستان", village_name: "روستا",
  current_postal_code: "کد پستی محل سکونت", current_address_phone: "تلفن محل سکونت",
  has_history: "دارای سابقه", current_spouse_count: "تعداد همسر فعلی",
  file_name: "نام فایل", filename: "نام فایل", document_type: "نوع مدرک",
  size_bytes: "حجم فایل", uploaded_at: "تاریخ بارگذاری", step_key: "مرحله مربوط",
  physical_status: "وضعیت جسمانی", is_veteran: "دارای سابقه ایثارگری",
  is_active: "وضعیت فعال", is_employed: "وضعیت اشتغال", employment_status: "وضعیت اشتغال",
  work_status: "وضعیت اشتغال", current_employer: "محل کار فعلی", profession: "حرفه",
  military_status: "وضعیت نظام وظیفه", military_service_status: "وضعیت نظام وظیفه",
  notes: "ملاحظات", move_reason: "علت جابه‌جایی", address_type: "نوع نشانی",
  owner_type: "نوع مالکیت", owner_name: "نام مالک", from_date: "از تاریخ", to_date: "تا تاریخ",
  address_line: "نشانی", stay_reason: "علت اقامت", termination_reason: "علت پایان همکاری",
  current_step_key: "مرحله فعلی", submitted_at: "تاریخ ثبت نهایی",
  previous_last_name: "نام خانوادگی قبلی",
  alias_first_name: "نام مستعار",
  alias_last_name: "نام خانوادگی مستعار",
  birth_certificate_no: "شماره شناسنامه",
  birth_certificate_issue_location: "محل صدور شناسنامه",
  nationality: "تابعیت",
  religion: "دین",
  sect: "مذهب",
  weight_kg: "وزن (کیلوگرم)",
  height_cm: "قد (سانتی‌متر)",
  blood_type: "گروه خونی",
  spouse_family_residence_address: "نشانی محل سکونت خانواده همسر",
  end_reason: "علت پایان",
  context_type: "نوع محل اقامت",
  stay_place: "محل اقامت",
  current_status: "وضعیت فعلی",
  convicted: "محکومیت",
  income_amount: "میزان درآمد",
  relation_type: "نوع ارتباط",
  responsibility: "مسئولیت / نوع فعالیت",
  motivation: "علت / انگیزه فعالیت",
  acquaintance_method: "نحوه آشنایی",
  substance_type: "نوع ماده",
  reference_date: "تاریخ مرجع",
  lifted_date: "تاریخ رفع ممنوعیت",
  model: "مدل",
  caliber: "کالیبر",
  body_number: "شماره بدنه",
  manufacturer_country_name: "کشور سازنده",
  license_authority: "مرجع صادرکننده مجوز",
  license_date: "تاریخ مجوز",
  use_reason: "علت استفاده",
  details: "توضیحات تکمیلی",
  declaration_version: "نسخه تعهدنامه",
  statement_text: "متن تعهدنامه",
  accepted: "تأیید و پذیرش",
  disability_description: "شرح معلولیت",
  distinguishing_marks: "علائم مشخصه",
  friend_first_name: "نام دوست / معرف",
  friend_last_name: "نام خانوادگی دوست / معرف",
  unit_name: "نام یگان",
  original_filename: "نام فایل",
  accepted_at: "زمان تأیید تعهدنامه",
};

const OMIT_KEYS = new Set([
  "id", "request_id", "person_id", "spouse_person_id", "applicant_user_id", "user_id",
  "profile_id", "created_by", "updated_by", "uploaded_by", "storage_key", "sha256",
  "mime_type", "is_active", "is_deleted", "workflow_key", "workflow_version",
  "accepted_by", "accepted_ip",
]);

const VALUE_LABELS = {
  APPLICANT: "متقاضی", SPOUSE: "همسر", RELATIVE: "بستگان", OWNER: "مالک",
  OPERATOR: "بهره‌بردار", FATHER: "پدر", MOTHER: "مادر", SIBLING: "خواهر / برادر",
  CHILD: "فرزند", FRIEND: "دوست", NEIGHBOR: "همسایه", REFERENCE: "معرف",
  FAMILY_FRIEND: "دوست خانوادگی", MILITARY_RELATIVE: "آشنای نظامی",
  SPOUSE_FATHER: "پدر همسر", SPOUSE_MOTHER: "مادر همسر", SPOUSE_SIBLING: "خواهر / برادر همسر",
  GRANDPARENT: "پدربزرگ / مادربزرگ", MALE: "مرد", FEMALE: "زن",
  single: "مجرد", married: "متأهل", current: "فعلی", former: "سابق", previous: "سابق",
  air: "هوایی", land: "زمینی", sea: "دریایی", permanent: "دائم", temporary: "موقت",
  YES: "بله", NO: "خیر", true: "بله", false: "خیر",
  PENDING: "در انتظار بررسی", ACTIVE: "فعال", IN_PROGRESS: "در حال تکمیل",
  RETURNED: "برگشت داده شده", SUBMITTED: "ثبت نهایی شده", UNDER_REVIEW: "در حال بررسی",
  APPROVED: "تأیید شده", REJECTED: "رد شده", COMPLETED: "تکمیل شده",
  accepted: "پذیرفته‌شده", rejected: "ردشده", passed: "قبول‌شده", failed: "ردشده",
  ended: "پایان‌یافته",
  divorce: "طلاق", death: "فوت", annulment: "ابطال", other: "سایر",
  GENERAL: "عمومی", CURRENT: "نشانی فعلی", RESIDENCE: "محل سکونت",
  PREVIOUS_RESIDENCE: "محل سکونت قبلی",
  alive: "در قید حیات", deceased: "فوت‌شده",
  completed_service: "پایان خدمت", exempt: "معاف", subject: "مشمول",
  has_booklet: "دارای دفترچه", no_booklet: "فاقد دفترچه",
  has_absence: "دارای غیبت", no_absence: "فاقد غیبت",
  medical: "پزشکی", education: "تحصیلی", guardianship: "کفالت",
  veteran: "ایثارگری", age: "سنی", ordinary: "عادی", special: "ویژه",
  Instagram: "اینستاگرام", Telegram: "تلگرام", Twitter: "توییتر",
  Eitaa: "ایتا", Bale: "بله", email: "رایانامه",
  "O+": "O مثبت", "A+": "A مثبت", "B+": "B مثبت", "AB+": "AB مثبت",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function isEmpty(value) {
  return value === null || value === undefined || value === "" ||
    (Array.isArray(value) && value.length === 0);
}

function isInternalKey(key) {
  return OMIT_KEYS.has(key) || key.endsWith("_id") ||
    key.startsWith("_") || key === "is_active";
}

function labelFor(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return "سایر اطلاعات";
}

function formatDate(value) {
  const raw = String(value ?? "");
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return escapeHtml(raw);
  const options = { year: "numeric", month: "long", day: "numeric" };
  if (raw.includes("T") || raw.includes(":")) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return date.toLocaleString("fa-IR-u-ca-persian", options);
}

function valueFor(key, value) {
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  if (typeof value === "number") return new Intl.NumberFormat("fa-IR").format(value);
  if (typeof value !== "string") return String(value ?? "");
  if (VALUE_LABELS[value]) return VALUE_LABELS[value];
  if (/date|_at$/.test(key) && /^\d{4}-\d{2}-\d{2}/.test(value)) return formatDate(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDate(value);
  if (value === "زن" || value === "مرد") return value;
  return value;
}

function renderField(key, value) {
  const label = escapeHtml(labelFor(key));
  const rendered = escapeHtml(valueFor(key, value));
  const codeClass = /national_id|mobile|phone|postal_code|passport_number|tracking_code|number/.test(key)
    ? ' class="field-value ltr-value"' : ' class="field-value"';
  return `<div class="field"><span class="field-label">${label}</span><strong${codeClass}>${rendered}</strong></div>`;
}

function renderObject(value, options = {}) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    return `<div class="repeat-list">${value.map((item, index) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        return `<article class="repeat-card"><div class="repeat-title">مورد ${new Intl.NumberFormat("fa-IR").format(index + 1)}</div>${renderObject(item, { nested: true })}</article>`;
      }
      return `<div class="field"><span class="field-label">مورد ${new Intl.NumberFormat("fa-IR").format(index + 1)}</span><strong class="field-value">${escapeHtml(valueFor("", item))}</strong></div>`;
    }).join("")}</div>`;
  }
  if (!value || typeof value !== "object") return isEmpty(value) ? "" : renderField(options.key || "value", value);

  const scalar = [];
  const nested = [];
  Object.entries(value).forEach(([key, item]) => {
    if (isInternalKey(key) || isEmpty(item)) return;
    if (item && typeof item === "object") nested.push([key, item]);
    else scalar.push([key, item]);
  });
  const fields = scalar.map(([key, item]) => renderField(key, item)).join("");
  const subSections = nested.map(([key, item]) => {
    const content = renderObject(item, { key });
    if (!content) return "";
    return `<div class="subsection"><h4>${escapeHtml(labelFor(key))}</h4>${content}</div>`;
  }).join("");
  if (!fields && !subSections) return "";
  return `${fields ? `<div class="fields-grid">${fields}</div>` : ""}${subSections}`;
}

function statusLabel(value) {
  return STATUS[value]?.[0] || VALUE_LABELS[value] || value || "ثبت نشده";
}

function stepStatusLabel(value) {
  const labels = {
    COMPLETED: "تکمیل‌شده", APPROVED: "تأییدشده", ACTIVE: "مرحله فعال",
    IN_PROGRESS: "در حال تکمیل", RETURNED: "نیازمند اصلاح", REJECTED: "ردشده",
    PENDING: "در انتظار", UNDER_REVIEW: "در حال بررسی", SUBMITTED: "ثبت نهایی",
  };
  return labels[value] || statusLabel(value);
}

function stepStatusClass(value) {
  if (["COMPLETED", "APPROVED"].includes(value)) return "success";
  if (["RETURNED", "REJECTED"].includes(value)) return "warning";
  if (["ACTIVE", "IN_PROGRESS", "UNDER_REVIEW", "SUBMITTED"].includes(value)) return "active";
  return "neutral";
}

function renderStep(step) {
  if (step.data === null || step.data === undefined) return "";
  const meta = STEP_META[step.key] || { title: step.key, kicker: "" };
  const body = renderObject(step.data);
  const noData = '<div class="empty-section">برای این بخش، اطلاعاتی ثبت نشده است.</div>';
  return `<section class="report-section">
    <div class="section-heading">
      <div class="section-number">${new Intl.NumberFormat("fa-IR").format(step.order)}</div>
      <div class="section-title"><h2>${escapeHtml(meta.title)}</h2><p>${escapeHtml(meta.kicker || "")}</p></div>
      <span class="step-badge ${stepStatusClass(step.status)}">${escapeHtml(stepStatusLabel(step.status))}</span>
    </div>
    ${step.data_source === "draft" ? '<div class="draft-note">این بخش شامل آخرین پیش‌نویس ذخیره‌شده است.</div>' : ""}
    ${body || noData}
  </section>`;
}

function renderDocumentList(documents = []) {
  if (!documents.length) return "";
  return `<section class="report-section documents-section">
    <div class="section-heading"><div class="section-number">↗</div><div class="section-title"><h2>مدارک بارگذاری‌شده</h2><p>فهرست فایل‌های پیوست‌شده به پرونده</p></div></div>
    <div class="document-list">${documents.map((file, index) => `<div class="document-row">
      <span class="document-index">${new Intl.NumberFormat("fa-IR").format(index + 1)}</span>
      <div class="document-main"><strong>${escapeHtml(file.filename || "بدون نام")}</strong><small>${escapeHtml(file.document_type || "نوع مدرک مشخص نشده")}</small></div>
      <span class="document-status">${escapeHtml(statusLabel(file.status))}</span>
      <span class="document-size">${escapeHtml(formatBytes(file.size_bytes))}</span>
    </div>`).join("")}</div>
    <p class="document-note">فایل‌های پیوست به‌صورت فهرست در این گزارش درج شده‌اند؛ محتوای خود فایل‌ها داخل PDF ادغام نشده است.</p>
  </section>`;
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(bytes / 1024)} کیلوبایت`;
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} مگابایت`;
}

function renderHtml(report) {
  const request = report.request || {};
  const applicant = report.applicant || {};
  const steps = Array.isArray(report.steps) ? report.steps : [];
  const personal = steps.find((step) => step.key === "personal")?.data || {};
  const person = personal.person || {};
  const fullName = [person.first_name, person.last_name].filter(Boolean).join(" ") || "نام متقاضی ثبت نشده";
  const nationalId = person.national_id || applicant.national_id || "ثبت نشده";
  const phone = applicant.mobile || personal.contacts?.find((item) => item.contact_type === "موبایل" || item.contact_type === "تلفن همراه")?.value || "ثبت نشده";
  const submittedSteps = steps.filter((step) => step.data !== null && step.data !== undefined).length;
  const finalized = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED"].includes(request.status);
  const generatedAt = new Date().toLocaleString("fa-IR-u-ca-persian", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const safeTracking = String(request.tracking_code || "request").replace(/[^\w\-]/g, "-");
  const title = `گزارش پرونده - ${safeTracking}`;
  const progress = steps.map((step) => {
    const meta = STEP_META[step.key] || { title: step.key };
    return `<div class="progress-item"><span class="progress-dot ${stepStatusClass(step.status)}"></span><span>${escapeHtml(meta.title)}</span></div>`;
  }).join("");
  const summaryFields = [
    ["نام و نام خانوادگی", fullName],
    ["نام پدر", person.father_name || "ثبت نشده"],
    ["کد ملی", nationalId],
    ["شماره همراه", phone],
    ["تاریخ تولد", person.birth_date ? formatDate(person.birth_date) : "ثبت نشده"],
    ["جنسیت", person.gender || "ثبت نشده"],
  ];
  const meta = [
    ["کد رهگیری", request.tracking_code || "—"],
    ["نوع پرونده", report.request_type?.title || "درخواست استخدام / گزینش"],
    ["وضعیت پرونده", statusLabel(request.status)],
    ["تاریخ ایجاد", request.created_at ? formatDate(request.created_at) : "—"],
    ["تاریخ ثبت نهایی", request.submitted_at ? formatDate(request.submitted_at) : "—"],
  ];
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
@font-face{font-family:IranYekan;src:url("${regularFont}") format("woff2");font-weight:400;font-style:normal}
@font-face{font-family:IranYekan;src:url("${mediumFont}") format("woff2");font-weight:500 600;font-style:normal}
@font-face{font-family:IranYekan;src:url("${boldFont}") format("woff2");font-weight:700 900;font-style:normal}
:root{color-scheme:light;--navy:#142d50;--blue:#285b98;--muted:#6b7b91;--line:#e2e8f0;--pale:#f5f8fc;--gold:#c49a52;--green:#16774f}
*{box-sizing:border-box}
html,body{margin:0;padding:0;font-family:IranYekan,Tahoma,sans-serif;color:#26364a;background:#fff;font-size:10pt;line-height:1.8;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{padding:0}
.screen-toolbar{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 5vw;background:#142d50;color:#fff;box-shadow:0 6px 18px #142d5022}
.screen-toolbar p{margin:0;font-size:10pt}
.toolbar-actions{display:flex;gap:8px;flex-shrink:0}
.toolbar-actions button{border:1px solid #ffffff55;border-radius:8px;padding:8px 14px;background:#ffffff12;color:#fff;font:inherit;cursor:pointer}
.toolbar-actions .primary{background:#fff;color:#142d50;font-weight:700}
.report{max-width:210mm;margin:26px auto 40px;padding:0 15mm 15mm}
.brand-head{display:flex;align-items:center;gap:14px;padding:0 0 20px;border-bottom:2px solid var(--navy);position:relative}
.brand-mark{display:grid;place-items:center;width:53px;height:53px;flex:0 0 auto;border-radius:15px;background:var(--navy);color:#fff;font-size:25px;font-weight:800;box-shadow:inset 0 -4px 0 var(--gold)}
.brand-copy{min-width:0;flex:1}
.brand-kicker{margin:0 0 3px;color:var(--blue);font-size:9pt;font-weight:700;letter-spacing:.02em}
.brand-copy h1{margin:0;color:var(--navy);font-size:21pt;font-weight:800;line-height:1.6}
.brand-copy p{margin:2px 0 0;color:var(--muted);font-size:9pt}
.security-tag{align-self:flex-start;border:1px solid #d8c6a6;border-radius:8px;padding:6px 10px;color:#7b6338;background:#fbf7ee;text-align:center;font-size:8pt;font-weight:700;white-space:nowrap}
.meta-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:17px 0 13px}
.meta-item{min-width:0;padding:10px 11px;border:1px solid var(--line);border-radius:10px;background:var(--pale)}
.meta-label{display:block;margin-bottom:4px;color:var(--muted);font-size:8pt}
.meta-value{display:block;color:var(--navy);font-size:9pt;font-weight:700;overflow-wrap:anywhere}
.status-pill{display:inline-block;border-radius:5px;padding:1px 7px;background:#eaf1fb;color:#285b98}
.identity-card{margin:0 0 17px;padding:15px;border:1px solid #d9e4f1;border-radius:14px;background:linear-gradient(110deg,#f7faff,#fff 75%);break-inside:avoid}
.identity-head{display:flex;align-items:center;gap:9px;margin:0 0 12px;padding-bottom:9px;border-bottom:1px solid #e4ebf5;color:var(--navy);font-size:12pt;font-weight:800}
.identity-head:before{content:"";width:4px;height:20px;border-radius:3px;background:var(--gold)}
.identity-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.identity-field{min-width:0;padding:8px 10px;border:1px solid #e8edf5;border-radius:8px;background:#fff}
.identity-field span{display:block;color:var(--muted);font-size:8pt}
.identity-field strong{display:block;margin-top:3px;color:#1c324e;font-size:10pt;overflow-wrap:anywhere}
.ltr-value{direction:ltr;text-align:right;unicode-bidi:plaintext;font-variant-numeric:tabular-nums}
.progress-summary{margin:0 0 19px;padding:12px 15px;border:1px solid var(--line);border-radius:12px}
.progress-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
.progress-top strong{color:var(--navy);font-size:10pt}
.progress-top span{color:var(--muted);font-size:8pt}
.progress-track{display:flex;flex-wrap:wrap;gap:6px 12px}
.progress-item{display:flex;align-items:center;gap:5px;color:#52647b;font-size:8pt}
.progress-dot{width:7px;height:7px;flex:0 0 auto;border-radius:50%;background:#bcc7d5}
.progress-dot.success{background:#1e9565}.progress-dot.warning{background:#cb7b29}.progress-dot.active{background:#3d79ba}
.report-section{margin:0 0 18px;padding:14px;border:1px solid #dfe6ef;border-radius:13px;break-inside:auto}
.section-heading{display:flex;align-items:center;gap:10px;margin:0 0 13px;padding-bottom:10px;border-bottom:1px solid #e8edf3;break-after:avoid}
.section-number{display:grid;place-items:center;width:35px;height:35px;flex:0 0 auto;border-radius:10px;background:var(--navy);color:#fff;font-size:11pt;font-weight:800}
.section-title{flex:1;min-width:0}
.section-title h2{margin:0;color:var(--navy);font-size:13pt;font-weight:800}
.section-title p{margin:2px 0 0;color:var(--muted);font-size:8pt}
.step-badge{flex:0 0 auto;border-radius:7px;padding:4px 8px;font-size:8pt;font-weight:700;white-space:nowrap}
.step-badge.success{background:#eaf7ef;color:#17764c}.step-badge.warning{background:#fff3e7;color:#965a15}
.step-badge.active{background:#edf4fc;color:#285b98}.step-badge.neutral{background:#f0f2f5;color:#6b7788}
.fields-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:4px 0 10px}
.field{min-width:0;padding:8px 10px;border:1px solid #edf0f4;border-radius:8px;background:#fff;break-inside:avoid}
.field-label{display:block;color:#738197;font-size:8pt;line-height:1.6}
.field-value{display:block;margin-top:4px;color:#263b56;font-size:9.4pt;font-weight:600;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.75}
.subsection{margin:12px 0 3px;padding:11px;border:1px solid #e7edf4;border-radius:10px;background:#fafbfd;break-inside:auto}
.subsection h4{margin:0 0 9px;color:#31527b;font-size:10pt;font-weight:800;break-after:avoid}
.subsection .fields-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.repeat-list{display:grid;grid-template-columns:1fr;gap:9px;margin-top:5px}
.repeat-card{padding:11px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;break-inside:avoid}
.repeat-title{display:inline-block;margin-bottom:8px;padding:3px 8px;border-radius:6px;background:#eef3f9;color:#466384;font-size:8pt;font-weight:700}
.repeat-card .fields-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.empty-section{padding:14px;text-align:center;color:#8793a4;font-size:9pt;background:#f9fafc;border-radius:8px}
.draft-note{margin:0 0 10px;padding:7px 10px;border-right:3px solid var(--gold);background:#fbf6eb;color:#7a6339;font-size:8pt}
.documents-section{break-inside:auto}
.document-list{border:1px solid var(--line);border-radius:10px;overflow:hidden}
.document-row{display:flex;align-items:center;gap:10px;padding:9px 11px;border-bottom:1px solid #edf0f4;break-inside:avoid}
.document-row:last-child{border-bottom:0}
.document-index{display:grid;place-items:center;width:28px;height:28px;flex:0 0 auto;border-radius:7px;background:#edf3fb;color:#315e96;font-weight:700}
.document-main{display:flex;flex:1;min-width:0;flex-direction:column}
.document-main strong{color:#263b56;overflow-wrap:anywhere;font-size:9pt}
.document-main small,.document-size{color:var(--muted);font-size:8pt}
.document-status{font-size:8pt;color:#4d6380;white-space:nowrap}
.document-note{margin:9px 0 0;color:#7a8798;font-size:8pt}
.report-end{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:24px;padding-top:12px;border-top:1px solid #dfe6ef;color:#7b8798;font-size:8pt}
.report-end strong{color:var(--navy)}
.print-footer{display:none}
@page{size:A4;margin:13mm 12mm 17mm}
@media print{
  html,body{background:#fff!important;font-size:9pt}
  .screen-toolbar{display:none!important}
  .report{width:auto;max-width:none;margin:0;padding:0}
  .brand-head{padding-bottom:13px}
  .brand-mark{width:45px;height:45px}
  .brand-copy h1{font-size:17pt}
  .meta-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin:12px 0 9px}
  .meta-item{padding:7px}
  .identity-card{padding:11px;margin-bottom:12px}
  .report-section{padding:10px;margin-bottom:11px}
  .section-number{width:30px;height:30px}
  .fields-grid,.subsection .fields-grid,.repeat-card .fields-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
  .field{padding:6px 8px}
  .field-value{font-size:8.6pt}
  .print-footer{display:block;position:fixed;left:0;right:0;bottom:-12mm;border-top:1px solid #dfe6ef;padding-top:4px;color:#758296;text-align:center;font-size:7pt}
  .report-section,.identity-card,.meta-item,.field,.repeat-card,.document-row{box-shadow:none}
}
@media screen and (max-width:760px){
 .report{margin:16px auto;padding:0 16px 28px}
 .screen-toolbar{align-items:flex-start;flex-direction:column;padding:12px 16px}
 .toolbar-actions{width:100%}.toolbar-actions button{flex:1}
 .meta-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
 .identity-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
 .fields-grid,.subsection .fields-grid,.repeat-card .fields-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
 .brand-copy h1{font-size:16pt}.security-tag{display:none}
}
</style>
</head>
<body>
<div class="screen-toolbar">
 <p>گزارش آماده است؛ برای دریافت فایل، در پنجره چاپ مقصد «ذخیره به‌صورت PDF» را انتخاب کنید.</p>
 <div class="toolbar-actions"><button id="report-print" class="primary" type="button">چاپ / ذخیره PDF</button><button id="report-close" type="button">بستن پنجره</button></div>
</div>
<main class="report">
 <header class="brand-head">
  <div class="brand-mark">R</div>
  <div class="brand-copy"><p class="brand-kicker">سامانه جامع استخدام و گزینش</p><h1>گزارش جامع درخواست</h1><p>نسخهٔ خوانا و ساختاریافته از اطلاعات ثبت‌شده در پرونده</p></div>
  <div class="security-tag">اطلاعات شخصی<br>ویژه استفاده مجاز</div>
 </header>
 <section class="meta-grid">${meta.map(([label, value]) => `<div class="meta-item"><span class="meta-label">${escapeHtml(label)}</span><strong class="meta-value">${escapeHtml(value)}</strong></div>`).join("")}</section>
 <section class="identity-card">
  <h2 class="identity-head">مشخصات متقاضی</h2>
  <div class="identity-grid">${summaryFields.map(([label, value]) => `<div class="identity-field"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>
 </section>
 <section class="progress-summary">
  <div class="progress-top"><strong>نمای کلی فرآیند</strong><span>${new Intl.NumberFormat("fa-IR").format(submittedSteps)} مرحله دارای اطلاعات از ${new Intl.NumberFormat("fa-IR").format(steps.length)} مرحله ${finalized ? "· پرونده نهایی / در حال بررسی" : "· پرونده در جریان تکمیل"}</span></div>
  <div class="progress-track">${progress}</div>
 </section>
 ${steps.map(renderStep).join("")}
 ${renderDocumentList(report.documents || [])}
 <div class="report-end"><span>تهیه‌شده در ${escapeHtml(generatedAt)}</span><strong>کد رهگیری: ${escapeHtml(request.tracking_code || "—")}</strong></div>
</main>
<div class="print-footer">این سند حاوی اطلاعات شخصی است؛ فقط در چارچوب مجاز نگهداری و استفاده شود.</div>
</body></html>`;
}

function loadingHtml() {
  return `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>آماده‌سازی گزارش</title>
  <body style="font-family:Tahoma,sans-serif;background:#f4f7fb;color:#18314f;padding:56px;text-align:center">
  <h2>در حال آماده‌سازی گزارش پرونده…</h2><p>اطلاعات فرم‌ها دریافت و برای چاپ فارسی قالب‌بندی می‌شوند.</p></body></html>`;
}

function errorHtml(message) {
  return `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>خطا در گزارش</title>
  <body style="font-family:Tahoma,sans-serif;background:#f8fafc;color:#9b2c2c;padding:42px;line-height:2;text-align:center">
  <h2>تهیه گزارش انجام نشد</h2><p>${escapeHtml(message)}</p><button id="report-close" type="button">بستن پنجره</button></body></html>`;
}

export async function printRequestReport(requestId, { staff = false } = {}) {
  const popup = window.open("", "_blank");
  if (!popup) throw new Error("مرورگر اجازه باز کردن پنجره گزارش را نداد. پنجره‌های بازشو را برای سامانه مجاز کنید.");
  try {
    popup.document.open();
    popup.document.write(loadingHtml());
    popup.document.close();
    popup.opener = null;
    const { api } = await import("../services/api");
    const report = staff ? await api.staffRequestReport(requestId) : await api.requestReport(requestId);
    popup.document.open();
    popup.document.write(renderHtml(report));
    popup.document.close();
    popup.document.getElementById("report-print")?.addEventListener("click", () => popup.print());
    popup.document.getElementById("report-close")?.addEventListener("click", () => popup.close());
    if (popup.document.fonts?.load) {
      await Promise.all([
        popup.document.fonts.load("400 10pt IranYekan"),
        popup.document.fonts.load("700 10pt IranYekan"),
      ]);
      await popup.document.fonts.ready;
    }
    await new Promise((resolve) => popup.requestAnimationFrame(() => popup.requestAnimationFrame(resolve)));
    popup.focus();
    popup.print();
  } catch (error) {
    try {
      popup.document.open();
      popup.document.write(errorHtml(error?.message || "خطای غیرمنتظره‌ای رخ داد."));
      popup.document.close();
      popup.document.getElementById("report-close")?.addEventListener("click", () => popup.close());
    } catch {}
    throw error;
  }
}
