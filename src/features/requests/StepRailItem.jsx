function StepRailItem({ keyName, title, kicker, active, completed, onClick, order, disabledLabel = "", disabled: forceDisabled = false }) {
  const disabled = forceDisabled || (!completed && !active);
  return (
    <button
      className={"step-item " + (active ? "active " : "") + (completed ? "completed " : "") + (disabledLabel === "غیرفعال" ? "inactive-step" : "")}
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "step" : undefined}
      aria-label={disabledLabel ? (title || keyName) + "، " + disabledLabel : undefined}
    >
      <span className="step-dot">{completed ? "✓" : disabledLabel ? "—" : order}</span>
      <span>
        <small>{disabledLabel || kicker || ""}</small>
        <strong>{title || keyName}</strong>
      </span>
      {active && <i>●</i>}
    </button>
  );
}

export default StepRailItem;
