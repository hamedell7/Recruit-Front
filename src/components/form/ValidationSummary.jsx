import { formatErrorPath } from "../../utils/validation";

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
              <span className="validation-summary-field">{formatErrorPath(path)}:</span>
              <b className="validation-summary-message">{message}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ValidationSummary;
