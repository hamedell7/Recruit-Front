function FieldError({ error }) {
  return error ? <small className="field-error" role="alert">{error}</small> : null;
}\n\nexport default FieldError;\n