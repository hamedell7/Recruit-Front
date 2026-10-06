import { formatErrorPath } from "../../utils/validation";\n\nfunction ValidationSummary({ errors, summaryRef }) {
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
}\n\nexport default ValidationSummary;\n