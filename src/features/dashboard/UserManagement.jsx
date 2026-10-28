import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import AdminBreadcrumb from "../../components/layout/AdminBreadcrumb";
import {
  isValidIranianNationalId,
  normalizeMobileForImport,
  normalizeNationalIdForImport,
  readUserSpreadsheet,
} from "../../utils/userSpreadsheet";
import "../../styles/user-management.css";

const nf = new Intl.NumberFormat("fa-IR");
const PAGE_SIZE = 10;
const ROLE_LABELS = { APPLICANT: "متقاضی", OFFICER: "کارشناس", REVIEWER: "بازبین پرونده", SUPERVISOR: "سرپرست", ADMIN: "مدیر سامانه" };

function Icon({ name, size = 20 }) {
  const icons = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    requests: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>,
    download: <><path d="M12 4v12m-5-5 5 5 5-5" /><path d="M4 18v2h16v-2" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9A7 7 0 0 1 17 6l3 6M4 12l3 6a7 7 0 0 0 11.5-3" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    power: <><path d="M12 2v10" /><path d="M18.4 5.6a8 8 0 1 1-12.8 0" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name] || icons.users}</svg>;
}

function downloadTemplate() {
  const blob = new Blob(["\uFEFFکد ملی,موبایل\r\n"], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "قالب-ورود-کاربران.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function UserManagement({ onError, onViewRequests }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [pagination, setPagination] = useState({ page: 1, page_size: PAGE_SIZE, total_items: 0, total_pages: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ national_id: "", mobile: "" });
  const [editError, setEditError] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [importRows, setImportRows] = useState([]);
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError("");
    api.staffUsers({ page, page_size: PAGE_SIZE, search, role: roleFilter }, controller.signal)
      .then((data) => {
        setUsers(Array.isArray(data?.items) ? data.items : []);
        setStats(data?.stats || { total: 0, active: 0, inactive: 0 });
        setPagination(data?.pagination || { page: 1, page_size: PAGE_SIZE, total_items: 0, total_pages: 0 });
      })
      .catch((error) => { if (error.name !== "AbortError") setLoadError(error.message || "دریافت فهرست کاربران انجام نشد."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, search, roleFilter, refreshKey]);

  const invalidRows = useMemo(() => importRows.filter((row) => row.errors?.length), [importRows]);
  const canImport = importRows.length > 0 && invalidRows.length === 0 && !reading && !importing;
  const totalPages = Math.max(1, Number(pagination.total_pages) || 1);
  const firstRow = pagination.total_items ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastRow = Math.min(page * PAGE_SIZE, Number(pagination.total_items) || 0);

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setReading(true); setFileError(""); setImportRows([]); setImportResult(null); setFileName(file.name);
    try { setImportRows(await readUserSpreadsheet(file)); }
    catch (error) { setFileError(error.message || "خواندن فایل انجام نشد."); }
    finally { setReading(false); }
  }

  async function importUsers() {
    if (!canImport) return;
    setImporting(true); setFileError("");
    try {
      const result = await api.importStaffUsers({ users: importRows.map((row) => ({
        national_id: row.national_id, mobile: row.mobile, source_row: row.sourceRow,
      })) });
      setImportResult(result); setPage(1); setSearch(""); setSearchInput(""); setRoleFilter(""); setRefreshKey((value) => value + 1);
      onError?.({ type: "success", text: nf.format(result?.created_count || 0) + " کاربر ثبت شد؛ " + nf.format(result?.skipped_count || 0) + " ردیف تکراری رد شد." });
    } catch (error) { setFileError(error.message || "ثبت کاربران انجام نشد."); }
    finally { setImporting(false); }
  }

  function openUserEditor(user) {
    if (!user || user.role === "ADMIN") return;
    setEditingUser(user);
    setEditForm({
      national_id: String(user.national_id || ""),
      mobile: String(user.mobile || ""),
    });
    setEditError("");
  }

  function closeUserEditor() {
    if (savingUser) return;
    setEditingUser(null);
    setEditForm({ national_id: "", mobile: "" });
    setEditError("");
  }

  async function saveUserChanges(event) {
    event.preventDefault();
    if (!editingUser || savingUser || editingUser.role === "ADMIN") return;

    const national_id = normalizeNationalIdForImport(editForm.national_id);
    const mobile = normalizeMobileForImport(editForm.mobile);
    if (!isValidIranianNationalId(national_id)) {
      setEditError("کد ملی معتبر نیست؛ رقم کنترلی را بررسی کنید.");
      return;
    }
    if (!/^09\d{9}$/.test(mobile)) {
      setEditError("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.");
      return;
    }

    setSavingUser(true);
    setEditError("");
    try {
      const updated = await api.updateStaffUser(editingUser.id, { national_id, mobile });
      setUsers((current) => current.map((user) =>
        String(user.id) === String(updated?.id || editingUser.id) ? { ...user, ...updated } : user
      ));
      setEditingUser(null);
      setEditForm({ national_id: "", mobile: "" });
      setRefreshKey((value) => value + 1);
      onError?.({
        type: "success",
        text: "اطلاعات کاربر ذخیره شد؛ برای امنیت، نشست‌های فعال او لغو شدند.",
      });
    } catch (error) {
      setEditError(error.message || "ذخیره اطلاعات کاربر انجام نشد.");
    } finally {
      setSavingUser(false);
    }
  }

  async function toggleUserStatus(user) {
    if (!user || user.role === "ADMIN" || statusUpdatingId !== null) return;
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (nextStatus === "INACTIVE" && !window.confirm(
      "این کاربر غیرفعال شود؟ ورود جدید او مسدود و نشست‌های فعالش لغو می‌شود."
    )) return;

    setStatusUpdatingId(String(user.id));
    try {
      const updated = await api.updateStaffUserStatus(user.id, nextStatus);
      setUsers((current) => current.map((item) =>
        String(item.id) === String(user.id) ? { ...item, ...updated } : item
      ));
      setRefreshKey((value) => value + 1);
      onError?.({
        type: "success",
        text: nextStatus === "ACTIVE" ? "حساب کاربر فعال شد." : "حساب کاربر غیرفعال شد.",
      });
    } catch (error) {
      onError?.({
        type: "error",
        text: error.message || "تغییر وضعیت کاربر انجام نشد.",
        requestId: error.requestId,
      });
    } finally {
      setStatusUpdatingId(null);
    }
  }

  function closeImport() {
    if (importing || reading) return;
    setImportOpen(false); setFileName(""); setImportRows([]); setFileError(""); setImportResult(null);
  }

  return (
    <main className="page staff-dashboard-page user-management-page">
      <AdminBreadcrumb items={["پنل مدیریت", "مدیریت کاربران"]} />

      <section className="staff-dashboard-hero um-dashboard-hero">
        <div className="staff-dashboard-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> مدیریت حساب‌های کاربری</span>
          <h1>مدیریت کاربران</h1>
          <p>فهرست حساب‌های سامانه را بررسی کنید یا کاربران جدید را با کد ملی و موبایل از فایل اکسل وارد نمایید.</p>
          <div className="um-hero-actions">
            <button type="button" className="um-primary" onClick={() => setImportOpen(true)}><Icon name="upload" /> ورود کاربران از اکسل</button>
            <button type="button" className="um-secondary" onClick={downloadTemplate}><Icon name="download" size={18} /> دانلود قالب اکسل</button>
          </div>
        </div>
        <div className="staff-dashboard-hero-meta">
          <div className="staff-live-indicator"><span /> مدیریت کاربران</div>
          <div className="staff-dashboard-meta-note">ورود گروهی · اعتبارسنجی پیش از ثبت</div>
        </div>
      </section>

      <section className="staff-metrics-grid um-user-metrics" aria-label="آمار کاربران">
        <article className="staff-metric-card tone-blue">
          <div className="staff-metric-top"><span className="staff-metric-icon"><Icon name="users" /></span><span className="staff-metric-caption">کل کاربران</span></div>
          <strong className="staff-metric-value">{nf.format(stats.total || 0)}</strong>
          <span className="staff-metric-foot">تمام حساب‌های ثبت‌شده در سامانه</span>
        </article>
        <article className="staff-metric-card tone-blue">
          <div className="staff-metric-top"><span className="staff-metric-icon"><Icon name="check" /></span><span className="staff-metric-caption">کاربران فعال</span></div>
          <strong className="staff-metric-value">{nf.format(stats.active || 0)}</strong>
          <span className="staff-metric-foot">حساب‌های مجاز به ورود</span>
        </article>
        <article className="staff-metric-card tone-blue">
          <div className="staff-metric-top"><span className="staff-metric-icon"><Icon name="alert" /></span><span className="staff-metric-caption">کاربران غیرفعال</span></div>
          <strong className="staff-metric-value">{nf.format(stats.inactive || 0)}</strong>
          <span className="staff-metric-foot">حساب‌های غیرفعال یا مسدود</span>
        </article>
      </section>


      <section className="staff-list-section um-users-section">
        <div className="staff-list-heading">
          <div>
            <span className="eyebrow">مدیریت و جست‌وجو</span>
            <h2>فهرست کاربران</h2>
            <p>کاربران را بر اساس کد ملی یا شماره موبایل پیدا کنید.</p>
          </div>
          <div className="staff-list-heading-side">
            <span className="staff-data-chip"><span className="staff-data-chip-dot" /> {nf.format(pagination.total_items || 0)} نتیجه</span>
            <button className="staff-refresh-button" type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} aria-label="به‌روزرسانی فهرست">
              <span className={loading ? "staff-refresh-icon is-spinning" : "staff-refresh-icon"}>↻</span> به‌روزرسانی
            </button>
          </div>
        </div>

        <div className="staff-filter-panel um-users-filter">
          <div className="staff-filter-panel-head">
            <div className="staff-filter-title"><span aria-hidden="true">⌕</span><strong>جست‌وجوی کاربران</strong></div>
            {(searchInput || roleFilter) && <button className="staff-clear-filters" type="button" onClick={() => { setSearchInput(""); setRoleFilter(""); setPage(1); }}>پاک کردن فیلترها <span>×</span></button>}
          </div>
          <div className="staff-filter-grid um-filter-grid">
            <label className="staff-search-field">
              <span>کد ملی یا موبایل</span>
              <div className="staff-search-control">
                <span className="staff-search-icon" aria-hidden="true"><Icon name="search" size={18} /></span>
                <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="کد ملی یا شماره موبایل را وارد کنید…" aria-label="جست‌وجوی کاربران" />
                {searchInput && <button type="button" onClick={() => setSearchInput("")} aria-label="پاک کردن جست‌وجو">×</button>}
              </div>
            </label>
            <label className="staff-search-field um-role-filter">
              <span>فیلتر بر اساس نقش</span>
              <select
                value={roleFilter}
                onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}
                aria-label="فیلتر بر اساس نقش کاربر"
              >
                <option value="">همه نقش‌ها</option>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={role}>{label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loadError && <div className="um-error" role="alert"><Icon name="alert" /><span>{loadError}</span><button type="button" onClick={() => setRefreshKey((value) => value + 1)}>تلاش مجدد</button></div>}

        <div className="staff-table-card um-users-table-card">
          <div className="staff-table-topline">
            <div><strong>کاربران سامانه</strong><span>{nf.format(pagination.total_items || 0)} نتیجه</span></div>
            <span className="staff-table-page-size">نمایش {nf.format(firstRow)} تا {nf.format(lastRow)}</span>
          </div>
          <div className="staff-table-scroll">
            <table className="staff-requests-table um-users-table">
              <thead><tr><th>ردیف</th><th>آواتار</th><th>کد ملی</th><th>موبایل</th><th>نقش</th><th>وضعیت</th><th>تاریخ عضویت</th><th>درخواست‌ها</th><th>عملیات</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={9} className="um-user-table-message"><span className="um-spinner" /> در حال دریافت کاربران…</td></tr>
                  : users.length === 0 ? <tr><td colSpan={9} className="um-user-table-message"><span className="um-empty"><Icon name="users" size={25} /></span><strong>{search || roleFilter ? "کاربری با این فیلترها پیدا نشد" : "هنوز کاربری برای نمایش وجود ندارد"}</strong><span>{search || roleFilter ? "عبارت جست‌وجو یا نقش انتخاب‌شده را تغییر دهید." : "می‌توانید کاربران را از طریق اکسل اضافه کنید."}</span></td></tr>
                  : users.map((user, index) => <tr key={user.id}>
                    <td><span className="um-row-number">{nf.format((page - 1) * PAGE_SIZE + index + 1)}</span></td>
                    <td className="um-avatar-cell">
                      <span className="um-user-avatar" aria-hidden="true">
                        <Icon name="user" size={19} />
                      </span>
                    </td>
                    <td><bdi dir="ltr" className="um-mono">{user.national_id || "—"}</bdi></td>
                    <td><bdi dir="ltr" className="um-mono">{user.mobile || "—"}</bdi></td>
                    <td><span className={"um-role" + (user.role === "ADMIN" ? " admin" : "")}>{ROLE_LABELS[user.role] || user.role || "—"}</span></td>
                    <td><span className={"um-status" + (user.status === "ACTIVE" ? " active" : " inactive")}><i />{user.status === "ACTIVE" ? "فعال" : "غیرفعال"}</span></td>
                    <td><span className="staff-updated-date">{formatDate(user.created_at)}</span></td>
                    <td>
                      <button
                        type="button"
                        className="um-user-requests-button"
                        onClick={() => onViewRequests?.(user)}
                        disabled={!onViewRequests || !(user.national_id || user.mobile)}
                        aria-label={`مشاهده درخواست‌های کاربر ${user.national_id || user.mobile || ""}`}
                        title="نمایش درخواست‌های این کاربر"
                      >
                        <Icon name="requests" size={16} />
                        مشاهده درخواست‌ها
                      </button>
                    </td>
                    <td>
                      {user.role === "ADMIN" ? (
                        <span className="um-user-protected-account">حساب مدیر محافظت‌شده</span>
                      ) : (
                        <div className="um-user-actions">
                          <button
                            type="button"
                            className="um-user-action-button um-user-edit-button"
                            onClick={() => openUserEditor(user)}
                            disabled={savingUser || statusUpdatingId !== null}
                            title="ویرایش کد ملی یا شماره موبایل"
                          >
                            <Icon name="edit" size={15} />
                            ویرایش
                          </button>
                          <button
                            type="button"
                            className={"um-user-action-button um-user-status-button " + (user.status === "ACTIVE" ? "is-deactivate" : "is-activate")}
                            onClick={() => toggleUserStatus(user)}
                            disabled={statusUpdatingId !== null || savingUser}
                            title={user.status === "ACTIVE" ? "غیرفعال کردن حساب کاربر" : "فعال کردن حساب کاربر"}
                          >
                            <Icon name="power" size={15} />
                            {statusUpdatingId === String(user.id) ? "در حال ثبت…" : user.status === "ACTIVE" ? "غیرفعال‌سازی" : "فعال‌سازی"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          {!loadError && !loading && users.length > 0 && (
            <div className="staff-pagination">
              <span>نمایش {nf.format(firstRow)} تا {nf.format(lastRow)} از {nf.format(pagination.total_items || 0)} کاربر</span>
              <div>
                <button type="button" className="staff-page-button" disabled={page <= 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>قبلی</button>
                <span className="staff-page-number">{nf.format(page)}</span>
                <button type="button" className="staff-page-button" disabled={loading || page >= totalPages} onClick={() => setPage((v) => Math.min(totalPages, v + 1))}>بعدی</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {editingUser && <div className="ui-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeUserEditor(); }}>
        <section className="ui-dialog um-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="um-edit-title" dir="rtl">
          <header className="ui-header">
            <span className="ui-title-icon"><Icon name="edit" size={23} /></span>
            <div>
              <span className="um-kicker">ویرایش حساب</span>
              <h2 id="um-edit-title">تغییر مشخصات کاربر</h2>
              <p>کد ملی و شماره موبایل جدید را وارد و ذخیره کنید.</p>
            </div>
            <button type="button" className="ui-close" onClick={closeUserEditor} disabled={savingUser} aria-label="بستن"><Icon name="close" /></button>
          </header>
          <form className="um-edit-form" onSubmit={saveUserChanges}>
            <div className="um-edit-fields">
              <label>
                <span>کد ملی</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={editForm.national_id}
                  onChange={(event) => setEditForm((current) => ({ ...current, national_id: event.target.value }))}
                  placeholder="کد ملی ۱۰ رقمی"
                  maxLength={10}
                  required
                />
              </label>
              <label>
                <span>شماره موبایل</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  value={editForm.mobile}
                  onChange={(event) => setEditForm((current) => ({ ...current, mobile: event.target.value }))}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  maxLength={15}
                  required
                />
              </label>
            </div>
            {editError && <div className="ui-error" role="alert"><Icon name="alert" size={18} /><span>{editError}</span></div>}
            <footer className="ui-footer">
              <span>حساب مدیر سامانه از ویرایش و تغییر وضعیت مستثنا است.</span>
              <div>
                <button type="button" className="ui-cancel" onClick={closeUserEditor} disabled={savingUser}>انصراف</button>
                <button type="submit" className="ui-submit" disabled={savingUser}>
                  {savingUser ? "در حال ذخیره…" : "ذخیره تغییرات"}
                </button>
              </div>
            </footer>
          </form>
        </section>
      </div>}

      {importOpen && <div className="ui-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeImport(); }}>
        <section className="ui-dialog" role="dialog" aria-modal="true" aria-labelledby="ui-title" dir="rtl">
          <header className="ui-header"><span className="ui-title-icon"><Icon name="file" size={23} /></span><div><span className="um-kicker">ورود گروهی</span><h2 id="ui-title">افزودن کاربران از اکسل</h2><p>فایل را انتخاب کنید، پیش‌نمایش را بررسی و سپس ثبت کنید.</p></div><button type="button" className="ui-close" onClick={closeImport} disabled={importing || reading} aria-label="بستن"><Icon name="close" /></button></header>
          <div className="ui-guide"><strong>ساختار ستون‌ها</strong><div className="ui-columns"><span>کد ملی</span><span>موبایل</span></div><p>این دو ستون را به همین ترتیب قرار دهید. اگر عنوان ستون‌ها در ردیف اول باشد، ترتیب از روی عنوان تشخیص داده می‌شود.</p><p>فرمت‌های <bdi dir="ltr">.xlsx</bdi>، <bdi dir="ltr">.csv</bdi> و <bdi dir="ltr">.tsv</bdi> تا ۱۰ مگابایت و ۱۰۰۰ ردیف پشتیبانی می‌شوند.</p></div>
          <div className="ui-drop"><span className="ui-upload-icon"><Icon name="upload" size={25} /></span><strong>{fileName || "انتخاب فایل اکسل"}</strong><span>{reading ? "در حال خواندن و اعتبارسنجی…" : "فایل را انتخاب کنید تا پیش‌نمایش آن نمایش داده شود."}</span><label className="ui-file-button">{reading ? "در حال پردازش…" : "انتخاب فایل"}<input type="file" accept=".xlsx,.csv,.tsv,text/csv,text/tab-separated-values" onChange={chooseFile} disabled={reading || importing} /></label><button type="button" className="ui-template" onClick={downloadTemplate}>دانلود قالب CSV</button></div>
          {fileError && <div className="ui-error" role="alert"><Icon name="alert" size={18} /><span>{fileError}</span></div>}
          {importRows.length > 0 && <div className="ui-preview"><div className="ui-preview-head"><div><h3>پیش‌نمایش اطلاعات</h3><span>{nf.format(importRows.length)} ردیف خوانده شد</span></div><div className="ui-validation-count"><span>{nf.format(importRows.length - invalidRows.length)} معتبر</span><span className={invalidRows.length ? "invalid" : ""}>{nf.format(invalidRows.length)} دارای خطا</span></div></div>
            <div className="ui-table-scroll"><table className="ui-table"><thead><tr><th>ردیف</th><th>کد ملی</th><th>موبایل</th><th>اعتبارسنجی</th></tr></thead><tbody>{importRows.slice(0, 50).map((row, index) => <tr key={String(row.sourceRow) + index} className={row.errors.length ? "invalid-row" : ""}><td>{nf.format(row.sourceRow || index + 1)}</td><td><bdi dir="ltr" className="um-mono">{row.national_id || "—"}</bdi></td><td><bdi dir="ltr" className="um-mono">{row.mobile || "—"}</bdi></td><td>{row.errors.length ? <span className="ui-row-errors" title={row.errors.join(" ")}>{row.errors.join(" ")}</span> : <span className="ui-valid"><Icon name="check" size={14} /> معتبر</span>}</td></tr>)}</tbody></table></div>
            {importRows.length > 50 && <p className="ui-preview-limit">۵۰ ردیف اول نمایش داده شده؛ اعتبارسنجی همه ردیف‌ها انجام شده است.</p>}
            <div className="ui-note"><Icon name="check" size={17} /> در صورت کوتاه بودن کد ملی تا ۱۰ رقم و موبایل تا ۱۱ رقم، صفرهای ابتدایی اضافه می‌شوند. صحت چک‌سام کد ملی و قالب موبایل ۰۹ بررسی می‌شود؛ مقدار بلندتر کوتاه نمی‌شود.</div>
          </div>}
          {importResult && <div className="ui-result"><strong>نتیجه ورود کاربران</strong><span>{nf.format(importResult.created_count || 0)} کاربر با موفقیت ثبت شد.</span><span>{nf.format(importResult.skipped_count || 0)} ردیف به دلیل کد ملی تکراری نادیده گرفته شد.</span>{importResult.skipped?.length > 0 && <div>{importResult.skipped.slice(0, 10).map((item, index) => <p key={String(item.national_id) + index}>ردیف {nf.format(item.row_number || index + 1)} — {item.reason}</p>)}</div>}</div>}
          <footer className="ui-footer"><span>{importRows.length ? "ثبت فقط در صورت معتبر بودن تمام ردیف‌ها فعال است." : "قالب پیشنهادی را دریافت و با اطلاعات کاربران تکمیل کنید."}</span><div><button type="button" className="ui-cancel" onClick={closeImport} disabled={importing || reading}>بستن</button><button type="button" className="ui-submit" onClick={importUsers} disabled={!canImport}>{importing ? "در حال ثبت کاربران…" : "اعتبارسنجی و ثبت کاربران"}</button></div></footer>
        </section>
      </div>}
    </main>
  );
}

export default UserManagement;
