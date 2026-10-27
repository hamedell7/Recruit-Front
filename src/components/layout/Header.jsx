import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/staff-menu.css";

const ROLE_LABELS = {
  APPLICANT: "متقاضی",
  OFFICER: "کارشناس",
  REVIEWER: "بازبین پرونده",
  SUPERVISOR: "سرپرست",
  ADMIN: "مدیر سامانه",
};

const STAFF_ROLES = ["OFFICER", "REVIEWER", "SUPERVISOR", "ADMIN"];

function MenuGlyph({ name, className }) {
  let content;

  switch (name) {
    case "requests":
      content = (
        <>
          <rect x="4" y="4" width="7" height="7" rx="1.8" />
          <rect x="13" y="4" width="7" height="7" rx="1.8" />
          <rect x="4" y="13" width="7" height="7" rx="1.8" />
          <rect x="13" y="13" width="7" height="7" rx="1.8" />
        </>
      );
      break;
    case "workflow":
      content = (
        <>
          <circle cx="6" cy="6" r="2.1" />
          <circle cx="18" cy="6" r="2.1" />
          <circle cx="18" cy="18" r="2.1" />
          <circle cx="6" cy="18" r="2.1" />
          <path d="M8.5 6H12a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3M6 8.5v7" />
        </>
      );
      break;
    case "settings":
      content = (
        <>
          <path d="M4 7h6m4 0h6M4 17h3m4 0h9" />
          <circle cx="12" cy="7" r="2" />
          <circle cx="9" cy="17" r="2" />
        </>
      );
      break;
    case "users":
      content = (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
      break;
    case "arrow":
      content = <path d="M19 12H5m7-7-7 7 7 7" />;
      break;
    case "close":
      content = <path d="m6 6 12 12M18 6 6 18" />;
      break;
    default:
      content = <circle cx="12" cy="12" r="8" />;
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {content}
    </svg>
  );
}

function Header({ user, onLogout, staffPath, onNavigateStaff, showSidebarToggle = false, sidebarOpen = true, onToggleSidebar }) {
  const isStaff = STAFF_ROLES.includes(user?.role);
  const isAdmin = user?.role === "ADMIN";
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const menuCloseTimerRef = useRef(null);
  const triggerRef = useRef(null);
  const closeButtonRef = useRef(null);

  const menuItems = [
    {
      path: "/staff/requests",
      icon: "requests",
      title: "مدیریت درخواست‌ها",
      description: "فهرست، بررسی و پیگیری پرونده‌ها",
      category: "پرونده‌ها",
    },
    ...(isAdmin
      ? [
          {
            path: "/staff/workflows",
            icon: "workflow",
            title: "مدیریت گردش‌کار",
            description: "مراحل، ترتیب و ساختار فرایندها",
            category: "پیکربندی",
          },
          {
            path: "/staff/request-settings",
            icon: "settings",
            title: "تنظیمات درخواست‌ها",
            description: "مهلت ثبت، ویرایش و سقف درخواست",
            category: "پیکربندی",
          },
          {
            path: "/staff/users",
            icon: "users",
            title: "مدیریت کاربران",
            description: "فهرست کاربران و ورود گروهی از اکسل",
            category: "مدیریت",
          },
        ]
      : []),
  ];

  const openMenu = () => {
    if (menuCloseTimerRef.current !== null) {
      window.clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }
    setMenuMounted(true);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    if (menuCloseTimerRef.current !== null) window.clearTimeout(menuCloseTimerRef.current);
    menuCloseTimerRef.current = window.setTimeout(() => {
      setMenuMounted(false);
      menuCloseTimerRef.current = null;
    }, 260);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!menuMounted) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuMounted]);

  useEffect(() => () => {
    if (menuCloseTimerRef.current !== null) window.clearTimeout(menuCloseTimerRef.current);
  }, []);

  const navigateTo = (path) => {
    closeMenu();
    if (path !== (staffPath || window.location.pathname)) onNavigateStaff?.(path);
  };

  const activePath = staffPath || window.location.pathname;

  return (
    <header className="topbar">
      <div className="topbar-leading">
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
        {isStaff && (
                <div className="staff-menu-wrap">
                  <button
                    ref={triggerRef}
                    className={"staff-menu-trigger" + (menuOpen ? " is-open" : "")}
                    type="button"
                    aria-label={menuOpen ? "بستن منوی مدیریت" : "باز کردن منوی مدیریت"}
                    aria-haspopup="dialog"
                    aria-controls="staff-management-drawer"
                    aria-expanded={menuOpen}
                    onClick={() => (menuOpen ? closeMenu() : openMenu())}
                  >
                    <span className="staff-hamburger-icon" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </button>
        
                  {menuMounted && createPortal(
                    <div className={"staff-menu-layer" + (!menuOpen ? " is-closing" : "")} dir="rtl">
                      <button
                        type="button"
                        className="staff-menu-backdrop"
                        aria-label="بستن منوی مدیریت"
                        onClick={closeMenu}
                      />
        
                      <aside
                        id="staff-management-drawer"
                        className="staff-menu-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="staff-drawer-title"
                      >
                        <div className="staff-drawer-hero">
                          <div className="staff-drawer-hero-orbit staff-drawer-hero-orbit-one" />
                          <div className="staff-drawer-hero-orbit staff-drawer-hero-orbit-two" />
        
                          <div className="staff-drawer-hero-top">
                            <div className="staff-drawer-brand">
                              <span className="staff-drawer-brand-mark">R</span>
                              <span className="staff-drawer-brand-wordmark">
                                <strong>Recruit</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              ref={closeButtonRef}
                              className="staff-drawer-close"
                              aria-label="بستن منو"
                              onClick={closeMenu}
                            >
                              <MenuGlyph name="close" />
                            </button>
                          </div>
        
                          <div className="staff-drawer-title-block">
                            <span className="staff-drawer-eyebrow">
                              <i />
                              فضای کاری سازمانی
                            </span>
                            <h2 id="staff-drawer-title">مرکز مدیریت</h2>
                            <p>دسترسی سریع و یکپارچه به ابزارهای مدیریت پرونده‌ها</p>
                          </div>
                        </div>
        
                        <div className="staff-drawer-profile">
                          <div className="staff-drawer-profile-avatar">
                            {(user?.national_id || "ک").slice(-2)}
                          </div>
                          <div className="staff-drawer-profile-copy">
                            <strong>{user?.mobile || "کاربر"}</strong>
                            <span>{ROLE_LABELS[user?.role] || "حساب کاربری"}</span>
                          </div>
                          <span className="staff-drawer-role-chip">حساب سازمانی</span>
                        </div>
        
                        <div className="staff-drawer-content">
                          <div className="staff-drawer-section-heading">
                            <div>
                              <span className="staff-drawer-section-kicker">ناوبری</span>
                              <h3>بخش‌های سامانه</h3>
                            </div>
                          </div>
        
                          <nav className="staff-drawer-nav" aria-label="بخش‌های مدیریت">
                            {menuItems.map((item, index) => {
                              const active = activePath === item.path;
                              return (
                                <button
                                  type="button"
                                  key={item.path}
                                  className={"staff-drawer-item" + (active ? " is-active" : "")}
                                  aria-current={active ? "page" : undefined}
                                  onClick={() => navigateTo(item.path)}
                                  style={{ "--drawer-item-index": index }}
                                >
                                  <span className="staff-drawer-item-icon">
                                    <MenuGlyph name={item.icon} />
                                  </span>
                                  <span className="staff-drawer-item-copy">
                                    <span className="staff-drawer-item-category">{item.category}</span>
                                    <strong>{item.title}</strong>
                                    <small>{item.description}</small>
                                  </span>
                                  <span className="staff-drawer-item-arrow">
                                    <MenuGlyph name="arrow" />
                                  </span>
                                  {active && <span className="staff-drawer-active-bar" aria-hidden="true" />}
                                </button>
                              );
                            })}
                          </nav>
        
                        </div>
        
                      </aside>
                    </div>,
                    document.body,
                  )}
                </div>
              )}
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
