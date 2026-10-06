function StepRail({ items, currentKey, backendCurrentIndex, onMove }) {
  return <div className="step-rail">{items.map((key, index) => <StepRailItem key={key} keyName={key} active={currentKey === key} completed={index < backendCurrentIndex} onClick={() => onMove(index)} order={index + 1} />)}</div>;
}\n\nexport default StepRail;\n