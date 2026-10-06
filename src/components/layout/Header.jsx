function Header({ user, onLogout }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">R</div>
        <div><strong>Recruit</strong><span>پنل کاربری</span></div>
      </div>
      <div className="topbar-actions">
        <div className="user-chip">
          <div className="avatar">{(user?.national_id || "ک").slice(-2)}</div>
          <div><strong>{user?.mobile || "کاربر"}</strong><span>حساب کاربری</span></div>
        </div>
        <button className="ghost-button" onClick={onLogout}>خروج</button>
      </div>
    </header>
  );
}\n\nexport default Header;\n