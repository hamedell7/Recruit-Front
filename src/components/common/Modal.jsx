function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-top">
          <div><span className="eyebrow">Recruit</span><h3>{title}</h3></div>
          <button className="modal-close" onClick={onClose} aria-label="بستن">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}\n\nexport default Modal;\n