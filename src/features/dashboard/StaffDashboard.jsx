import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { STEP_META } from "../../config/workflow";
import { statusLabel } from "../../utils/status";
import { formatDate } from "../../utils/date";
import { normalizeList } from "../../utils/collections";
import Modal from "../../components/common/Modal";
import { printRequestReport } from "../../utils/requestPdf";
import WorkflowManager from "./WorkflowManager";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "IN_PROGRESS", label: "در حال تکمیل" },
  { value: "RETURNED", label: "برگشت داده شده" },
  { value: "SUBMITTED", label: "ثبت نهایی شده" },
  { value: "UNDER_REVIEW", label: "در حال بررسی" },
  { value: "APPROVED", label: "تأیید شده" },
  { value: "REJECTED", label: "رد شده" },
  { value: "COMPLETED", label: "تکمیل شده" },
];

const METRICS = [
  { key: "total", label: "کل درخواست‌ها", icon: "▦", tone: "blue" },
  { key: "in_progress", label: "در حال تکمیل", icon: "◷", tone: "blue" },
  { key: "submitted", label: "ثبت نهایی شده", icon: "✓", tone: "green" },
  { key: "under_review", label: "در حال بررسی", icon: "⌕", tone: "violet" },
  { key: "returned", label: "برگشت داده شده", icon: "↶", tone: "amber" },
  { key: "closed", label: "مختومه", icon: "▣", tone: "slate" },
];

const numberFormat = new Intl.NumberFormat("fa-IR");

function fullName(applicant) {
  const value = [applicant?.first_name, applicant?.last_name].filter(Boolean).join(" ").trim();
  return value || "مشخصات فردی تکمیل نشده";
}

function StaffDashboard({ onError, user }) {
  const [requestTypes, setRequestTypes] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [page, setPage] = useState(1);

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [workspace, setWorkspace] = useState("requests");
  const [reviewWorkflow, setReviewWorkflow] = useState(null);
  const [decisionMode, setDecisionMode] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [returnStepKey, setReturnStepKey] = useState("");
  const [decisionBusy, setDecisionBusy] = useState(false);
  const canExportReport = user?.role === "ADMIN";

  useEffect(() => {
    let cancelled = false;
    setMetadataLoading(true);
    Promise.all([api.requestTypes(), api.allProvinces()])
      .then(([typesData, provincesData]) => {
        if (cancelled) return;
        setRequestTypes(normalizeList(typesData));
        setProvinces(normalizeList(provincesData));
        setMetadataError("");
      })
      .catch((reason) => {
        if (!cancelled) setMetadataError(reason.message || "بارگذاری فیلترها انجام نشد.");
      })
      .finally(() => {
        if (!cancelled) setMetadataLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedProvince) {
      setCities([]);
      setSelectedCity("");
      return undefined;
    }

    api.citiesByProvince(selectedProvince)
      .then((items) => {
        if (cancelled) return;
        setCities(normalizeList(items));
        setSelectedCity((current) =>
          normalizeList(items).some((city) => String(city.id) === String(current)) ? current : ""
        );
      })
      .catch(() => {
        if (!cancelled) {
          setCities([]);
          setSelectedCity("");
        }
      });

    return () => { cancelled = true; };
  }, [selectedProvince]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    api.staffDashboard({
      page,
      page_size: PAGE_SIZE,
      search,
      status: selectedStatus,
      request_type: selectedType,
      province_id: selectedProvince,
      city_id: selectedCity,
    }, controller.signal)
      .then((result) => setDashboard(result))
      .catch((reason) => {
        if (reason.name !== "AbortError") {
          setError(reason.message || "دریافت اطلاعات داشبورد با مشکل مواجه شد.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, search, selectedStatus, selectedType, selectedProvince, selectedCity, refreshKey]);

  const stats = dashboard?.stats || {};
  const items = normalizeList(dashboard?.items);
  const pagination = dashboard?.pagination || { total_items: 0, total_pages: 0, page: 1 };
  const hasFilters = Boolean(searchInput || selectedStatus || selectedType || selectedProvince || selectedCity);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setSelectedStatus("");
    setSelectedType("");
    setSelectedProvince("");
    setSelectedCity("");
    setPage(1);
  };

  const metricCards = useMemo(() => METRICS.map((item) => ({
    ...item,
    value: numberFormat.format(stats[item.key] || 0),
  })), [stats]);

  const retry = () => {
    setRefreshKey((value) => value + 1);
  };

  useEffect(() => {
    let cancelled = false;
    setReviewWorkflow(null);
    setDecisionMode("");
    setDecisionReason("");
    setReturnStepKey("");
    if (!selectedRequest || !["SUBMITTED", "UNDER_REVIEW"].includes(selectedRequest.status)) {
      return () => { cancelled = true; };
    }
    api.staffRequestWorkflow(selectedRequest.id)
      .then((workflow) => {
        if (cancelled) return;
        setReviewWorkflow(workflow);
        const returnableKeys = workflow.returnable_step_keys || [];
        const firstReturnable = (workflow.groups || [])
          .flatMap((group) => group.steps || [])
          .find((step) => returnableKeys.includes(step.key));
        setReturnStepKey(firstReturnable?.key || "");
      })
      .catch((reason) => {
        if (!cancelled) onError?.({ type: "error", text: reason.message || "دریافت مراحل پرونده برای اصلاح انجام نشد." });
      });
    return () => { cancelled = true; };
  }, [selectedRequest?.id, selectedRequest?.status]);

  const submitDecision = async () => {
    if (!selectedRequest || !decisionMode || decisionBusy) return;
    const reason = decisionReason.trim();
    if (decisionMode !== "APPROVE" && reason.length < 3) {
      onError?.({ type: "error", text: decisionMode === "RETURN" ? "علت درخواست اصلاح را وارد کنید." : "علت رد درخواست را وارد کنید." });
      return;
    }
    if (decisionMode === "RETURN" && !returnStepKey) {
      onError?.({ type: "error", text: "مرحله‌ی موردنیاز برای اصلاح را انتخاب کنید." });
      return;
    }
    setDecisionBusy(true);
    try {
      await api.decideStaffRequest(selectedRequest.id, {
        decision: decisionMode,
        reason: reason || null,
        return_step_key: decisionMode === "RETURN" ? returnStepKey : null,
      });
      const successMessage = decisionMode === "APPROVE"
        ? "درخواست با موفقیت تأیید شد."
        : decisionMode === "REJECT"
          ? "درخواست رد شد."
          : "پرونده برای اصلاح برگشت داده شد.";
      setSelectedRequest(null);
      setDecisionMode("");
      setDecisionReason("");
      retry();
      onError?.({ type: "success", text: successMessage });
    } catch (reasonError) {
      onError?.({ type: "error", text: reasonError.message || "ثبت تصمیم انجام نشد." });
    } finally {
      setDecisionBusy(false);
    }
  };

  const exportSelectedRequest = async () => {
    if (!canExportReport || !selectedRequest?.id || reportLoading) return;
    setReportLoading(true);
    try {
      await printRequestReport(selectedRequest.id, { staff: true });
    } catch (reason) {
      onError?.({
        type: "error",
        text: reason.message || "آماده‌سازی گزارش PDF با مشکل مواجه شد.",
      });
    } finally {
      setReportLoading(false);
    }
  };

  if (workspace === "workflow" && user?.role === "ADMIN") {
    return (
      <main className="page staff-dashboard-page">
        <div className="staff-workspace-tabs" role="tablist" aria-label="بخش‌های مدیریت">
          <button type="button" role="tab" aria-selected={false} onClick={() => setWorkspace("requests")}>مدیریت درخواست‌ها</button>
          <button type="button" role="tab" aria-selected={true} className="is-active">مدیریت گردش‌کار</button>
        </div>
        <WorkflowManager onError={onError} />
      </main>
    );
  }

  return (
    <main className="page staff-dashboard-page">
      <div className="staff-workspace-tabs" role="tablist" aria-label="بخش‌های مدیریت">
        <button type="button" role="tab" aria-selected={true} className="is-active">مدیریت درخواست‌ها</button>
        {user?.role === "ADMIN" && <button type="button" role="tab" aria-selected={false} onClick={() => setWorkspace("workflow")}>مدیریت گردش‌کار</button>}
      </div>
      <section className="staff-dashboard-hero">
        <div className="staff-dashboard-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> مرکز عملیات و پایش</span>
          <h1>داشبورد مدیریت درخواست‌ها</h1>
          <p>نمای یکپارچه درخواست‌های استخدام و گزینش، وضعیت پرونده‌ها و اطلاعات مکانی متقاضیان.</p>
        </div>
        <div className="staff-dashboard-hero-meta">
          <div className="staff-live-indicator"><span /> داده‌های زنده سامانه</div>
          <div className="staff-dashboard-meta-note">دسترسی مدیریتی · جست‌وجوی سراسری</div>
        </div>
      </section>

      <section className="staff-metrics-grid" aria-label="آمار درخواست‌ها">
        {metricCards.map((metric) => (
          <article className={`staff-metric-card tone-${metric.tone}`} key={metric.key}>
            <div className="staff-metric-top">
              <span className="staff-metric-icon" aria-hidden="true">{metric.icon}</span>
              <span className="staff-metric-caption">{metric.label}</span>
            </div>
            <strong className="staff-metric-value">{loading && !dashboard ? "—" : metric.value}</strong>
            <span className="staff-metric-foot">{metric.key === "total" ? "در محدوده فیلترهای فعلی" : "بر اساس وضعیت فعلی پرونده‌ها"}</span>
          </article>
        ))}
      </section>

      <section className="staff-list-section">
        <div className="staff-list-heading">
          <div>
            <span className="eyebrow">مدیریت و جست‌وجو</span>
            <h2>فهرست درخواست‌ها</h2>
            <p>با ترکیب فیلترها، پرونده موردنظر را سریع‌تر پیدا کنید.</p>
          </div>
          <div className="staff-list-heading-side">
            <span className="staff-data-chip"><span className="staff-data-chip-dot" /> {numberFormat.format(pagination.total_items || 0)} نتیجه</span>
            <button className="staff-refresh-button" type="button" onClick={retry} disabled={loading} aria-label="به‌روزرسانی فهرست">
              <span className={loading ? "staff-refresh-icon is-spinning" : "staff-refresh-icon"}>↻</span>
              به‌روزرسانی
            </button>
          </div>
        </div>

        <div className="staff-filter-panel">
          <div className="staff-filter-panel-head">
            <div className="staff-filter-title"><span aria-hidden="true">☷</span><strong>فیلترهای پیشرفته</strong></div>
            {hasFilters && <button className="staff-clear-filters" type="button" onClick={clearFilters}>پاک کردن فیلترها <span>×</span></button>}
          </div>
          <div className="staff-filter-grid">
            <label className="staff-search-field">
              <span>جست‌وجوی متقاضی یا پرونده</span>
              <div className="staff-search-control">
                <span className="staff-search-icon" aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => { setSearchInput(event.target.value); setPage(1); }}
                  placeholder="نام، نام خانوادگی، کد ملی، موبایل یا کد رهگیری…"
                  aria-label="جست‌وجوی متقاضی یا پرونده"
                />
                {searchInput && <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} aria-label="پاک کردن جست‌وجو">×</button>}
              </div>
            </label>

            <label className="staff-filter-field">
              <span>نوع درخواست</span>
              <select value={selectedType} onChange={(event) => { setSelectedType(event.target.value); setPage(1); }} disabled={metadataLoading}>
                <option value="">همه انواع درخواست</option>
                {requestTypes.map((item) => <option key={item.code} value={item.code}>{item.title}</option>)}
              </select>
            </label>

            <label className="staff-filter-field">
              <span>وضعیت پرونده</span>
              <select value={selectedStatus} onChange={(event) => { setSelectedStatus(event.target.value); setPage(1); }}>
                <option value="">همه وضعیت‌ها</option>
                {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <label className="staff-filter-field">
              <span>استان متقاضی</span>
              <select value={selectedProvince} onChange={(event) => { setSelectedProvince(event.target.value); setSelectedCity(""); setPage(1); }} disabled={metadataLoading}>
                <option value="">همه استان‌ها</option>
                {provinces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>

            <label className="staff-filter-field">
              <span>شهر متقاضی</span>
              <select value={selectedCity} onChange={(event) => { setSelectedCity(event.target.value); setPage(1); }} disabled={!selectedProvince || cities.length === 0}>
                <option value="">همه شهرها</option>
                {cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>
          {metadataError && <div className="staff-inline-warning">{metadataError}</div>}
          <div className="staff-filter-footnote">
            <span aria-hidden="true">ⓘ</span>
            استان و شهر بر اساس نشانی فعلی و در صورت نبود آن، محل تولد متقاضی است. فیلتر وضعیت فقط فهرست جدول را محدود می‌کند.
          </div>
        </div>

        <div className="staff-table-card">
          <div className="staff-table-topline">
            <div><strong>پرونده‌ها</strong><span>{loading ? "در حال دریافت اطلاعات…" : `نمایش ${numberFormat.format(items.length)} مورد از ${numberFormat.format(pagination.total_items || 0)} نتیجه`}</span></div>
            <span className="staff-table-page-size">۱۰ پرونده در هر صفحه</span>
          </div>

          {error ? (
            <div className="staff-state-panel staff-error-state">
              <span className="staff-state-icon">!</span>
              <strong>بارگذاری اطلاعات انجام نشد</strong>
              <p>{error}</p>
              <button className="primary-button" type="button" onClick={retry}>تلاش مجدد</button>
            </div>
          ) : loading && !dashboard ? (
            <div className="staff-table-loading" aria-label="در حال بارگذاری">
              {Array.from({ length: 6 }, (_, index) => <div className="staff-skeleton-row" key={index}><i /><i /><i /><i /><i /></div>)}
            </div>
          ) : items.length === 0 ? (
            <div className="staff-state-panel">
              <span className="staff-state-icon">⌕</span>
              <strong>{hasFilters ? "پرونده‌ای با این فیلترها پیدا نشد" : "هنوز درخواستی برای نمایش وجود ندارد"}</strong>
              <p>{hasFilters ? "فیلترها را تغییر دهید یا همه فیلترها را پاک کنید." : "پس از ثبت درخواست‌ها، فهرست آن‌ها در این بخش نمایش داده می‌شود."}</p>
              {hasFilters && <button className="ghost-button" type="button" onClick={clearFilters}>پاک کردن فیلترها</button>}
            </div>
          ) : (
            <div className="staff-table-scroll">
              <table className="staff-requests-table">
                <thead>
                  <tr>
                    <th>متقاضی</th>
                    <th>کد رهگیری</th>
                    <th>نوع درخواست</th>
                    <th>استان / شهر</th>
                    <th>مرحله فعلی</th>
                    <th>وضعیت</th>
                    <th>آخرین به‌روزرسانی</th>
                    <th><span className="sr-only">عملیات</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const applicant = item.applicant || {};
                    const [label, tone] = statusLabel(item.status);
                    const step = STEP_META[item.current_step_key];
                    const initials = [applicant.first_name, applicant.last_name].filter(Boolean).map((part) => part.trim()[0]).join("").slice(0, 2);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="staff-applicant-cell">
                            <span className="staff-applicant-avatar">{initials || "؟"}</span>
                            <span className="staff-applicant-copy">
                              <strong>{fullName(applicant)}</strong>
                              <small>{applicant.national_id_masked ? `کد ملی ${applicant.national_id_masked}` : "کد ملی ثبت نشده"}</small>
                            </span>
                          </div>
                        </td>
                        <td><span className="staff-tracking-code">{item.tracking_code}</span><small className="staff-cell-subline">ایجاد {formatDate(item.created_at)}</small></td>
                        <td><span className="staff-type-name">{item.request_type?.title || "—"}</span><small className="staff-cell-subline">{item.workflow_key === "screening" ? "فرآیند گزینش" : "فرآیند استخدام"}</small></td>
                        <td><strong className="staff-location-main">{applicant.province_name || "—"}</strong><small className="staff-cell-subline">{applicant.city_name || "شهر ثبت نشده"}</small></td>
                        <td><span className="staff-step-name">{step?.title || item.current_step_key || "—"}</span></td>
                        <td><span className={`status-badge ${tone || "muted"}`}><i />{label}</span></td>
                        <td><span className="staff-updated-date">{formatDate(item.updated_at)}</span></td>
                        <td><button className="staff-row-action" type="button" onClick={() => setSelectedRequest(item)}>جزئیات <span>←</span></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!error && items.length > 0 && (
            <div className="staff-pagination">
              <span>صفحه {numberFormat.format(pagination.page || page)} از {numberFormat.format(pagination.total_pages || 1)}</span>
              <div>
                <button type="button" className="staff-page-button" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>قبلی</button>
                <span className="staff-page-number">{numberFormat.format(page)}</span>
                <button type="button" className="staff-page-button" disabled={loading || page >= (pagination.total_pages || 1)} onClick={() => setPage((value) => value + 1)}>بعدی</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {selectedRequest && (
        <Modal title="خلاصه پرونده" onClose={() => setSelectedRequest(null)}>
          <div className="staff-detail-header">
            <div className="staff-detail-avatar">{[selectedRequest.applicant?.first_name, selectedRequest.applicant?.last_name].filter(Boolean).map((part) => part.trim()[0]).join("").slice(0, 2) || "؟"}</div>
            <div>
              <span className="eyebrow">اطلاعات متقاضی</span>
              <h3>{fullName(selectedRequest.applicant)}</h3>
              <span className="staff-tracking-code">{selectedRequest.tracking_code}</span>
            </div>
          </div>
          <div className="staff-detail-grid">
            <div><span>نوع درخواست</span><strong>{selectedRequest.request_type?.title || "—"}</strong></div>
            <div><span>وضعیت پرونده</span><strong>{statusLabel(selectedRequest.status)[0]}</strong></div>
            <div><span>نام پدر</span><strong>{selectedRequest.applicant?.father_name || "—"}</strong></div>
            <div><span>کد ملی</span><strong>{selectedRequest.applicant?.national_id_masked || "—"}</strong></div>
            <div><span>شماره تماس</span><strong>{selectedRequest.applicant?.mobile_masked || "—"}</strong></div>
            <div><span>استان و شهر</span><strong>{[selectedRequest.applicant?.province_name, selectedRequest.applicant?.city_name].filter(Boolean).join("، ") || "—"}</strong></div>
            <div><span>مرحله فعلی</span><strong>{STEP_META[selectedRequest.current_step_key]?.title || selectedRequest.current_step_key || "—"}</strong></div>
            <div><span>تاریخ ثبت درخواست</span><strong>{formatDate(selectedRequest.created_at)}</strong></div>
            <div><span>آخرین به‌روزرسانی</span><strong>{formatDate(selectedRequest.updated_at)}</strong></div>
            <div><span>تاریخ ثبت نهایی</span><strong>{formatDate(selectedRequest.submitted_at)}</strong></div>
          </div>
          {["SUBMITTED", "UNDER_REVIEW"].includes(selectedRequest.status) && (
            <section className="staff-decision-panel">
              <div className="staff-decision-heading">
                <strong>تصمیم درباره‌ی درخواست</strong>
                <span>تأیید، رد یا بازگرداندن پرونده برای اصلاح</span>
              </div>
              <div className="staff-decision-choices">
                <button type="button" className="staff-decision-approve" onClick={() => { setDecisionMode("APPROVE"); setDecisionReason(""); }} disabled={decisionBusy}>✓ موافقت با درخواست</button>
                <button type="button" className="staff-decision-return" onClick={() => { setDecisionMode("RETURN"); setDecisionReason(""); }} disabled={decisionBusy}>↶ نیاز به اصلاح</button>
                <button type="button" className="staff-decision-reject" onClick={() => { setDecisionMode("REJECT"); setDecisionReason(""); }} disabled={decisionBusy}>× رد درخواست</button>
              </div>
              {decisionMode && (
                <div className="staff-decision-form">
                  <strong>{decisionMode === "APPROVE" ? "تأیید درخواست" : decisionMode === "REJECT" ? "رد درخواست" : "بازگشت برای اصلاح"}</strong>
                  {decisionMode === "RETURN" && (
                    <label>
                      <span>مرحله‌ای که متقاضی باید اصلاح کند</span>
                      <select value={returnStepKey} onChange={(event) => setReturnStepKey(event.target.value)} disabled={!reviewWorkflow || decisionBusy}>
                        <option value="">انتخاب مرحله…</option>
                        {(reviewWorkflow?.groups || []).flatMap((group) => group.steps || []).filter((step) => (reviewWorkflow?.returnable_step_keys || []).includes(step.key)).map((step) => (
                          <option key={step.key} value={step.key}>{step.title}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {decisionMode !== "APPROVE" && (
                    <label>
                      <span>علت تصمیم (الزامی)</span>
                      <textarea rows={3} maxLength={2000} value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} placeholder={decisionMode === "RETURN" ? "مورد یا اطلاعاتی که باید اصلاح شود را شرح دهید…" : "علت رد درخواست را شرح دهید…"} />
                    </label>
                  )}
                  <div className="staff-decision-form-actions">
                    <button type="button" className="ghost-button" disabled={decisionBusy} onClick={() => { setDecisionMode(""); setDecisionReason(""); }}>انصراف</button>
                    <button type="button" className="primary-button" disabled={decisionBusy || (decisionMode === "RETURN" && (!reviewWorkflow || !returnStepKey))} onClick={submitDecision}>
                      {decisionBusy ? "در حال ثبت…" : "ثبت تصمیم"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
          <div className="staff-detail-footer">
            <span>{canExportReport ? "گزارش شامل اطلاعات فرم، وضعیت مراحل و فهرست مدارک است." : "جزئیات پرونده انتخاب‌شده."}</span>
            <div className="staff-detail-actions">
              <button className="ghost-button" type="button" onClick={() => setSelectedRequest(null)}>بستن</button>
              {canExportReport && (
                <button className="primary-button" type="button" onClick={exportSelectedRequest} disabled={reportLoading}>
                  {reportLoading ? "در حال آماده‌سازی…" : "چاپ / ذخیره PDF کامل"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

export default StaffDashboard;
