import { useEffect, useRef, useState } from "react";

const ROLE_LABELS = {
  APPLICANT: "متقاضی",
  OFFICER: "کارشناس",
  REVIEWER: "بازبین پرونده",
  SUPERVISOR: "سرپرست",
  ADMIN: "مدیر سامانه",
};

const STAFF_ROLES = ["OFFICER", "REVIEWER", "SUPERVISOR", "ADMIN"];

function Header({ user, onLogout, staffPath, onNavigateStaff }) {
  const isStaff = STAFF_ROLES.includes(user?.role);
  const isAdmin = user?.role === "ADMIN";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const menuItems = [
    { path: "/staff/requests", icon: "▦", title: "مدیریت درخواست‌ها", description: "فهرست و پیگیری پرونده‌ها" },
    ...(isAdmin ? [
      { path: "/staff/workflows", icon: "☷", title: "مدیریت گردش‌کار", description: "تنظیم مراحل و ترتیب فرایند" },
      { path: "/staff/request-settings", icon: "⚙", title: "تنظیمات درخواست‌ها", description: "مهلت ثبت، ویرایش و سقف درخواست" },
    ] : []),
  ];

  const navigateTo = (path) => {
    setMenuOpen(false);
    if (path !== (staffPath || window.location.pathname)) onNavigateStaff?.(path);
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">R</div>
        <div><strong>Recruit</strong><span>{isStaff ? "مرکز مدیریت درخواست‌ها" : "پنل کاربری"}</span></div>
      </div>
      {isStaff && (
        <div className="staff-menu-wrap" ref={menuRef}>
          <button
            className={"staff-menu-trigger" + (menuOpen ? " is-open" : "")}
            type="button"
            aria-label="باز کردن منوی مدیریت"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="staff-hamburger-icon" aria-hidden="true"><i /><i /><i /></span>
            <span>منوی مدیریت</span>
            <span className="staff-menu-chevron" aria-hidden="true">⌄</span>
          </button>
          {menuOpen && (
            <nav className="staff-menu-dropdown" role="menu" aria-label="منوی فضای مدیریت">
              <div className="staff-menu-heading">
                <span className="staff-menu-eyebrow">فضای کاری</span>
                <strong>بخش‌های مدیریت</strong>
              </div>
              {menuItems.map((item) => {
                const active = (staffPath || window.location.pathname) === item.path;
                return (
                  <button
                    type="button"
                    role="menuitem"
                    key={item.path}
                    className={"staff-menu-item" + (active ? " is-active" : "")}
                    aria-current={active ? "page" : undefined}
                    onClick={() => navigateTo(item.path)}
                  >
                    <span className="staff-menu-item-icon" aria-hidden="true">{item.icon}</span>
                    <span className="staff-menu-item-copy">
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                    {active && <span className="staff-menu-active-mark" aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      )}
      <div className="topbar-actions">
        {isStaff && (
          <div className="staff-header-context">
            <span className="staff-header-context-dot" />
            محیط مدیریتی
          </div>
        )}
        <div className="user-chip">
          <div className="avatar">{(user?.national_id || "ک").slice(-2)}</div>
          <div><strong>{user?.mobile || "کاربر"}</strong><span>{ROLE_LABELS[user?.role] || "حساب کاربری"}</span></div>
        </div>
        <button className="ghost-button" onClick={onLogout}>خروج</button>
      </div>
    </header>
  );
}

export default Header;
