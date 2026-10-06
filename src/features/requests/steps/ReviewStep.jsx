import { STEP_META, STATUS } from "../../../config/workflow";
import { statusLabel } from "../../../utils/status";

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

export default ReviewStep;
