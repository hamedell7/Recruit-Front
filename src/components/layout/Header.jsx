const ROLE_LABELS = {
  APPLICANT: "متقاضی",
  OFFICER: "کارشناس",
  REVIEWER: "بازبین پرونده",
  SUPERVISOR: "سرپرست",
  ADMIN: "مدیر سامانه",
};

function Header({ user, onLogout }) {
  const isStaff = ["OFFICER", "REVIEWER", "SUPERVISOR", "ADMIN"].includes(user?.role);
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">R</div>
        <div><strong>Recruit</strong><span>{isStaff ? "مرکز مدیریت درخواست‌ها" : "پنل کاربری"}</span></div>
      </div>
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
