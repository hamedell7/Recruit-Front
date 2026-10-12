import { statusLabel } from "../../../utils/status";
import { formatDate } from "../../../utils/date";

function RequestCard({ request, onOpen }) {
  const [label, tone] = statusLabel(request.status);
  const progressText = request.request_type_title || request.request_type_code || request.workflow_key || "درخواست";
  const symbol = (request.request_type_code || request.workflow_key || "R").slice(0, 1).toUpperCase();
  return (
    <article className="request-card">
      <div className="request-card-top">
        <div className="request-symbol">{symbol}</div>
        <div className={"status-badge " + tone}><i />{label}</div>
      </div>
      <div className="request-card-title">
        <span>{progressText}</span>
        <h3>{request.current_step_title || request.current_step_key || "—"}</h3>
      </div>
      <div className="request-code"><span>کد رهگیری</span><b>{request.tracking_code}</b></div>
      <div className="request-meta"><span>ایجاد شده</span><span>{formatDate(request.created_at)}</span></div>
      <button className="outline-button wide" onClick={() => onOpen(request)}>
        {["SUBMITTED", "UNDER_REVIEW", "APPROVED", "COMPLETED"].includes(request.status) ? "مشاهده پرونده" : "ادامه تکمیل پرونده"} <span>←</span>
      </button>
    </article>
  );
}

export default RequestCard;
