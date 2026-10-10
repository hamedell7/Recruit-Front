import { STEP_META } from "../../../config/workflow";
import { statusLabel } from "../../../utils/status";
import { formatDate } from "../../../utils/date";

function RequestCard({ request, onOpen }) {
  const [label, tone] = statusLabel(request.status);
  const step = STEP_META[request.current_step_key];
  const isReadOnly = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED"].includes(request.status);
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
      <button
        className={`outline-button wide${isReadOnly ? " request-view-button" : ""}`}
        onClick={() => onOpen(request)}
      >
        {isReadOnly && <span className="request-view-icon" aria-hidden="true">✓</span>}
        {isReadOnly ? "مشاهده پرونده" : "ادامه تکمیل پرونده"}
        <span className={isReadOnly ? "request-view-arrow" : undefined}>←</span>
      </button>
    </article>
  );
}

export default RequestCard;
