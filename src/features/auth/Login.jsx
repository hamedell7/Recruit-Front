import { useRef, useState } from "react";
import { api } from "../../services/api";
import ValidationSummary from "../../components/form/ValidationSummary";
import { getFieldError } from "../../utils/validation";
import FieldError from "../../components/form/FieldError";\n\nfunction Login({ onLogin }) {
  const [nationalId, setNationalId] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [authError, setAuthError] = useState(null);
  const validationSummaryRef = useRef(null);

  const applyLoginValidationErrors = (errors) => {
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

  const clearLoginValidationError = (fieldPath) => {
    setValidationErrors((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key === fieldPath || key.startsWith(fieldPath + ".")) delete next[key];
      });
      return next;
    });
  };

  const clearAuthError = () => setAuthError(null);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setAuthError(null);
    try {
      const result = await api.login(nationalId, mobile);
      setValidationErrors({});
      onLogin(result.user);
    } catch (error) {
      const message = error.validationErrors?.length
        ? "لطفاً خطاهای فرم ورود را اصلاح کنید."
        : error.status === 401 || error.code === "INVALID_CREDENTIALS"
          ? "کد ملی یا شماره موبایل واردشده صحیح نیست."
          : error.status === 429
            ? "تعداد درخواست‌های ورود بیش از حد مجاز است. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید."
            : error.message || "خطایی در ورود به حساب رخ داد.";
      const nextError = {
        text: message,
        requestId: error.requestId,
      };

      if (error.validationErrors?.length) {
        applyLoginValidationErrors(error.validationErrors);
      } else {
        setAuthError(nextError);
      }

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
          {authError && (
            <div className="auth-error" role="alert" aria-live="assertive">
              <span className="auth-error-icon">!</span>
              <div>
                <strong>ورود انجام نشد</strong>
                <p>{authError.text}</p>
                {authError.requestId && <small>کد پیگیری خطا: {authError.requestId}</small>}
              </div>
            </div>
          )}
          <form onSubmit={submit}>
            {Object.keys(validationErrors).length > 0 && (
              <ValidationSummary errors={validationErrors} summaryRef={validationSummaryRef} />
            )}
            <label className={"field " + (getFieldError(validationErrors, "national_id") ? "has-error" : "")}>
              <span>کد ملی</span>
              <input
                inputMode="numeric"
                autoComplete="username"
                maxLength={10}
                value={nationalId}
                onChange={(e) => {
                  clearLoginValidationError("national_id");
                  clearAuthError();
                  setNationalId(e.target.value);
                }}
                placeholder="مثلاً ۰۰۱۲۳۴۵۶۷۸"
                required
                aria-invalid={getFieldError(validationErrors, "national_id") ? "true" : undefined}
              />
              <FieldError error={getFieldError(validationErrors, "national_id")} />
            </label>
            <label className={"field " + (getFieldError(validationErrors, "mobile") ? "has-error" : "")}>
              <span>شماره موبایل</span>
              <input
                inputMode="tel"
                autoComplete="tel"
                maxLength={13}
                value={mobile}
                onChange={(e) => {
                  clearLoginValidationError("mobile");
                  clearAuthError();
                  setMobile(e.target.value);
                }}
                placeholder="۰۹۱۲…"
                required
                aria-invalid={getFieldError(validationErrors, "mobile") ? "true" : undefined}
              />
              <FieldError error={getFieldError(validationErrors, "mobile")} />
            </label>
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
}\n\nexport default Login;\n