function StepRailItem({ keyName, title, kicker, active, completed, disabled = false, onClick, order }) {
  return (
    <button className={"step-item " + (active ? "active" : "") + " " + (completed ? "completed" : "")} onClick={onClick} disabled={disabled || (!completed && !active)} aria-current={active ? "step" : undefined}>
      <span className="step-dot">{completed ? "✓" : order}</span>
      <span><small>{kicker || ""}</small><strong>{title || keyName}</strong></span>
      {active && <i>●</i>}
    </button>
  );
}

export default StepRailItem;
