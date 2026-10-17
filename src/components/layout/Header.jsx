const ROLE_LABELS = {
  APPLICANT: "متقاضی",
  OFFICER: "کارشناس",
  REVIEWER: "بازبین پرونده",
  SUPERVISOR: "سرپرست",
  ADMIN: "مدیر سامانه",
};

function Header({ user, onLogout, showSidebarToggle = false, sidebarOpen = true, onToggleSidebar }) {
  const isStaff = ["OFFICER", "REVIEWER", "SUPERVISOR", "ADMIN"].includes(user?.role);
  return (
    <header className="topbar">
      <div className="topbar-brand-group">
        {showSidebarToggle && (
          <button
            className={"sidebar-toggle" + (sidebarOpen ? " is-open" : "")}
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "بستن منوی مراحل" : "باز کردن منوی مراحل"}
            aria-expanded={sidebarOpen}
            aria-controls="request-step-sidebar"
            title={sidebarOpen ? "بستن منوی مراحل" : "باز کردن منوی مراحل"}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        )}
        <div className="brand">
          <div className="brand-mark">R</div>
          <div><strong>Recruit</strong><span>{isStaff ? "مرکز مدیریت درخواست‌ها" : "پنل کاربری"}</span></div>
        </div>
      </div>
      <div className="topbar-actions">
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
