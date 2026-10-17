import { Fragment } from "react";
import "../../styles/admin-breadcrumb.css";

function AdminBreadcrumb({ items = [], onBack, backLabel = "بازگشت" }) {
  return (
    <div className={"srd-admin-breadcrumb-toolbar" + (onBack ? " has-back-button" : "")} dir="rtl">
      <nav className="srd-breadcrumb" aria-label="مسیر صفحه">
        {items.map((label, index) => (
          <Fragment key={label + "-" + index}>
            {index > 0 && <i aria-hidden="true">/</i>}
            {index === items.length - 1 ? <strong>{label}</strong> : <span>{label}</span>}
          </Fragment>
        ))}
      </nav>
      {onBack && (
        <button type="button" className="srd-back-button" onClick={onBack}>
          <span aria-hidden="true">→</span> {backLabel}
        </button>
      )}
    </div>
  );
}

export default AdminBreadcrumb;
