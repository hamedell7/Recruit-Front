import { Fragment } from "react";
import "../../styles/admin-breadcrumb.css";

function AdminBreadcrumb({ items = [], onBack, backLabel = "بازگشت" }) {
  return (
    <div className={"srd-admin-breadcrumb-toolbar" + (onBack ? " has-back-button" : "")} dir="rtl">
      <nav className="srd-breadcrumb" aria-label="مسیر صفحه">
        {items.map((item, index) => {
          const crumb = typeof item === "string" ? { label: item } : item;
          const key = crumb.label + "-" + index;

          return (
            <Fragment key={key}>
              {index > 0 && <i aria-hidden="true">/</i>}
              {index === items.length - 1 ? (
                <strong aria-current="page">{crumb.label}</strong>
              ) : crumb.href ? (
                <a href={crumb.href}>{crumb.label}</a>
              ) : (
                <span>{crumb.label}</span>
              )}
            </Fragment>
          );
        })}
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
