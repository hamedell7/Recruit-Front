import { useRef, useState } from "react";
import { api } from "../../services/api";
import ValidationSummary from "../../components/form/ValidationSummary";
import { getFieldError } from "../../utils/validation";
import FieldError from "../../components/form/FieldError";

function Login({ onLogin }) {
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
          <span className="secure-pill">گزینش و استخدام</span>
        </div>
        <div className="showcase-main">
          <span className="eyebrow">فرایند گزینش و استخدام</span>
          <h1>از ثبت اطلاعات تا<br /><span>تکمیل پرونده استخدام</span></h1>
          <p>اطلاعات موردنیاز گزینش و استخدام را مرحله‌به‌مرحله ثبت کنید و روند پرونده خود را پیگیری کنید.</p>
          <div className="trust-grid">
            <div><b>ثبت</b><span>اطلاعات گزینش</span></div>
            <div><b>تکمیل</b><span>پرونده استخدام</span></div>
            <div><b>پیگیری</b><span>وضعیت درخواست</span></div>
          </div>
        </div>
        <div className="showcase-foot">اطلاعات ثبت‌شده برای بررسی و تکمیل پرونده گزینش و استخدام استفاده می‌شود.</div>
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
}

export default Login;
