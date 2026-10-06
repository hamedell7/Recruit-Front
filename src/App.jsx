import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";

const STEP_META = {
  personal: { title: "مشخصات فردی", kicker: "هویت و اطلاعات تماس" },
  marriage: { title: "وضعیت تأهل و همسر", kicker: "وضعیت خانوادگی" },
  military: { title: "وضعیت نظام وظیفه", kicker: "خدمت و معافیت" },
  education: { title: "سوابق تحصیلی", kicker: "مدارک دانشگاهی و حوزوی" },
  employment: { title: "سوابق شغلی", kicker: "تجربه و محل‌های کار" },
  passport: { title: "گذرنامه", kicker: "سوابق گذرنامه" },
  foreign_contacts: { title: "ارتباطات خارج از کشور", kicker: "ارتباطات و مکاتبات" },
  accommodation: { title: "خوابگاه و پانسیون", kicker: "اقامت‌های دانشجویی و کاری" },
  screening_history: { title: "سوابق گزینش", kicker: "پرونده‌های قبلی" },
  veteran: { title: "سوابق ایثارگری", kicker: "رزمندگی، جانبازی و شهادت" },
  travel: { title: "سفر و اقامت خارج از کشور", kicker: "مسافرت و اقامت" },
  legal_incidents: { title: "سوابق قضایی و انتظامی", kicker: "احضار، بازداشت و دستگیری" },
  migration: { title: "مهاجرت و پناهندگی", kicker: "وضعیت مهاجرت و بازگشت" },
  affiliations: { title: "ارتباط و همکاری", kicker: "اشخاص، تشکل‌ها و گروه‌ها" },
  addiction: { title: "سوابق اعتیاد", kicker: "اطلاعات اعلامی" },
  foreign_company_relations: { title: "شرکت‌ها و مؤسسات خارجی", kicker: "همکاری و اشتغال" },
  embassy_relations: { title: "سفارتخانه و کنسولگری", kicker: "اشتغال و ارتباطات" },
  exit_restrictions: { title: "ممنوع‌الخروجی", kicker: "سوابق و نتایج" },
  activities: { title: "فعالیت‌های اجتماعی و فرهنگی", kicker: "سیاسی، فرهنگی، جهادی و اجتماعی" },
  weapons: { title: "سوابق سلاح", kicker: "سلاح و مجوز" },
  family: { title: "خانواده", kicker: "والدین، خواهر و برادر، همسر و فرزندان" },
  social_relations: { title: "معرفین، دوستان و همسایگان", kicker: "منابع شناخت" },
  residence: { title: "سوابق سکونت ده سال اخیر", kicker: "نشانی‌های محل سکونت" },
  additional: { title: "توضیحات تکمیلی", kicker: "موارد و سوابق تکمیلی" },
  declaration: { title: "تعهد نهایی", kicker: "تأیید و ثبت نهایی پرونده" },
  documents: { title: "مدارک", kicker: "بارگذاری مستندات" },
  review: { title: "مرور نهایی", kicker: "کنترل اطلاعات پیش از ثبت" },
};

const RECORDS = {
  military: [
    { key: "status", label: "وضعیت", type: "select", options: ["پایان خدمت", "مشمول", "معاف", "غیبت"] },
    { key: "card_type", label: "نوع کارت", type: "text" },
    { key: "organization_name", label: "سازمان خدمتی", type: "text" },
    { key: "unit_name", label: "یگان خدمتی", type: "text" },
    { key: "start_date", label: "تاریخ شروع", type: "date" },
    { key: "end_date", label: "تاریخ پایان", type: "date" },
    { key: "booklet_status", label: "وضعیت دفترچه", type: "text" },
    { key: "absence_status", label: "وضعیت غیبت", type: "text" },
    { key: "exemption_reason", label: "علت معافیت", type: "textarea", full: true, visibleWhen: (record) => record.status === "معاف" },
  ],
  education: [
    { key: "degree_level", label: "مقطع تحصیلی / سطح", type: "text", required: true },
    { key: "institution_name", label: "نام دانشگاه / حوزه", type: "text", required: true },
    { key: "institution_type", label: "نوع دانشگاه", type: "text" },
    { key: "field_of_study", label: "رشته / گرایش", type: "text", required: true },
    { key: "gpa", label: "معدل", type: "number" },
    { key: "start_date", label: "تاریخ شروع", type: "date" },
    { key: "end_date", label: "تاریخ پایان", type: "date" },
    { key: "is_current", label: "در حال تحصیل هستم", type: "boolean" },
    { key: "address_line", label: "نشانی محل تحصیل", type: "textarea", full: true },
    { key: "phone", label: "تلفن محل تحصیل", type: "text" },
  ],
  employment: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "organization_name", label: "اداره / محل کار", type: "text", required: true },
    { key: "membership_type", label: "نوع عضویت", type: "text" },
    { key: "position", label: "سمت و شغل", type: "text", required: true },
    { key: "start_date", label: "تاریخ به‌کارگیری", type: "date", required: true },
    { key: "end_date", label: "تاریخ قطع همکاری", type: "date" },
    { key: "termination_reason", label: "علت ترک خدمت", type: "textarea", full: true, visibleWhen: (record) => Boolean(record.end_date) },
    { key: "work_address", label: "نشانی محل کار", type: "textarea", full: true },
    { key: "manager_name", label: "نام مسئول", type: "text" },
    { key: "manager_phone", label: "تلفن مسئول", type: "text" },
    { key: "work_phone", label: "تلفن محل کار", type: "text" },
  ],
  passport: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "passport_number", label: "شماره گذرنامه", type: "text", required: true },
    { key: "issue_date", label: "تاریخ صدور", type: "date" },
    { key: "expiry_date", label: "مدت اعتبار / تاریخ انقضا", type: "date" },
    { key: "issue_city_id", label: "شناسه شهر محل دریافت", type: "number" },
    { key: "notes", label: "ملاحظات", type: "textarea", full: true },
  ],
  foreign_contacts: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "country_id", label: "کشور", type: "country", required: true },
    { key: "entity_name", label: "نام فرد / مؤسسه", type: "text", required: true },
    { key: "contact_type", label: "نوع ارتباط", type: "text", required: true },
    { key: "start_date", label: "تاریخ شروع", type: "date" },
    { key: "end_date", label: "تاریخ پایان", type: "date" },
    { key: "reason", label: "علت و موضوع", type: "textarea", full: true },
    { key: "result", label: "نتیجه ارتباط", type: "textarea", full: true },
    { key: "notes", label: "ملاحظات", type: "textarea", full: true },
  ],
  accommodation: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "name", label: "نام خوابگاه / پانسیون", type: "text", required: true },
    { key: "start_date", label: "تاریخ شروع اسکان", type: "date", required: true },
    { key: "end_date", label: "تاریخ پایان اسکان", type: "date" },
    { key: "address_line", label: "آدرس خوابگاه", type: "textarea", full: true },
    { key: "day_manager_name", label: "مسئول روز", type: "text" },
    { key: "day_manager_phone", label: "تلفن مسئول روز", type: "text" },
    { key: "night_manager_name", label: "مسئول شب", type: "text" },
    { key: "night_manager_phone", label: "تلفن مسئول شب", type: "text" },
  ],
  screening_history: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "organization_name", label: "نام سازمان / اداره", type: "text", required: true },
    { key: "screening_date", label: "تاریخ گزینش", type: "date" },
    { key: "result", label: "نتیجه گزینش", type: "text", required: true },
    { key: "rejection_reason", label: "علت عدم پذیرش", type: "textarea", full: true, visibleWhen: (record) => /رد|عدم پذیرش|نپذیرفته/.test(record.result || "") },
    { key: "address", label: "نشانی محل گزینش", type: "textarea", full: true },
    { key: "phone", label: "تلفن محل گزینش", type: "text" },
  ],
  veteran: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "veteran_type", label: "نوع ایثارگری", type: "text", required: true },
    { key: "percentage", label: "درصد ایثارگری", type: "number" },
    { key: "occurrence_date", label: "تاریخ وقوع / اعزام", type: "date" },
    { key: "location", label: "محل وقوع / اعزام", type: "text" },
    { key: "issuing_authority", label: "اعزام کننده / مرجع", type: "text" },
    { key: "duration", label: "مدت ایثارگری", type: "text" },
    { key: "notes", label: "توضیحات", type: "textarea", full: true },
  ],
  travel: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "country_id", label: "کشور خارجی", type: "country", required: true },
    { key: "travel_type", label: "نوع مسافرت / اقامت", type: "text", required: true },
    { key: "start_date", label: "تاریخ شروع", type: "date" },
    { key: "end_date", label: "تاریخ پایان", type: "date" },
    { key: "transport_type", label: "نحوه سفر", type: "text" },
    { key: "stay_type", label: "نوع اقامت", type: "text" },
    { key: "stay_place", label: "محل اقامت", type: "textarea", full: true },
    { key: "exit_border", label: "مرز خروجی", type: "text" },
    { key: "passport_number", label: "شماره گذرنامه", type: "text" },
    { key: "reason", label: "علت سفر / اقامت", type: "textarea", full: true },
  ],
  legal_incidents: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "incident_type", label: "نوع سابقه", type: "text", required: true },
    { key: "incident_date", label: "تاریخ", type: "date" },
    { key: "reason", label: "علت", type: "textarea", full: true },
    { key: "location", label: "محل وقوع", type: "text" },
    { key: "authority", label: "مرجع رسیدگی", type: "text" },
    { key: "result", label: "نتیجه رسیدگی", type: "textarea", full: true },
  ],
  migration: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "status", label: "وضعیت", type: "text", required: true },
    { key: "reason", label: "علت مهاجرت / پناهندگی", type: "textarea", full: true },
    { key: "current_status", label: "وضعیت فعلی", type: "textarea", full: true },
    { key: "return_date", label: "تاریخ برگشتن", type: "date" },
    { key: "result", label: "نتیجه", type: "textarea", full: true },
  ],
  affiliations: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "entity_name", label: "نام فرد / شرکت / کشور", type: "text", required: true },
    { key: "country_id", label: "کشور", type: "country" },
    { key: "relation_type", label: "نوع اشتغال / ارتباط / همکاری", type: "text", required: true },
    { key: "activity_title", label: "عنوان فعالیت / مسئولیت", type: "text" },
    { key: "start_date", label: "از تاریخ", type: "date" },
    { key: "end_date", label: "تا تاریخ", type: "date" },
    { key: "reason", label: "علت اشتغال / ارتباط", type: "textarea", full: true },
    { key: "acquaintance_method", label: "زمینه / نحوه آشنایی", type: "textarea", full: true },
    { key: "termination_reason", label: "علت قطع ارتباط", type: "textarea", full: true, visibleWhen: (record) => Boolean(record.end_date) },
  ],
  addiction: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "substance_type", label: "ماده مورد استعمال", type: "text", required: true },
    { key: "start_date", label: "از تاریخ", type: "date" },
    { key: "end_date", label: "تا تاریخ", type: "date" },
    { key: "reason", label: "علت", type: "textarea", full: true },
    { key: "convicted", label: "محکومیت داشته‌ام", type: "boolean" },
    { key: "current_status", label: "وضعیت فعلی", type: "textarea", full: true },
  ],
  foreign_company_relations: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "company_name", label: "نام شرکت / مؤسسه", type: "text", required: true },
    { key: "activity_type", label: "نوع فعالیت", type: "text", required: true },
    { key: "country_id", label: "کشور", type: "country", required: true },
    { key: "income_amount", label: "میزان درآمد", type: "number" },
    { key: "start_date", label: "تاریخ شروع", type: "date" },
    { key: "end_date", label: "تاریخ پایان", type: "date" },
    { key: "dependent_country_id", label: "کشور وابستگی", type: "country" },
    { key: "acquaintance_method", label: "نحوه آشنایی", type: "textarea", full: true },
  ],
  embassy_relations: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "country_id", label: "کشور", type: "country", required: true },
    { key: "relation_type", label: "نوع ارتباط", type: "text", required: true },
    { key: "responsibility", label: "مسئولیت", type: "textarea", full: true },
    { key: "start_date", label: "تاریخ شروع", type: "date" },
    { key: "end_date", label: "تاریخ پایان", type: "date" },
    { key: "address", label: "آدرس", type: "textarea", full: true },
    { key: "phone", label: "تلفن", type: "text" },
  ],
  exit_restrictions: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "reference_date", label: "تاریخ مرجع", type: "date" },
    { key: "authority", label: "مرجع ممنوع‌الخروج کننده", type: "text", required: true },
    { key: "reason", label: "علت", type: "textarea", full: true },
    { key: "result", label: "نتیجه", type: "textarea", full: true },
    { key: "lifted_date", label: "تاریخ رفع ممنوعیت", type: "date" },
  ],
  activities: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "organization_name", label: "نام نهاد / تشکل", type: "text", required: true },
    { key: "activity_type", label: "نوع فعالیت", type: "text", required: true },
    { key: "start_date", label: "از تاریخ", type: "date" },
    { key: "end_date", label: "تا تاریخ", type: "date" },
    { key: "responsibility", label: "نوع مسئولیت / فعالیت", type: "textarea", full: true },
    { key: "motivation", label: "علت / انگیزه فعالیت", type: "textarea", full: true },
    { key: "termination_reason", label: "علت ترک فعالیت", type: "textarea", full: true, visibleWhen: (record) => Boolean(record.end_date) },
    { key: "manager_name", label: "نام مسئول", type: "text" },
    { key: "address", label: "نشانی محل فعالیت", type: "textarea", full: true },
    { key: "phone", label: "تلفن", type: "text" },
  ],
  weapons: [
    { key: "person_role", label: "برای", type: "select", options: [{ value: "APPLICANT", label: "داوطلب" }, { value: "SPOUSE", label: "همسر" }] },
    { key: "weapon_type", label: "نوع سلاح", type: "text", required: true },
    { key: "model", label: "مدل", type: "text" },
    { key: "caliber", label: "کالیبر", type: "text" },
    { key: "body_number", label: "شماره بدنه", type: "text" },
    { key: "manufacturer_country_id", label: "کشور سازنده", type: "country" },
    { key: "license_authority", label: "مرجع صدور مجوز", type: "text" },
    { key: "license_number", label: "شماره مجوز", type: "text" },
    { key: "license_date", label: "تاریخ مجوز", type: "date" },
    { key: "use_reason", label: "علت استفاده", type: "textarea", full: true },
  ],
};

const FLOW_SECTIONS = [
  ["هویت و اطلاعات پایه", ["personal", "marriage", "military"]],
  ["تحصیل و اشتغال", ["education", "employment", "passport", "accommodation"]],
  ["ارتباطات و سوابق", ["foreign_contacts", "screening_history", "veteran", "travel", "legal_incidents", "migration"]],
  ["ارتباطات تکمیلی", ["affiliations", "addiction", "foreign_company_relations", "embassy_relations", "exit_restrictions", "activities", "weapons"]],
  ["خانواده و منابع شناخت", ["family", "social_relations", "residence"]],
  ["جمع‌بندی", ["additional", "declaration"]],
];

const STATUS = {
  IN_PROGRESS: ["در حال تکمیل", "progress"],
  RETURNED: ["برگشت داده شده", "returned"],
  SUBMITTED: ["ثبت نهایی شده", "submitted"],
  UNDER_REVIEW: ["در حال بررسی", "review"],
  APPROVED: ["تأیید شده", "approved"],
  REJECTED: ["رد شده", "rejected"],
  COMPLETED: ["تکمیل شده", "approved"],
  DRAFT: ["پیش‌نویس", "muted"],
};

const emptyRecord = (fields) => {
  const out = {};
  fields.forEach((field) => {
    out[field.key] = field.type === "boolean" ? null : "";
  });
  return out;
};

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function statusLabel(status) {
  return STATUS[status] || [status || "نامشخص", "muted"];
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState("dashboard");
  const [activeRequest, setActiveRequest] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.me()
      .then((me) => {
        setUser(me);
        setView("dashboard");
      })
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  if (booting) return <LoadingScreen />;
  if (!user) return <Login onLogin={(me) => { setUser(me); setView("dashboard"); }} onError={setToast} />;

  const openRequest = async (request) => {
    setActiveRequest(request);
    setView("wizard");
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    setUser(null);
    setActiveRequest(null);
    setView("dashboard");
  };

  return (
    <div className="app-shell">
      <Header user={user} onLogout={logout} />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {view === "dashboard" ? (
        <Dashboard user={user} onOpenRequest={openRequest} onCreated={openRequest} onError={setToast} />
      ) : (
        <RequestWizard user={user} request={activeRequest} onBack={() => setView("dashboard")} onError={setToast} />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="brand-mark large">R</div>
      <div className="loading-spinner" />
      <strong>در حال آماده‌سازی سامانه</strong>
    </div>
  );
}

function Login({ onLogin, onError }) {
  const [nationalId, setNationalId] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const clearFieldError = (field) => {
    setValidationErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setValidationErrors({});
    setBusy(true);
    try {
      const result = await api.login(nationalId, mobile);
      onLogin(result.user);
    } catch (error) {
      if (error.validationErrors?.length) {
        const next = {};
        error.validationErrors.forEach((item) => {
          const key = item.path || "form";
          if (!next[key]) next[key] = item.message;
        });
        setValidationErrors(next);
      }
      onError({ type: "error", text: error.message, requestId: error.requestId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-showcase">
        <div className="showcase-top">
          <div className="brand">
            <div className="brand-mark">R</div>
            <div>
              <strong>Recruit</strong>
              <span>سامانه مدیریت درخواست</span>
            </div>
          </div>
          <span className="secure-pill">امنیت‌محور</span>
        </div>
        <div className="showcase-main">
          <span className="eyebrow">یک مسیر دیجیتال، یک پرونده منسجم</span>
          <h1>از ثبت درخواست تا<br /><span>تکمیل پرونده</span></h1>
          <p>اطلاعات را مرحله‌به‌مرحله ثبت کنید، وضعیت پرونده را ببینید و بدون سردرگمی ادامه دهید.</p>
          <div className="trust-grid">
            <div><b>۲۵</b><span>مرحله گزینش</span></div>
            <div><b>۱</b><span>پرونده یکپارچه</span></div>
            <div><b>۱۰۰٪</b><span>تجربه فارسی و RTL</span></div>
          </div>
        </div>
        <div className="showcase-foot">اطلاعات شما در مسیر رمزگذاری‌شده و با دسترسی کنترل‌شده پردازش می‌شود.</div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-heading">
            <span className="eyebrow">ورود به حساب</span>
            <h2>خوش آمدید</h2>
            <p>برای مشاهده درخواست‌ها، کد ملی و شماره موبایل خود را وارد کنید.</p>
          </div>
          <form onSubmit={submit}>
            <label className={"field " + (validationErrors.national_id ? "has-error" : "")}>
              <span>کد ملی</span>
              <input
                inputMode="numeric"
                autoComplete="username"
                maxLength={10}
                value={nationalId}
                onChange={(e) => { clearFieldError("national_id"); clearFieldError("form"); setNationalId(e.target.value); }}
                placeholder="مثلاً ۰۰۱۲۳۴۵۶۷۸"
                required
                aria-invalid={validationErrors.national_id ? "true" : undefined}
              />
              <FieldError error={validationErrors.national_id} />
            </label>
            <label className={"field " + (validationErrors.mobile ? "has-error" : "")}>
              <span>شماره موبایل</span>
              <input
                inputMode="tel"
                autoComplete="tel"
                maxLength={13}
                value={mobile}
                onChange={(e) => { clearFieldError("mobile"); clearFieldError("form"); setMobile(e.target.value); }}
                placeholder="۰۹۱۲…"
                required
                aria-invalid={validationErrors.mobile ? "true" : undefined}
              />
              <FieldError error={validationErrors.mobile} />
            </label>
            {validationErrors.form && <div className="validation-summary" role="alert" aria-live="polite"><div className="validation-summary-icon">!</div><div><strong>خطا در ورود</strong><p>{validationErrors.form}</p></div></div>}
            <button className="primary-button wide" disabled={busy}>
              {busy ? <><span className="button-spinner" /> در حال ورود…</> : <>ورود به پنل <span>←</span></>}
            </button>
          </form>
          <div className="auth-note">
            <span>i</span>
            <div>نشست کاربری داخل cookie امن نگهداری می‌شود؛ توکن احراز هویت در مرورگر ذخیره نمی‌شود.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">R</div>
        <div><strong>Recruit</strong><span>پنل کاربری</span></div>
      </div>
      <div className="topbar-actions">
        <div className="user-chip">
          <div className="avatar">{(user?.national_id || "ک").slice(-2)}</div>
          <div><strong>{user?.mobile || "کاربر"}</strong><span>حساب کاربری</span></div>
        </div>
        <button className="ghost-button" onClick={onLogout}>خروج</button>
      </div>
    </header>
  );
}

function Toast({ toast, onClose }) {
  return (
    <div className={"toast " + (toast.type || "info")}>
      <div className="toast-dot" />
      <div>
        <strong>{toast.type === "success" ? "انجام شد" : toast.type === "error" ? "خطا" : "توجه"}</strong>
        <p>{toast.text}</p>
        {toast.requestId && <small>کد پیگیری خطا: {toast.requestId}</small>}
      </div>
      <button onClick={onClose} aria-label="بستن">×</button>
    </div>
  );
}

function Dashboard({ user, onOpenRequest, onCreated, onError }) {
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const load = async () => {
    try {
      const [reqs, requestTypes] = await Promise.all([api.requests(), api.requestTypes()]);
      setRequests(normalizeList(reqs));
      setTypes(normalizeList(requestTypes));
    } catch (error) {
      onError({ type: "error", text: error.message, requestId: error.requestId });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createRequest = async () => {
    if (!selectedType) return;
    setCreating(true);
    try {
      const request = await api.createRequest(selectedType);
      setCreating(false);
      setSelectedType(null);
      onCreated(request);
    } catch (error) {
      setCreating(false);
      onError({ type: "error", text: error.message, requestId: error.requestId });
    }
  };

  const inProgress = requests.filter((item) => ["IN_PROGRESS", "RETURNED"].includes(item.status));
  const finished = requests.filter((item) => !["IN_PROGRESS", "RETURNED"].includes(item.status));

  return (
    <main className="page dashboard-page">
      <section className="hero-row">
        <div>
          <span className="eyebrow">داشبورد شخصی</span>
          <h1>سلام، پرونده‌تان از اینجا ادامه پیدا می‌کند.</h1>
          <p>هر درخواست را از همان مرحله‌ای که متوقف شده بود ادامه دهید.</p>
        </div>
        <button className="primary-button" onClick={() => setSelectedType(types[0] || null)}>
          <span className="plus">+</span> ثبت درخواست جدید
        </button>
      </section>

      <section className="stats-grid">
        <StatCard label="کل درخواست‌ها" value={requests.length} icon="↗" />
        <StatCard label="در حال تکمیل" value={inProgress.length} icon="◷" />
        <StatCard label="ثبت نهایی شده" value={finished.length} icon="✓" />
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div><span className="eyebrow">درخواست‌های شما</span><h2>پرونده‌ها</h2></div>
          <span className="section-count">{requests.length} مورد</span>
        </div>
        {loading ? (
          <div className="skeleton-list"><SkeletonCard /><SkeletonCard /></div>
        ) : requests.length === 0 ? (
          <EmptyState onCreate={() => setSelectedType(types[0] || null)} />
        ) : (
          <div className="request-grid">
            {requests.map((request) => (
              <RequestCard key={String(request.id)} request={request} onOpen={onOpenRequest} />
            ))}
          </div>
        )}
      </section>

      {selectedType && (
        <Modal title="درخواست جدید" onClose={() => setSelectedType(null)}>
          <div className="modal-copy">
            <span className="eyebrow">انتخاب نوع پرونده</span>
            <h3>با چه نوع درخواستی شروع کنیم؟</h3>
            <p>نوع پرونده، مسیر مرحله‌ای و اطلاعات لازم برای ادامه کار را مشخص می‌کند.</p>
          </div>
          <div className="request-type-list">
            {types.map((item) => (
              <button
                key={item.code}
                className={"request-type " + (selectedType === item.code ? "selected" : "")}
                onClick={() => setSelectedType(item.code)}
              >
                <div className="type-icon">{item.code === "SCREENING" ? "S" : "E"}</div>
                <div><strong>{item.title}</strong><span>{item.workflow_key === "screening" ? "فرآیند کامل گزینش" : "فرآیند استخدام"}</span></div>
                <span className="type-arrow">←</span>
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button className="ghost-button" onClick={() => setSelectedType(null)}>انصراف</button>
            <button className="primary-button" disabled={creating} onClick={createRequest}>{creating ? "در حال ایجاد…" : "ایجاد پرونده و شروع"}</button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function StatCard({ label, value, icon }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function RequestCard({ request, onOpen }) {
  const [label, tone] = statusLabel(request.status);
  const step = STEP_META[request.current_step_key];
  const progressText = request.workflow_key === "screening" ? "فرآیند گزینش" : "فرآیند استخدام";
  return (
    <article className="request-card">
      <div className="request-card-top">
        <div className="request-symbol">{request.workflow_key === "screening" ? "S" : "E"}</div>
        <div className={"status-badge " + tone}><i />{label}</div>
      </div>
      <div className="request-card-title">
        <span>{progressText}</span>
        <h3>{step?.title || request.current_step_key}</h3>
      </div>
      <div className="request-code"><span>کد رهگیری</span><b>{request.tracking_code}</b></div>
      <div className="request-meta"><span>ایجاد شده</span><span>{formatDate(request.created_at)}</span></div>
      <button className="outline-button wide" onClick={() => onOpen(request)}>
        {["SUBMITTED", "APPROVED", "COMPLETED"].includes(request.status) ? "مشاهده پرونده" : "ادامه تکمیل پرونده"} <span>←</span>
      </button>
    </article>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="empty-card">
      <div className="empty-art"><span>R</span></div>
      <h3>هنوز درخواستی ثبت نکرده‌اید</h3>
      <p>اولین پرونده را بسازید تا مسیر مرحله‌ای برای شما فعال شود.</p>
      <button className="primary-button" onClick={onCreate}>شروع اولین درخواست</button>
    </div>
  );
}

function SkeletonCard() {
  return <div className="skeleton-card"><div className="skeleton-line short" /><div className="skeleton-line title" /><div className="skeleton-line" /><div className="skeleton-line" /></div>;
}

function RequestWizard({ user, request, onBack, onError }) {
  const [appRequest, setAppRequest] = useState(request);
  const [steps, setSteps] = useState([]);
  const [resume, setResume] = useState(null);
  const [index, setIndex] = useState(0);
  const [stepData, setStepData] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(null);
  const [draftStatus, setDraftStatus] = useState("idle");
  const [lastDraftSaved, setLastDraftSaved] = useState(null);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const validationSummaryRef = useRef(null);
  const autosaveSequence = useRef(0);

  const workflowSteps = useMemo(() => {
    if (appRequest?.workflow_key === "employment") {
      return ["personal", "education", "employment", "documents", "review", "declaration"];
    }
    return FLOW_SECTIONS.flatMap(([, items]) => items);
  }, [appRequest]);

  const currentKey = workflowSteps[index] || workflowSteps[0];
  const backendCurrentIndex = Math.max(0, workflowSteps.indexOf(resume?.current_step));
  const readOnly = resume?.status === "SUBMITTED" || resume?.status === "APPROVED" || resume?.status === "REJECTED" || index < backendCurrentIndex;

  const clearValidationError = (fieldPath) => {
    setValidationErrors((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key === fieldPath || key.startsWith(fieldPath + ".")) delete next[key];
      });
      return next;
    });
  };

  const applyValidationErrors = (errors) => {
    const next = {};
    (errors || []).forEach((item) => {
      const key = item.path || "";
      if (!next[key]) next[key] = item.message;
    });
    setValidationErrors(next);
    if (Object.keys(next).length > 0) {
      requestAnimationFrame(() => validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const [requestData, resumeData, stepsData, countriesData] = await Promise.all([
          api.request(request.id),
          api.resume(request.id),
          api.steps(request.id),
          api.countries(),
        ]);
        setAppRequest(requestData);
        setResume(resumeData);
        setSteps(normalizeList(stepsData));
        setCountries(normalizeList(countriesData));
        const initialIndex = Math.max(0, workflowSteps.indexOf(resumeData.current_step));
        setIndex(initialIndex);
      } catch (error) {
        onError({ type: "error", text: error.message, requestId: error.requestId });
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [request.id]);

  useEffect(() => {
    if (!appRequest || !currentKey) return;
    let cancelled = false;
    const load = async () => {
      setStepData(null);
      setForm(null);
      setDraftHydrated(false);
      setDraftStatus("idle");
      setLastDraftSaved(null);
      setValidationErrors({});
      try {
        if (currentKey === "documents") {
          const docs = await api.documents(appRequest.id);
          if (!cancelled) setDocuments(normalizeList(docs));
          return;
        }
        if (currentKey === "review") return;

        const [dataResult, draftResult] = await Promise.allSettled([
          api.stepData(appRequest.id, currentKey),
          api.stepDraft(appRequest.id, currentKey),
        ]);

        if (cancelled) return;

        const data = dataResult.status === "fulfilled" ? dataResult.value : null;
        if (dataResult.status === "rejected" && ![404, 409].includes(dataResult.reason?.status)) {
          onError({ type: "error", text: dataResult.reason.message, requestId: dataResult.reason.requestId });
        }

        const draft = draftResult.status === "fulfilled" ? draftResult.value : null;
        const merged = mergeDraft(makeForm(currentKey, data, user), draft?.data);
        setStepData(data);
        setForm(merged);
        setLastDraftSaved(draft?.updated_at || null);
        setDraftHydrated(true);
        if (draft?.data) setDraftStatus("saved");
      } catch (error) {
        if (!cancelled) {
          onError({ type: "error", text: error.message, requestId: error.requestId });
          setForm(makeForm(currentKey, null, user));
          setDraftHydrated(true);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [appRequest, currentKey, user]);

  useEffect(() => {
    if (
      !appRequest ||
      !form ||
      !draftHydrated ||
      readOnly ||
      currentKey === "documents" ||
      currentKey === "review"
    ) return undefined;

    const sequence = ++autosaveSequence.current;
    setDraftStatus("dirty");
    const timer = setTimeout(async () => {
      setDraftStatus("saving");
      try {
        const result = await api.saveDraft(appRequest.id, currentKey, cleanPayload(form));
        if (sequence !== autosaveSequence.current) return;
        setLastDraftSaved(result.updated_at);
        setDraftStatus("saved");
      } catch {
        if (sequence === autosaveSequence.current) setDraftStatus("error");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [appRequest?.id, currentKey, form, draftHydrated, readOnly]);

  const refreshWorkflow = async (nextIndexOverride) => {
    const [requestData, resumeData, stepsData] = await Promise.all([
      api.request(appRequest.id),
      api.resume(appRequest.id),
      api.steps(appRequest.id),
    ]);
    setAppRequest(requestData);
    setResume(resumeData);
    setSteps(normalizeList(stepsData));
    const target = nextIndexOverride ?? workflowSteps.indexOf(resumeData.current_step);
    setIndex(Math.max(0, target));
    if (resumeData.status === "SUBMITTED") {
      onError({ type: "success", text: "پرونده با موفقیت ثبت نهایی شد." });
    }
  };

  const complete = async () => {
    if (readOnly) return;
    const localErrors = validateStep(currentKey, form || {});
    if (Object.keys(localErrors).length > 0) {
      setValidationErrors(localErrors);
      requestAnimationFrame(() => validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      onError({ type: "error", text: "برخی از فیلدهای فرم نیاز به اصلاح دارند." });
      return;
    }
    setValidationErrors({});
    setSaving(true);
    try {
      let result;
      if (currentKey === "documents" || currentKey === "review") {
        result = await api.completeGeneric(appRequest.id, currentKey);
      } else {
        result = await api.completeStep(appRequest.id, currentKey, cleanPayload(form || {}));
      }
      if (currentKey !== "documents" && currentKey !== "review") {
        try { await api.deleteDraft(appRequest.id, currentKey); } catch {}
      }
      await refreshWorkflow(result.next_step ? workflowSteps.indexOf(result.next_step) : workflowSteps.length - 1);
    } catch (error) {
      if (error.validationErrors?.length) {
        applyValidationErrors(error.validationErrors);
        onError({
          type: "error",
          text: "سامانه چند مورد از اطلاعات واردشده را معتبر ندانست؛ جزئیات کنار فیلدها نمایش داده شده است.",
          requestId: error.requestId,
        });
      } else {
        onError({ type: "error", text: error.message, requestId: error.requestId });
      }
    } finally {
      setSaving(false);
    }
  };

  const movePrevious = () => setIndex((value) => Math.max(0, value - 1));
  const moveTo = (target) => {
    if (target <= backendCurrentIndex) setIndex(target);
  };

  if (loading) return <div className="page"><div className="wizard-loading"><div className="loading-spinner" /><strong>در حال بارگذاری پرونده…</strong></div></div>;

  const meta = STEP_META[currentKey] || { title: currentKey, kicker: "" };
  const completionCount = Math.min(workflowSteps.length, backendCurrentIndex + (resume?.status === "SUBMITTED" ? 0 : 0));
  const status = statusLabel(appRequest?.status);

  return (
    <main className="page wizard-page">
      <div className="wizard-toolbar">
        <button className="back-button" onClick={onBack}>→ <span>بازگشت به پرونده‌ها</span></button>
        <div className="wizard-identity"><span>کد رهگیری</span><b>{appRequest.tracking_code}</b><i className="divider" /><span>{status[0]}</span></div>
      </div>

      <div className="wizard-layout">
        <aside className="wizard-sidebar">
          <div className="wizard-progress-head">
            <div><span className="eyebrow">مسیر پرونده</span><strong>{backendCurrentIndex + 1} از {workflowSteps.length}</strong></div>
            <div className="progress-track"><span style={{ width: ((resume?.status === "SUBMITTED" ? 100 : (backendCurrentIndex / workflowSteps.length) * 100)) + "%" }} /></div>
          </div>
          <div className="step-sections">
            {appRequest.workflow_key === "employment" ? (
              <StepRail items={workflowSteps} currentKey={currentKey} backendCurrentIndex={backendCurrentIndex} onMove={moveTo} />
            ) : FLOW_SECTIONS.map(([heading, items]) => (
              <div className="step-section" key={heading}>
                <span className="step-section-title">{heading}</span>
                {items.map((key) => {
                  const target = workflowSteps.indexOf(key);
                  return <StepRailItem key={key} keyName={key} active={currentKey === key} completed={target < backendCurrentIndex || resume?.status === "SUBMITTED"} onClick={() => moveTo(target)} order={target + 1} />;
                })}
              </div>
            ))}
          </div>
          <div className="privacy-card"><span>✓</span><div><strong>حفاظت از اطلاعات</strong><small>این صفحه اطلاعات پرونده را از طریق نشست امن و بدون ذخیره توکن در مرورگر مصرف می‌کند.</small></div></div>
        </aside>

        <section className="wizard-content">
          <div className="step-header">
            <div>
              <span className="eyebrow">{meta.kicker}</span>
              <h1>{meta.title}</h1>
              <p>{stepDescription(currentKey)}</p>
              {!readOnly && !["documents", "review"].includes(currentKey) && (
                <DraftStatus state={draftStatus} updatedAt={lastDraftSaved} />
              )}
            </div>
            <div className="step-number">{String(index + 1).padStart(2, "0")}</div>
          </div>

          {Object.keys(validationErrors).length > 0 && (
            <ValidationSummary errors={validationErrors} summaryRef={validationSummaryRef} />
          )}

          {resume?.status === "RETURNED" && backendCurrentIndex === index && (
            <div className="return-alert"><strong>این مرحله برای اصلاح برگشت داده شده است.</strong><span>پس از اصلاح اطلاعات، دکمه ثبت و ادامه را بزنید تا دوباره وارد فرآیند بررسی شود.</span></div>
          )}

          {currentKey === "documents" ? (
            <DocumentsStep documents={documents} requestId={appRequest.id} onUploaded={(doc) => setDocuments((items) => [doc, ...items])} onError={onError} readOnly={readOnly} />
          ) : currentKey === "review" ? (
            <ReviewStep workflowSteps={workflowSteps} steps={steps} currentIndex={backendCurrentIndex} request={appRequest} />
          ) : (
            <StepRenderer
              stepKey={currentKey}
              form={form}
              setForm={setForm}
              data={stepData}
              countries={countries}
              readOnly={readOnly}
              errors={validationErrors}
              clearValidationError={clearValidationError}
            />
          )}

          <div className="wizard-footer">
            <div className="footer-left">
              {index > 0 && <button className="ghost-button" onClick={movePrevious}>مرحله قبل</button>}
            </div>
            <div className="footer-right">
              {readOnly ? (
                <button className="outline-button" onClick={() => setIndex(backendCurrentIndex)}>برگشت به مرحله جاری</button>
              ) : (
                <button className="primary-button" disabled={saving} onClick={complete}>
                  {saving ? <><span className="button-spinner" /> در حال ثبت…</> : (currentKey === "declaration" ? "تأیید و ثبت نهایی" : "ثبت مرحله و ادامه")}
                  <span>←</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StepRail({ items, currentKey, backendCurrentIndex, onMove }) {
  return <div className="step-rail">{items.map((key, index) => <StepRailItem key={key} keyName={key} active={currentKey === key} completed={index < backendCurrentIndex} onClick={() => onMove(index)} order={index + 1} />)}</div>;
}

function StepRailItem({ keyName, active, completed, onClick, order }) {
  const meta = STEP_META[keyName] || { title: keyName };
  return (
    <button className={"step-item " + (active ? "active" : "") + " " + (completed ? "completed" : "")} onClick={onClick} disabled={!completed && !active}>
      <span className="step-dot">{completed ? "✓" : order}</span>
      <span><small>{meta.kicker}</small><strong>{meta.title}</strong></span>
      {active && <i>●</i>}
    </button>
  );
}

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

function MarriageStep({ form, setForm, readOnly, errors, clearValidationError }) {
  const spouse = form.spouse || {};
  const update = (key, value) => {
    clearValidationError(key);
    setForm({ ...form, [key]: value });
  };
  const updateSpouse = (key, value) => {
    clearValidationError(`spouse.${key}`);
    setForm({ ...form, spouse: { ...spouse, [key]: value } });
  };
  return (
    <div className="form-stack">
      <FormSection title="وضعیت تأهل" hint="مطابق اطلاعات واقعی و آخرین وضعیت ثبتی ثبت کنید.">
        <div className="field-grid">
          <SelectField label="وضعیت" value={form.status} onChange={(v) => update("status", v)} error={getFieldError(errors, "status")} options={["مجرد", "در شرف ازدواج", "متأهل", "متارکه", "فوت همسر", "ازدواج مجدد"]} readOnly={readOnly} />
          <TextField label="تاریخ ازدواج" type="date" value={form.marriage_date} onChange={(v) => update("marriage_date", v)} error={getFieldError(errors, "marriage_date")} readOnly={readOnly} />
          <TextField label="تاریخ پایان" type="date" value={form.end_date} onChange={(v) => update("end_date", v)} error={getFieldError(errors, "end_date")} readOnly={readOnly} />
          <TextField label="علت پایان" value={form.end_reason} onChange={(v) => update("end_reason", v)} error={getFieldError(errors, "end_reason")} readOnly={readOnly} />
        </div>
      </FormSection>
      {["متأهل", "ازدواج مجدد"].includes(form.status) ? (
        <FormSection title="مشخصات همسر" hint="اطلاعات همسر را مطابق آخرین وضعیت ثبت کنید.">
          <div className="field-grid">
            <TextField label="نام" value={spouse.first_name} onChange={(v) => updateSpouse("first_name", v)} error={getFieldError(errors, "spouse.first_name")} readOnly={readOnly} />
            <TextField label="نام خانوادگی" value={spouse.last_name} onChange={(v) => updateSpouse("last_name", v)} error={getFieldError(errors, "spouse.last_name")} readOnly={readOnly} />
            <TextField label="نام پدر" value={spouse.father_name} onChange={(v) => updateSpouse("father_name", v)} error={getFieldError(errors, "spouse.father_name")} readOnly={readOnly} />
            <TextField label="کد ملی" value={spouse.national_id} onChange={(v) => updateSpouse("national_id", v)} error={getFieldError(errors, "spouse.national_id")} readOnly={readOnly} />
            <TextField label="تاریخ تولد" type="date" value={spouse.birth_date} onChange={(v) => updateSpouse("birth_date", v)} error={getFieldError(errors, "spouse.birth_date")} readOnly={readOnly} />
            <TextField label="شغل" value={spouse.occupation} onChange={(v) => updateSpouse("occupation", v)} error={getFieldError(errors, "spouse.occupation")} readOnly={readOnly} />
            <TextField label="تحصیلات" value={spouse.education} onChange={(v) => updateSpouse("education", v)} error={getFieldError(errors, "spouse.education")} readOnly={readOnly} />
            <TextArea label="ملاحظات" value={form.notes} onChange={(v) => update("notes", v)} error={getFieldError(errors, "notes")} full readOnly={readOnly} />
          </div>
        </FormSection>
      ) : (
        <div className="inline-info"><strong>در این وضعیت، اطلاعات همسر لازم نیست.</strong><span>در صورت تغییر وضعیت تأهل، می‌توانید این مرحله را اصلاح کنید.</span></div>
      )}
    </div>
  );
}

function PeopleStep({ kind, form, setForm, countries, readOnly, errors, clearValidationError }) {
  const people = normalizeList(form?.people);
  const isFamily = kind === "family";
  const empty = () => ({
    person_id: null, role_type: isFamily ? "FATHER" : "FRIEND", relation_to_applicant: "",
    first_name: "", last_name: "", father_name: "", national_id: "", birth_date: "",
    gender: "", alive_status: "", education: "", occupation: "", contacts: [], addresses: [], notes: "",
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
              <SelectField label="نقش" value={item.role_type} onChange={(v) => update("role_type", v)} error={getFieldError(errors, `${prefix}.role_type`)} options={isFamily ? ["FATHER", "MOTHER", "SIBLING", "CHILD", "SPOUSE_FATHER", "SPOUSE_MOTHER", "SPOUSE_SIBLING", "GRANDPARENT"] : ["FRIEND", "NEIGHBOR", "REFERENCE", "RELATIVE", "FAMILY_FRIEND", "MILITARY_RELATIVE"]} readOnly={readOnly} />
              <TextField label="نسبت" value={item.relation_to_applicant} onChange={(v) => update("relation_to_applicant", v)} error={getFieldError(errors, `${prefix}.relation_to_applicant`)} readOnly={readOnly} />
              <TextField label="نام" value={item.first_name} onChange={(v) => update("first_name", v)} error={getFieldError(errors, `${prefix}.first_name`)} readOnly={readOnly} />
              <TextField label="نام خانوادگی" value={item.last_name} onChange={(v) => update("last_name", v)} error={getFieldError(errors, `${prefix}.last_name`)} readOnly={readOnly} />
              <TextField label="نام پدر" value={item.father_name} onChange={(v) => update("father_name", v)} error={getFieldError(errors, `${prefix}.father_name`)} readOnly={readOnly} />
              {isFamily && <TextField label="کد ملی" value={item.national_id} onChange={(v) => update("national_id", v)} error={getFieldError(errors, `${prefix}.national_id`)} readOnly={readOnly} />}
              <TextField label="تاریخ تولد" type="date" value={item.birth_date} onChange={(v) => update("birth_date", v)} error={getFieldError(errors, `${prefix}.birth_date`)} readOnly={readOnly} />
              <TextField label="تحصیلات" value={item.education} onChange={(v) => update("education", v)} error={getFieldError(errors, `${prefix}.education`)} readOnly={readOnly} />
              <TextField label="شغل" value={item.occupation} onChange={(v) => update("occupation", v)} error={getFieldError(errors, `${prefix}.occupation`)} readOnly={readOnly} />
              {isFamily && <SelectField label="جنسیت" value={item.gender} onChange={(v) => update("gender", v)} error={getFieldError(errors, `${prefix}.gender`)} options={["مرد", "زن"]} readOnly={readOnly} />}
              {isFamily && <SelectField label="وضعیت حیات" value={item.alive_status} onChange={(v) => update("alive_status", v)} error={getFieldError(errors, `${prefix}.alive_status`)} options={["زنده", "فوت شده"]} readOnly={readOnly} />}
              <TextArea label="توضیحات" value={item.notes} onChange={(v) => update("notes", v)} error={getFieldError(errors, `${prefix}.notes`)} full readOnly={readOnly} />
            </div>

            <div className="subeditor">
              <ListEditor title="تماس‌ها" items={normalizeList(item.contacts)} setItems={(items) => setItem({ ...item, contacts: items })}
                clearValidationError={clearValidationError} errorPrefix={`${prefix}.contacts`}
                empty={() => ({ contact_type: "موبایل", value: "", owner_type: "", owner_name: "", is_primary: false })} readOnly={readOnly} compact
                render={(contact, setContact, contactIndex) => (
                  <div className="mini-grid">
                    <TextField label="نوع" value={contact.contact_type} onChange={(v) => { const p=`${prefix}.contacts.${contactIndex}.contact_type`; clearValidationError(p); setContact({ ...contact, contact_type: v }); }} error={getFieldError(errors, `${prefix}.contacts.${contactIndex}.contact_type`)} readOnly={readOnly} />
                    <TextField label="شماره / شناسه" value={contact.value} onChange={(v) => { const p=`${prefix}.contacts.${contactIndex}.value`; clearValidationError(p); setContact({ ...contact, value: v }); }} error={getFieldError(errors, `${prefix}.contacts.${contactIndex}.value`)} readOnly={readOnly} />
                  </div>
                )}
              />
              <ListEditor title="نشانی‌ها" items={normalizeList(item.addresses)} setItems={(items) => setItem({ ...item, addresses: items })}
                clearValidationError={clearValidationError} errorPrefix={`${prefix}.addresses`}
                empty={() => ({ address_type: "CURRENT", country_id: countries[0]?.id || "", postal_code: "", address_line: "", phone: "", from_date: "", to_date: "" })}
                readOnly={readOnly} compact
                render={(address, setAddress, addressIndex) => <AddressFields item={address} setItem={setAddress} countries={countries} readOnly={readOnly} errors={errors} errorPrefix={`${prefix}.addresses.${addressIndex}`} clearValidationError={clearValidationError} />}
              />
            </div>
          </div>
        );
      }}
    />
  );
}

function ResidenceStep({ form, setForm, countries, readOnly, errors, clearValidationError }) {
  const addresses = normalizeList(form?.addresses);
  return (
    <ListEditor title="نشانی‌های محل سکونت" hint="از ده سال پیش تا امروز، به ترتیب زمانی، نشانی‌ها را ثبت کنید."
      items={addresses} setItems={(items) => setForm({ addresses: items })} clearValidationError={clearValidationError} errorPrefix="addresses"
      empty={() => ({ address_type: "RESIDENCE", country_id: countries[0]?.id || "", postal_code: "", address_line: "", phone: "", from_date: "", to_date: "" })}
      readOnly={readOnly}
      render={(item, setItem, index) => <AddressFields item={item} setItem={setItem} countries={countries} readOnly={readOnly} residence errors={errors} errorPrefix={`addresses.${index}`} clearValidationError={clearValidationError} />}
    />
  );
}

function AddressFields({ item, setItem, countries, readOnly, residence, errors, errorPrefix = "", clearValidationError }) {
  const fieldPath = (key) => errorPrefix ? `${errorPrefix}.${key}` : key;
  const update = (key, value) => {
    clearValidationError?.(fieldPath(key));
    setItem({ ...item, [key]: value });
  };
  return (
    <div className="field-grid">
      <SelectField label="نوع آدرس" value={item.address_type} onChange={(v) => update("address_type", v)} error={getFieldError(errors, fieldPath("address_type"))} options={residence ? ["RESIDENCE", "PREVIOUS_RESIDENCE"] : ["CURRENT", "FAMILY", "WORK"]} readOnly={readOnly} />
      <SelectField label="کشور" value={item.country_id} onChange={(v) => update("country_id", v)} error={getFieldError(errors, fieldPath("country_id"))} options={countries.map((c) => ({ value: c.id, label: c.name }))} readOnly={readOnly} />
      <TextField label="کد پستی" value={item.postal_code} onChange={(v) => update("postal_code", v)} error={getFieldError(errors, fieldPath("postal_code"))} readOnly={readOnly} />
      <TextField label="تلفن" value={item.phone} onChange={(v) => update("phone", v)} error={getFieldError(errors, fieldPath("phone"))} readOnly={readOnly} />
      <TextField label="تاریخ شروع" type="date" value={item.from_date} onChange={(v) => update("from_date", v)} error={getFieldError(errors, fieldPath("from_date"))} readOnly={readOnly} />
      <TextField label="تاریخ پایان" type="date" value={item.to_date} onChange={(v) => update("to_date", v)} error={getFieldError(errors, fieldPath("to_date"))} readOnly={readOnly} />
      <TextArea label="آدرس دقیق" value={item.address_line} onChange={(v) => update("address_line", v)} error={getFieldError(errors, fieldPath("address_line"))} full readOnly={readOnly} />
    </div>
  );
}

function DeclarationStep({ form, setForm, readOnly, errors, clearValidationError }) {
  const declaration = "اینجانب متعهد می‌شوم کلیه اطلاعات خواسته شده در پرسشنامه را صادقانه، در صورت لزوم با ارائه مدرک و مستند و به‌صورت خوانا و دقیق، شامل آدرس، شماره تماس، اسامی منابع و موارد خواسته‌شده ثبت نمایم. در صورت عدم پاسخ، پاسخ غیرصحیح یا ناقص بودن اطلاعات، مرجع گزینش می‌تواند مطابق ضوابط تصمیم مقتضی اتخاذ نماید.";
  return (
    <div className="form-stack">
      <div className="declaration-card">
        <div className="declaration-number">01</div>
        <div><span className="eyebrow">متن تعهدنامه</span><h3>تعهد ثبت اطلاعات صحیح</h3><p>{declaration}</p></div>
      </div>
      <label className={"accept-card " + (getFieldError(errors, "accepted") ? "has-error" : "")}>
        <input type="checkbox" checked={Boolean(form.accepted)}
          onChange={(e) => { clearValidationError("accepted"); setForm({ ...form, accepted: e.target.checked, declaration_version: "1" }); }}
          disabled={readOnly} aria-invalid={getFieldError(errors, "accepted") ? "true" : undefined} />
        <span className="check-custom">✓</span>
        <div><strong>متن تعهدنامه را مطالعه کردم و آن را تأیید می‌کنم.</strong><small>پس از تأیید، این مرحله پرونده را برای ثبت نهایی ارسال می‌کند.</small><FieldError error={getFieldError(errors, "accepted")} /></div>
      </label>
    </div>
  );
}

function RecordStep({ fields, form, setForm, countries, readOnly, errors, clearValidationError }) {
  const records = normalizeList(form?.records);
  return (
    <ListEditor title="موارد ثبت‌شده" hint="در صورت نداشتن سابقه، می‌توانید این بخش را خالی بگذارید و ادامه دهید."
      items={records} setItems={(items) => setForm({ records: items })} clearValidationError={clearValidationError} errorPrefix="records"
      empty={() => emptyRecord(fields)} readOnly={readOnly}
      render={(record, setRecord, index) => {
        const prefix = `records.${index}`;
        return (
          <div className="record-card">
            <div className="record-head"><span>ردیف {index + 1}</span><strong>{fields[0]?.label || "مورد"}</strong></div>
            <div className="field-grid">
              {fields.filter((field) => !["province_id", "county_id", "city_id", "village_id"].includes(field.key)).map((field) => (
                <FieldInput key={field.key} field={field} value={record[field.key]} countries={countries}
                  onChange={(value) => { clearValidationError(`${prefix}.${field.key}`); setRecord({ ...record, [field.key]: value }); }}
                  readOnly={readOnly} record={record} error={getFieldError(errors, `${prefix}.${field.key}`)} />
              ))}
              {fields.some((field) => ["province_id", "county_id", "city_id", "village_id"].includes(field.key)) && (
                <GeoFields record={record} setRecord={setRecord} countries={countries} readOnly={readOnly}
                  errors={errors} errorPrefix={prefix} clearValidationError={clearValidationError} />
              )}
            </div>
          </div>
        );
      }}
    />
  );
}

function TextareaStep({ value, onChange, readOnly, error }) {
  return <FormSection title="توضیحات تکمیلی" hint="هر نکته‌ای که در بخش‌های قبل پوشش داده نشده و لازم است ثبت شود."><TextArea label="متن توضیحات" value={value} onChange={onChange} error={error} rows={12} full readOnly={readOnly} /></FormSection>;
}

function FormSection({ title, hint, children }) {
  return <section className="form-section"><div className="form-section-head"><div><h3>{title}</h3><p>{hint}</p></div></div>{children}</section>;
}

function ListEditor({ title, hint, items, setItems, empty, render, readOnly, compact = false, clearValidationError, errorPrefix }) {
  const list = normalizeList(items);
  const clearListErrors = () => errorPrefix && clearValidationError?.(errorPrefix);
  return (
    <section className={"form-section " + (compact ? "compact-section" : "")}>
      <div className="form-section-head">
        <div><h3>{title}</h3>{hint && <p>{hint}</p>}</div>
        {!readOnly && <button className="add-button" onClick={() => { clearListErrors(); setItems([...list, empty()]); }}>+ افزودن مورد</button>}
      </div>
      {list.length === 0 ? (
        <div className="inline-empty"><span>∅</span><p>هنوز موردی ثبت نشده است.</p>{!readOnly && <button className="text-button" onClick={() => { clearListErrors(); setItems([empty()]); }}>افزودن اولین مورد</button>}</div>
      ) : (
        <div className="list-stack">{list.map((item, index) => {
          const setItem = (next) => setItems(list.map((entry, i) => i === index ? next : entry));
          return <div key={index} className="list-item-wrap">{render(item, setItem, index)}{!readOnly && <button className="remove-button" onClick={() => { clearListErrors(); setItems(list.filter((_, i) => i !== index)); }}>حذف این مورد</button>}</div>;
        })}</div>
      )}
    </section>
  );
}

function FieldInput({ field, value, onChange, countries, readOnly, record, error }) {
  if (field.visibleWhen && !field.visibleWhen(record || {})) return null;
  if (field.type === "country") {
    return <SelectField label={field.label} value={value} onChange={onChange} error={error} options={countries.map((c) => ({ value: c.id, label: c.name }))} required={field.required} readOnly={readOnly} />;
  }
  if (field.type === "select") return <SelectField label={field.label} value={value} onChange={onChange} error={error} options={field.options || []} required={field.required} readOnly={readOnly} />;
  if (field.type === "textarea") return <TextArea label={field.label} value={value} onChange={onChange} error={error} required={field.required} full={field.full} readOnly={readOnly} />;
  if (field.type === "boolean") {
    const selected = value === true ? "true" : value === false ? "false" : "";
    return <SelectField label={field.label} value={selected} error={error} onChange={(v) => onChange(v === "" ? null : v === "true")} options={[{ value: "", label: "مشخص نشده" }, { value: "true", label: "بله" }, { value: "false", label: "خیر" }]} readOnly={readOnly} />;
  }
  return <TextField label={field.label} type={field.type} value={value} onChange={onChange} error={error} required={field.required} readOnly={readOnly} />;
}

function ValidationSummary({ errors, summaryRef }) {
  const entries = Object.entries(errors || {});
  if (entries.length === 0) return null;

  return (
    <section className="validation-summary" ref={summaryRef} role="alert" aria-live="polite">
      <div className="validation-summary-icon">!</div>
      <div>
        <strong>لطفاً موارد زیر را اصلاح کنید.</strong>
        <div className="validation-summary-list">
          {entries.map(([path, message]) => (
            <div key={path || message} className="validation-summary-item">
              <span>{formatErrorPath(path)}</span>
              <b>{message}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getFieldError(errors, path) {
  return errors?.[path] || null;
}

function formatErrorPath(path) {
  if (!path) return "اطلاعات فرم";
  const parts = path.split(".");
  const labels = {
    first_name: "نام",
    last_name: "نام خانوادگی",
    father_name: "نام پدر",
    national_id: "کد ملی",
    email: "ایمیل",
    status: "وضعیت",
    accepted: "تأیید تعهدنامه",
    country_id: "کشور",
    province_id: "استان",
    county_id: "شهرستان",
    city_id: "شهر",
    village_id: "روستا",
    address_line: "آدرس دقیق",
  };

  if (parts[0] === "records" && parts.length >= 3) {
    const index = Number(parts[1]);
    return Number.isNaN(index) ? labels[parts[2]] || parts[2] : `ردیف ${index + 1}، ${labels[parts[2]] || parts[2]}`;
  }
  if (parts[0] === "people" && parts.length >= 3) {
    const index = Number(parts[1]);
    return Number.isNaN(index) ? "عضو خانواده / منبع شناخت" : `مورد ${index + 1}، ${labels[parts[2]] || parts[2]}`;
  }
  if (parts[0] === "addresses" && parts.length >= 3) {
    const index = Number(parts[1]);
    return Number.isNaN(index) ? "آدرس" : `آدرس ${index + 1}، ${labels[parts[2]] || parts[2]}`;
  }
  if (parts[0] === "spouse" && parts.length >= 2) {
    return `همسر، ${labels[parts[1]] || parts[1]}`;
  }

  return labels[path] || path;
}

function FieldError({ error }) {
  return error ? <small className="field-error" role="alert">{error}</small> : null;
}

function TextField({ label, value, onChange, type = "text", required, readOnly, inputMode, error }) {
  return (
    <label className={"field " + (error ? "has-error" : "")}>
      <span>{label}{required && <em>*</em>}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={required && !readOnly}
        readOnly={readOnly}
        inputMode={inputMode}
        aria-invalid={error ? "true" : undefined}
      />
      <FieldError error={error} />
    </label>
  );
}

function TextArea({ label, value, onChange, required, full, readOnly, rows = 5, error }) {
  return (
    <label className={"field " + (full ? "full " : "") + (error ? "has-error" : "")}>
      <span>{label}{required && <em>*</em>}</span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={required && !readOnly}
        readOnly={readOnly}
        rows={rows}
        aria-invalid={error ? "true" : undefined}
      />
      <FieldError error={error} />
    </label>
  );
}

function SelectField({ label, value, onChange, options = [], required, readOnly, error }) {
  return (
    <label className={"field " + (error ? "has-error" : "")}>
      <span>{label}{required && <em>*</em>}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={required && !readOnly}
        disabled={readOnly}
        aria-invalid={error ? "true" : undefined}
      >
        <option value="">انتخاب کنید</option>
        {options.map((option) => {
          const normalized = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={String(normalized.value)} value={normalized.value}>{normalized.label}</option>;
        })}
      </select>
      <FieldError error={error} />
    </label>
  );
}

function DocumentsStep({ documents, requestId, onUploaded, onError, readOnly }) {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("identity");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!file) return;
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      onError({ type: "error", text: "حجم فایل نباید بیشتر از ۲۰ مگابایت باشد." });
      return;
    }
    setBusy(true);
    try {
      const doc = await api.uploadDocument(requestId, file, documentType, "documents");
      onUploaded(doc);
      setFile(null);
    } catch (error) {
      onError({ type: "error", text: error.message, requestId: error.requestId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-stack">
      <FormSection title="بارگذاری مدارک" hint="نوع مدرک را مشخص کنید و سپس فایل را انتخاب نمایید.">
        <div className="upload-grid">
          <label className="upload-zone">
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={readOnly} />
            <div className="upload-icon">↑</div>
            <strong>{file ? file.name : "فایل را انتخاب کنید"}</strong>
            <span>PDF, PNG, JPG, DOCX · حداکثر ۲۰MB</span>
          </label>
          <div className="upload-side">
            <SelectField label="نوع مدرک" value={documentType} onChange={setDocumentType} options={[
              { value: "identity", label: "مدرک هویتی" },
              { value: "education", label: "مدرک تحصیلی" },
              { value: "employment", label: "مدرک شغلی" },
              { value: "other", label: "سایر" },
            ]} readOnly={readOnly} />
            <button className="primary-button wide" disabled={!file || busy || readOnly} onClick={submit}>{busy ? "در حال بارگذاری…" : "بارگذاری امن فایل"}</button>
          </div>
        </div>
      </FormSection>
      <FormSection title="مدارک بارگذاری‌شده" hint="فایل‌های این پرونده به‌صورت اختصاصی برای خود درخواست نمایش داده می‌شوند.">
        {documents.length === 0 ? (
          <div className="inline-empty"><span>□</span><p>هنوز مدرکی بارگذاری نشده است.</p></div>
        ) : (
          <div className="document-list">{documents.map((doc) => (
            <div className="document-row" key={doc.id}>
              <div className="doc-icon">PDF</div>
              <div><strong>{doc.filename}</strong><span>{doc.document_type} · {(Number(doc.size_bytes || 0) / 1024 / 1024).toFixed(1)} MB</span></div>
              <a href={api.downloadDocumentUrl(doc.id)} rel="noreferrer">مشاهده</a>
            </div>
          ))}</div>
        )}
      </FormSection>
    </div>
  );
}

function ReviewStep({ workflowSteps, steps, currentIndex, request }) {
  const statusByKey = new Map();
  steps.forEach((step) => statusByKey.set(step.step_key, step.status));
  return (
    <div className="review-layout">
      <div className="review-hero"><div className="review-shield">✓</div><div><span className="eyebrow">قبل از ثبت نهایی</span><h2>یک بار همه مراحل را مرور کنید.</h2><p>در این نقطه، اطلاعات ثبت‌شده آماده بررسی نهایی هستند. صحت داده‌های شخصی و سوابق اعلامی را کنترل کنید.</p></div></div>
      <div className="review-grid">{workflowSteps.map((key, index) => {
        const [label, tone] = statusLabel(statusByKey.get(key) || (index < currentIndex ? "COMPLETED" : index === currentIndex ? "IN_PROGRESS" : "PENDING"));
        const meta = STEP_META[key];
        return <div className="review-item" key={key}><span className={"review-state " + tone}>{tone === "approved" ? "✓" : index + 1}</span><div><small>{meta?.kicker}</small><strong>{meta?.title}</strong></div><b>{label}</b></div>;
      })}</div>
      <div className="request-summary"><span>کد رهگیری</span><strong>{request.tracking_code}</strong><span>وضعیت فعلی</span><b>{statusLabel(request.status)[0]}</b></div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-top">
          <div><span className="eyebrow">Recruit</span><h3>{title}</h3></div>
          <button className="modal-close" onClick={onClose} aria-label="بستن">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
}

function cleanPayload(value) {
  if (Array.isArray(value)) return value.map(cleanPayload);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cleanPayload(entry)])
    );
  }
  return value === "" ? null : value;
}

function mergeDraft(base, draft) {
  if (!draft || typeof draft !== "object") return base;
  if (Array.isArray(base)) return Array.isArray(draft) ? draft : base;
  return { ...(base || {}), ...draft };
}

function validateStep(stepKey, form) {
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

  if (stepKey === "declaration" && !form?.accepted) {
    add("accepted", "برای ثبت نهایی باید تعهدنامه را تأیید کنید.");
  }

  if (stepKey === "family" || stepKey === "social_relations") {
    for (let i = 0; i < (form?.people || []).length; i += 1) {
      const person = form.people[i];
      if (empty(person.first_name)) add(`people.${i}.first_name`, "نام را وارد کنید.");
      if (empty(person.last_name)) add(`people.${i}.last_name`, "نام خانوادگی را وارد کنید.");
    }
  }

  if (stepKey === "residence") {
    for (let i = 0; i < (form?.addresses || []).length; i += 1) {
      const address = form.addresses[i];
      if (empty(address.country_id)) add(`addresses.${i}.country_id`, "کشور را انتخاب کنید.");
      if (empty(address.address_line)) add(`addresses.${i}.address_line`, "آدرس دقیق را وارد کنید.");
    }
  }

  const fields = RECORDS[stepKey];
  if (fields && Array.isArray(form?.records)) {
    for (let i = 0; i < form.records.length; i += 1) {
      for (const field of fields) {
        if (!field.required || (field.visibleWhen && !field.visibleWhen(form.records[i]))) continue;
        if (empty(form.records[i]?.[field.key])) {
          add(`records.${i}.${field.key}`, `«${field.label}» در این ردیف الزامی است.`);
        }
      }
    }
  }

  return errors;
}

function updatePersonField(item, key, value, setItem) {
  setItem({ ...item, [key]: value });
}

function DraftStatus({ state, updatedAt }) {
  const labels = {
    idle: "آماده ذخیره خودکار",
    dirty: "در حال ثبت تغییرات…",
    saving: "در حال ذخیره امن…",
    saved: "ذخیره شد",
    error: "ذخیره خودکار ناموفق بود",
  };
  return <div className={"draft-status " + state}><span className="draft-pulse" /><span>{labels[state] || labels.idle}</span>{updatedAt && state === "saved" && <time>{formatDate(updatedAt)}</time>}</div>;
}

function GeoFields({ record, setRecord, countries, readOnly, prefix = "", errors, errorPrefix = "", clearValidationError }) {
  const has = (key) => Object.prototype.hasOwnProperty.call(record, key);
  const countryKey = prefix + "country_id";
  const provinceKey = prefix + "province_id";
  const countyKey = prefix + "county_id";
  const cityKey = prefix + "city_id";
  const villageKey = prefix + "village_id";
  const countryId = has(countryKey) ? record[countryKey] : (countries[0]?.id || "");
  const pathFor = (key) => errorPrefix ? `${errorPrefix}.${key}` : key;
  const [provinces, setProvinces] = useState([]);
  const [counties, setCounties] = useState([]);
  const [cities, setCities] = useState([]);
  const [villages, setVillages] = useState([]);

  useEffect(() => {
    if (!countryId || !has(provinceKey)) return undefined;
    let cancelled = false;
    api.provinces(countryId).then((items) => { if (!cancelled) setProvinces(normalizeList(items)); }).catch(() => setProvinces([]));
    return () => { cancelled = true; };
  }, [countryId, provinceKey]);

  useEffect(() => {
    const provinceId = record[provinceKey];
    if (!provinceId || !has(countyKey)) return undefined;
    let cancelled = false;
    api.counties(provinceId).then((items) => { if (!cancelled) setCounties(normalizeList(items)); }).catch(() => setCounties([]));
    return () => { cancelled = true; };
  }, [record[provinceKey], countyKey]);

  useEffect(() => {
    const provinceId = record[provinceKey];
    const countyId = record[countyKey];
    if ((!countyId && !provinceId) || !has(cityKey)) return undefined;
    let cancelled = false;
    const call = countyId ? api.cities(countyId) : api.citiesByProvince(provinceId);
    call.then((items) => { if (!cancelled) setCities(normalizeList(items)); }).catch(() => setCities([]));
    return () => { cancelled = true; };
  }, [record[provinceKey], record[countyKey], cityKey]);

  useEffect(() => {
    const countyId = record[countyKey];
    if (!countyId || !has(villageKey)) return undefined;
    let cancelled = false;
    api.villages(countyId).then((items) => { if (!cancelled) setVillages(normalizeList(items)); }).catch(() => setVillages([]));
    return () => { cancelled = true; };
  }, [record[countyKey], villageKey]);

  const setValue = (key, value) => {
    const next = { ...record, [key]: value };
    clearValidationError?.(pathFor(key));
    if (key === countryKey) {
      [provinceKey, countyKey, cityKey, villageKey].forEach((child) => { if (has(child)) next[child] = ""; });
    }
    if (key === provinceKey) {
      [countyKey, cityKey, villageKey].forEach((child) => { if (has(child)) next[child] = ""; });
    }
    if (key === countyKey) {
      [cityKey, villageKey].forEach((child) => { if (has(child)) next[child] = ""; });
    }
    setRecord(next);
  };

  return (
    <div className="geo-block field full">
      <div className="geo-caption"><strong>موقعیت جغرافیایی</strong><span>انتخاب‌ها به صورت وابسته از بالا به پایین هستند.</span></div>
      <div className="field-grid geo-grid">
        {has(countryKey) && <SelectField label="کشور" value={record[countryKey]} onChange={(v) => setValue(countryKey, v)} error={getFieldError(errors, pathFor(countryKey))} options={countries.map((x) => ({ value: x.id, label: x.name }))} readOnly={readOnly} />}
        {has(provinceKey) && <SelectField label="استان" value={record[provinceKey]} onChange={(v) => setValue(provinceKey, v)} error={getFieldError(errors, pathFor(provinceKey))} options={provinces.map((x) => ({ value: x.id, label: x.name }))} readOnly={readOnly} />}
        {has(countyKey) && <SelectField label="شهرستان" value={record[countyKey]} onChange={(v) => setValue(countyKey, v)} error={getFieldError(errors, pathFor(countyKey))} options={counties.map((x) => ({ value: x.id, label: x.name }))} readOnly={readOnly} />}
        {has(cityKey) && <SelectField label="شهر" value={record[cityKey]} onChange={(v) => setValue(cityKey, v)} error={getFieldError(errors, pathFor(cityKey))} options={cities.map((x) => ({ value: x.id, label: x.name }))} readOnly={readOnly} />}
        {has(villageKey) && <SelectField label="روستا" value={record[villageKey]} onChange={(v) => setValue(villageKey, v)} error={getFieldError(errors, pathFor(villageKey))} options={villages.map((x) => ({ value: x.id, label: x.name }))} readOnly={readOnly} />}
      </div>
    </div>
  );
}

function makeForm(stepKey, data, user) {
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
    return { ...(data?.record || {}), spouse: data?.spouse || null };
  }
  if (stepKey === "family" || stepKey === "social_relations") return { people: normalizeList(data?.people) };
  if (stepKey === "residence") return { addresses: normalizeList(data?.addresses) };
  if (stepKey === "additional") return { details: data?.record?.details || "" };
  if (stepKey === "declaration") return { accepted: Boolean(data?.record?.accepted), declaration_version: data?.record?.declaration_version || "1" };
  if (RECORDS[stepKey]) return { records: normalizeList(data?.records) };
  return {};
}

function stepDescription(key) {
  const descriptions = {
    personal: "اطلاعات هویتی، راه‌های تماس و نشانی‌ها را ثبت کنید.",
    marriage: "وضعیت تأهل و مشخصات همسر را تکمیل کنید.",
    military: "وضعیت خدمت، سازمان و معافیت را اعلام کنید.",
    education: "سوابق تحصیلی را از آخرین مدرک به قبل ثبت کنید.",
    employment: "سوابق شغلی را از شغل فعلی به قبل وارد کنید.",
    passport: "برای داوطلب و در صورت وجود، همسر، سوابق گذرنامه را ثبت کنید.",
    family: "مشخصات اعضای خانواده را با جزئیات کافی ثبت کنید.",
    social_relations: "افرادی را که شناخت کافی از شما دارند ثبت کنید.",
    residence: "نشانی‌های محل سکونت در ده سال اخیر را به ترتیب ثبت کنید.",
    declaration: "پس از مرور اطلاعات، تعهدنامه را تأیید و پرونده را ثبت نهایی کنید.",
  };
  return descriptions[key] || "اطلاعات این مرحله را تکمیل کنید. در صورت نداشتن سابقه می‌توانید مرحله را بدون افزودن مورد ادامه دهید.";
}

export default App;
