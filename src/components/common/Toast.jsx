function Toast({ toast, onClose }) {
  return (
    <div className={"toast " + (toast.type || "info")} role="status" aria-live="polite">
      <div className="toast-dot" />
      <div>
        <strong>{toast.type === "success" ? "انجام شد" : toast.type === "error" ? "خطا" : "توجه"}</strong>
        <p>{toast.text}</p>
        {toast.requestId && <small>کد پیگیری خطا: {toast.requestId}</small>}
      </div>
      <button onClick={onClose} aria-label="بستن">×</button>
    </div>
  );
}\n\nexport default Toast;\n