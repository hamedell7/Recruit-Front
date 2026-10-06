import { getFieldError } from "../../../utils/validation";
import FieldError from "../../../components/form/FieldError";

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

export default DeclarationStep;
