function FormSection({ title, hint, children }) {
  return <section className="form-section"><div className="form-section-head"><div><h3>{title}</h3><p>{hint}</p></div></div>{children}</section>;
}\n\nexport default FormSection;\n