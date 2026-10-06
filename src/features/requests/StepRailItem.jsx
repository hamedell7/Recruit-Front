import { STEP_META } from "../../config/workflow";

function StepRailItem({ keyName, active, completed, onClick, order }) {
  const meta = STEP_META[keyName] || { title: keyName };
  return (
    <button className={"step-item " + (active ? "active" : "") + " " + (completed ? "completed" : "")} onClick={onClick} disabled={!completed && !active}>
      <span className="step-dot">{completed ? "✓" : order}</span>
      <span><small>{meta.kicker}</small><strong>{meta.title}</strong></span>
      {active && <i>●</i>}
    </button>
  );
}

export default StepRailItem;
