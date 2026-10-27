import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import AdminBreadcrumb from "../../components/layout/AdminBreadcrumb";
import { readUserSpreadsheet } from "../../utils/userSpreadsheet";
import "../../styles/user-management.css";

const nf = new Intl.NumberFormat("fa-IR");
const PAGE_SIZE = 10;
const ROLE_LABELS = { APPLICANT: "متقاضی", OFFICER: "کارشناس", REVIEWER: "بازبین پرونده", SUPERVISOR: "سرپرست", ADMIN: "مدیر سامانه" };

function Icon({ name, size = 20 }) {
  const icons = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>,
    download: <><path d="M12 4v12m-5-5 5 5 5-5" /><path d="M4 18v2h16v-2" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9A7 7 0 0 1 17 6l3 6M4 12l3 6a7 7 0 0 0 11.5-3" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name] || icons.users}</svg>;
}

function downloadTemplate() {
  const blob = new Blob(["\uFEFFنام,نام خانوادگی,کد ملی,موبایل\r\n"], { type: "text/csv;charset=utf-8;" });
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
function userFullName(user) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || "نام ثبت نشده";
}

function UserManagement({ onError }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [pagination, setPagination] = useState({ page: 1, page_size: PAGE_SIZE, total_items: 0, total_pages: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
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
    api.staffUsers({ page, page_size: PAGE_SIZE, search }, controller.signal)
      .then((data) => {
        setUsers(Array.isArray(data?.items) ? data.items : []);
        setStats(data?.stats || { total: 0, active: 0, inactive: 0 });
        setPagination(data?.pagination || { page: 1, page_size: PAGE_SIZE, total_items: 0, total_pages: 0 });
      })
      .catch((error) => { if (error.name !== "AbortError") setLoadError(error.message || "دریافت فهرست کاربران انجام نشد."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, search, refreshKey]);

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
        first_name: row.first_name, last_name: row.last_name, national_id: row.national_id, mobile: row.mobile, source_row: row.sourceRow,
      })) });
      setImportResult(result); setPage(1); setSearch(""); setSearchInput(""); setRefreshKey((value) => value + 1);
      onError?.({ type: "success", text: nf.format(result?.created_count || 0) + " کاربر ثبت شد؛ " + nf.format(result?.skipped_count || 0) + " ردیف تکراری رد شد." });
    } catch (error) { setFileError(error.message || "ثبت کاربران انجام نشد."); }
    finally { setImporting(false); }
  }

  function closeImport() {
    if (importing || reading) return;
    setImportOpen(false); setFileName(""); setImportRows([]); setFileError(""); setImportResult(null);
  }

  return (
    <main className="page user-management-page">
      <AdminBreadcrumb items={["پنل مدیریت", "مدیریت کاربران"]} />
      <section className="um-hero">
        <div className="um-hero-copy">
          <span className="um-eyebrow"><i /> مدیریت دسترسی و حساب‌ها</span>
          <h1>مدیریت کاربران</h1>
          <p>حساب‌های سامانه را جست‌وجو کنید یا اطلاعات کاربران را با کنترل و اعتبارسنجی کامل از فایل اکسل وارد کنید.</p>
          <div className="um-hero-actions">
            <button type="button" className="um-primary" onClick={() => setImportOpen(true)}><Icon name="upload" /> ورود کاربران از اکسل</button>
            <button type="button" className="um-secondary" onClick={downloadTemplate}><Icon name="download" size={18} /> دانلود قالب اکسل</button>
          </div>
        </div>
        <div className="um-hero-icon"><Icon name="users" size={31} /></div><i className="um-orbit one" /><i className="um-orbit two" />
      </section>

      <section className="um-stats">
        <article><span className="um-stat-icon"><Icon name="users" /></span><span>کل کاربران</span><strong>{nf.format(stats.total || 0)}</strong><small>تمام حساب‌های ثبت‌شده</small></article>
        <article><span className="um-stat-icon active"><Icon name="check" /></span><span>کاربران فعال</span><strong>{nf.format(stats.active || 0)}</strong><small>حساب‌های مجاز به ورود</small></article>
        <article><span className="um-stat-icon inactive"><Icon name="alert" /></span><span>کاربران غیرفعال</span><strong>{nf.format(stats.inactive || 0)}</strong><small>حساب‌های غیرفعال یا مسدود</small></article>
      </section>

      <section className="um-list-card">
        <div className="um-list-heading">
          <div><span className="um-kicker">فهرست حساب‌ها</span><h2>کاربران سامانه</h2><p>جست‌وجو بر اساس نام، نام خانوادگی، کد ملی یا موبایل</p></div>
          <button type="button" className="um-outline" disabled={loading} onClick={() => setRefreshKey((value) => value + 1)}><Icon name="refresh" size={17} /> به‌روزرسانی</button>
        </div>
        <div className="um-toolbar">
          <label className="um-search"><Icon name="search" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="جست‌وجوی نام، کد ملی یا موبایل…" aria-label="جست‌وجوی کاربران" />{searchInput && <button type="button" onClick={() => setSearchInput("")} aria-label="پاک کردن جست‌وجو"><Icon name="close" size={15} /></button>}</label>
          <span>{nf.format(pagination.total_items || 0)} نتیجه</span>
        </div>
        {loadError && <div className="um-error" role="alert"><Icon name="alert" /><span>{loadError}</span><button type="button" onClick={() => setRefreshKey((value) => value + 1)}>تلاش مجدد</button></div>}
        <div className="um-table-wrap">
          <table className="um-table">
            <thead><tr><th>کاربر</th><th>کد ملی</th><th>موبایل</th><th>نقش</th><th>وضعیت</th><th>تاریخ عضویت</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="um-message"><span className="um-spinner" /> در حال دریافت کاربران…</td></tr>
                : users.length === 0 ? <tr><td colSpan={6} className="um-message"><span className="um-empty"><Icon name="users" size={25} /></span><strong>{search ? "کاربری با این مشخصات پیدا نشد" : "هنوز کاربری برای نمایش وجود ندارد"}</strong><span>{search ? "عبارت جست‌وجو را تغییر دهید." : "می‌توانید کاربران را از طریق اکسل اضافه کنید."}</span></td></tr>
                : users.map((user) => <tr key={user.id}>
                  <td><div className="um-person"><span className="um-avatar">{(user.first_name || user.last_name || "ک").trim().slice(0, 1)}</span><span><strong>{userFullName(user)}</strong><small>حساب سامانه</small></span></div></td>
                  <td><bdi dir="ltr" className="um-mono">{user.national_id || "—"}</bdi></td>
                  <td><bdi dir="ltr" className="um-mono">{user.mobile || "—"}</bdi></td>
                  <td><span className={"um-role" + (user.role === "ADMIN" ? " admin" : "")}>{ROLE_LABELS[user.role] || user.role || "—"}</span></td>
                  <td><span className={"um-status" + (user.status === "ACTIVE" ? " active" : " inactive")}><i />{user.status === "ACTIVE" ? "فعال" : "غیرفعال"}</span></td>
                  <td className="um-date">{formatDate(user.created_at)}</td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <div className="um-pagination">
          <span>نمایش {nf.format(firstRow)} تا {nf.format(lastRow)} از {nf.format(pagination.total_items || 0)} کاربر</span>
          <div><button type="button" disabled={loading || page <= 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>قبلی</button><span>صفحه {nf.format(page)} از {nf.format(totalPages)}</span><button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((v) => Math.min(totalPages, v + 1))}>بعدی</button></div>
        </div>
      </section>

      {importOpen && <div className="ui-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeImport(); }}>
        <section className="ui-dialog" role="dialog" aria-modal="true" aria-labelledby="ui-title" dir="rtl">
          <header className="ui-header"><span className="ui-title-icon"><Icon name="file" size={23} /></span><div><span className="um-kicker">ورود گروهی</span><h2 id="ui-title">افزودن کاربران از اکسل</h2><p>فایل را انتخاب کنید، پیش‌نمایش را بررسی و سپس ثبت کنید.</p></div><button type="button" className="ui-close" onClick={closeImport} disabled={importing || reading} aria-label="بستن"><Icon name="close" /></button></header>
          <div className="ui-guide"><strong>ساختار ستون‌ها</strong><div className="ui-columns"><span>نام</span><span>نام خانوادگی</span><span>کد ملی</span><span>موبایل</span></div><p>این چهار ستون را به همین ترتیب قرار دهید. اگر عنوان ستون‌ها در ردیف اول باشد، ترتیب از روی عنوان تشخیص داده می‌شود.</p><p>فرمت‌های <bdi dir="ltr">.xlsx</bdi>، <bdi dir="ltr">.csv</bdi> و <bdi dir="ltr">.tsv</bdi> تا ۱۰ مگابایت و ۱۰۰۰ ردیف پشتیبانی می‌شوند.</p></div>
          <div className="ui-drop"><span className="ui-upload-icon"><Icon name="upload" size={25} /></span><strong>{fileName || "انتخاب فایل اکسل"}</strong><span>{reading ? "در حال خواندن و اعتبارسنجی…" : "فایل را انتخاب کنید تا پیش‌نمایش آن نمایش داده شود."}</span><label className="ui-file-button">{reading ? "در حال پردازش…" : "انتخاب فایل"}<input type="file" accept=".xlsx,.csv,.tsv,text/csv,text/tab-separated-values" onChange={chooseFile} disabled={reading || importing} /></label><button type="button" className="ui-template" onClick={downloadTemplate}>دانلود قالب CSV</button></div>
          {fileError && <div className="ui-error" role="alert"><Icon name="alert" size={18} /><span>{fileError}</span></div>}
          {importRows.length > 0 && <div className="ui-preview"><div className="ui-preview-head"><div><h3>پیش‌نمایش اطلاعات</h3><span>{nf.format(importRows.length)} ردیف خوانده شد</span></div><div className="ui-validation-count"><span>{nf.format(importRows.length - invalidRows.length)} معتبر</span><span className={invalidRows.length ? "invalid" : ""}>{nf.format(invalidRows.length)} دارای خطا</span></div></div>
            <div className="ui-table-scroll"><table className="ui-table"><thead><tr><th>ردیف</th><th>نام</th><th>نام خانوادگی</th><th>کد ملی</th><th>موبایل</th><th>اعتبارسنجی</th></tr></thead><tbody>{importRows.slice(0, 50).map((row, index) => <tr key={String(row.sourceRow) + index} className={row.errors.length ? "invalid-row" : ""}><td>{nf.format(row.sourceRow || index + 1)}</td><td>{row.first_name || "—"}</td><td>{row.last_name || "—"}</td><td><bdi dir="ltr" className="um-mono">{row.national_id || "—"}</bdi></td><td><bdi dir="ltr" className="um-mono">{row.mobile || "—"}</bdi></td><td>{row.errors.length ? <span className="ui-row-errors" title={row.errors.join(" ")}>{row.errors.join(" ")}</span> : <span className="ui-valid"><Icon name="check" size={14} /> معتبر</span>}</td></tr>)}</tbody></table></div>
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
