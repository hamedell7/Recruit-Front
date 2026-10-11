import { STEP_META } from "../../config/workflow";

function StepRailItem({ keyName, title, kicker, active, completed, onClick, order }) {
  const meta = STEP_META[keyName] || { title: keyName };
  return (
    <button className={"step-item " + (active ? "active" : "") + " " + (completed ? "completed" : "")} onClick={onClick} disabled={!completed && !active} aria-current={active ? "step" : undefined}>
      <span className="step-dot">{completed ? "✓" : order}</span>
      <span><small>{kicker || meta.kicker}</small><strong>{title || meta.title}</strong></span>
      {active && <i>●</i>}
    </button>
  );
}

export default StepRailItem;
