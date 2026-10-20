import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { normalizeList } from "../../utils/collections";
import { formatDate } from "../../utils/date";
import Modal from "../../components/common/Modal";
import StatCard from "./cards/StatCard";
import RequestCard from "./cards/RequestCard";
import EmptyState from "./cards/EmptyState";
import SkeletonCard from "./cards/SkeletonCard";
import "../../styles/user-dashboard.css";

const PAGE_SIZE = 12;
const EMPTY_STATS = {
  total: 0,
  in_progress: 0,
  returned: 0,
  submitted: 0,
  under_review: 0,
  closed: 0,
  finalized: 0,
};

function tehranToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + "-" + values.month + "-" + values.day;
}

function requestTypeAvailability(type, requestTypeCounts, today = tehranToday()) {
  const used = Number(requestTypeCounts?.[type.code] || 0);

  if (type.is_active === false) {
    return { available: false, message: "ثبت این نوع درخواست در حال حاضر غیرفعال است." };
  }
  if (type.registration_start_date && today < type.registration_start_date) {
    return { available: false, message: "ثبت این نوع درخواست از " + formatDate(type.registration_start_date) + " آغاز می‌شود." };
  }
  if (type.registration_end_date && today > type.registration_end_date) {
    return { available: false, message: "مهلت ثبت این نوع درخواست در " + formatDate(type.registration_end_date) + " پایان یافته است." };
  }
  if (type.max_requests_per_user != null && used >= Number(type.max_requests_per_user)) {
    return {
      available: false,
      message: "به سقف مجاز (" + type.max_requests_per_user + " درخواست) برای این نوع پرونده رسیده‌اید.",
    };
  }

  // Do not show quota/count messaging while registration is still available.
  return { available: true, message: "" };
}

function requestEditBlockedMessage(type, request, today = tehranToday()) {
  if (!type) return "";

  const status = request.status;
  const editableStatuses = ["IN_PROGRESS", "RETURNED", "SUBMITTED"];
  if (!editableStatuses.includes(status)) return "";

  if (type.is_active === false) {
    return "نوع این درخواست غیرفعال شده است؛ این پرونده فقط برای مشاهده در دسترس است.";
  }
  if (type.edit_until_date && today > type.edit_until_date) {
    return "مهلت ویرایش این پرونده در " + formatDate(type.edit_until_date) + " پایان یافته است؛ اطلاعات فقط برای مشاهده در دسترس است.";
  }

  // Registration windows affect unfinished/returned requests, not a submitted request.
  if (status === "SUBMITTED") return "";
  if (type.registration_start_date && today < type.registration_start_date) {
    return "تکمیل این پرونده از " + formatDate(type.registration_start_date) + " امکان‌پذیر است.";
  }
  if (type.registration_end_date && today > type.registration_end_date) {
    return "مهلت تکمیل این پرونده در " + formatDate(type.registration_end_date) + " پایان یافته است.";
  }

  return "";
}

function Dashboard({ user, onOpenRequest, onCreated, onError }) {
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [requestTypeCounts, setRequestTypeCounts] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: PAGE_SIZE,
    total_items: 0,
    total_pages: 1,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    api.requestTypes()
      .then((result) => {
        if (!cancelled) setTypes(normalizeList(result));
      })
      .catch((error) => {
        if (!cancelled) onError({ type: "error", text: error.message, requestId: error.requestId });
      });
    return () => { cancelled = true; };
  }, [onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    api.requestDashboard({
      page,
      page_size: PAGE_SIZE,
      search: debouncedSearchQuery,
      status_filter: activeFilter,
    }, controller.signal)
      .then((result) => {
        if (cancelled) return;
        setRequests(Array.isArray(result?.items) ? result.items : []);
        setStats({ ...EMPTY_STATS, ...(result?.stats || {}) });
        setRequestTypeCounts(result?.request_type_counts || {});
        setPagination({
          page: Number(result?.pagination?.page) || page,
          page_size: Number(result?.pagination?.page_size) || PAGE_SIZE,
          total_items: Number(result?.pagination?.total_items) || 0,
          total_pages: Math.max(1, Number(result?.pagination?.total_pages) || 1),
        });
      })
      .catch((error) => {
        if (!cancelled && error.name !== "AbortError") {
          onError({ type: "error", text: error.message, requestId: error.requestId });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, debouncedSearchQuery, activeFilter, onError]);

  const createRequest = async () => {
    if (!selectedType) return;
    setCreating(true);
    try {
      const request = await api.createRequest(selectedType);
      setSelectedType(null);
      onCreated(request);
    } catch (error) {
      onError({ type: "error", text: error.message, requestId: error.requestId });
    } finally {
      setCreating(false);
    }
  };

  const inProgress = Number(stats.in_progress || 0);
  const returned = Number(stats.returned || 0);
  const finalized = Number(stats.finalized || 0);
  const filters = [
    { id: "all", label: "همه پرونده‌ها", count: Number(stats.total || 0) },
    { id: "in-progress", label: "در حال تکمیل", count: inProgress },
    { id: "returned", label: "نیازمند اصلاح", count: returned },
    { id: "finalized", label: "ثبت‌شده", count: finalized },
  ];

  const visibleRequests = requests;
  const hasRequests = Number(stats.total || 0) > 0;

  const openNewRequest = () => {
    const firstAvailable = types.find((item) => requestTypeAvailability(item, requestTypeCounts).available);
    setSelectedType(firstAvailable?.code || types[0]?.code || null);
  };

  const selectedTypeItem = types.find((item) => item.code === selectedType);
  const selectedTypeAvailability = selectedTypeItem
    ? requestTypeAvailability(selectedTypeItem, requestTypeCounts)
    : { available: false, message: "" };

  return (
    <main className="page dashboard-page ud-dashboard-page" dir="rtl">
      <section className="ud-dashboard-hero">
        <div className="ud-hero-copy">
          <span className="ud-hero-overline"><i /> پنل شخصی <b>RECRUIT</b></span>
          <h1>مسیر پرونده‌تان را <span>با خیال راحت</span> دنبال کنید.</h1>
          <p>وضعیت درخواست‌ها را یک‌جا ببینید و هر پرونده را از همان مرحله‌ای که مانده، ادامه دهید.</p>
          <div className="ud-hero-actions">
            <button className="primary-button ud-hero-cta" onClick={openNewRequest} disabled={!types.length}>
              <span className="plus">+</span> ثبت درخواست جدید
            </button>
            <span className="ud-hero-hint"><span className="ud-hint-check">✓</span> ساده، مرحله‌به‌مرحله و قابل پیگیری</span>
          </div>
        </div>

        <div className="ud-hero-visual" aria-hidden="true">
          <div className="ud-visual-orbit ud-orbit-one" />
          <div className="ud-visual-orbit ud-orbit-two" />
          <div className="ud-visual-card">
            <div className="ud-visual-card-head">
              <span className="ud-visual-card-mark">R</span>
              <div><strong>مسیر پرونده</strong><small>نمای کلی مراحل</small></div>
              <span className="ud-visual-live"><i /> پیگیری</span>
            </div>
            <div className="ud-visual-steps">
              <div className="ud-visual-step is-done"><span>✓</span><div><b>اطلاعات اولیه</b><small>شروع پرونده</small></div></div>
              <div className="ud-visual-step is-current"><span>2</span><div><b>تکمیل اطلاعات</b><small>ادامه از مرحله جاری</small></div></div>
              <div className="ud-visual-step"><span>3</span><div><b>مرور و ثبت نهایی</b><small>مرحله پایانی</small></div></div>
            </div>
            <div className="ud-visual-card-foot"><span className="ud-visual-foot-line" /><small>همه چیز از یک نقطه در دسترس شماست</small></div>
          </div>
          <div className="ud-floating-note"><span>✦</span><div><strong>همیشه در جریان باشید</strong><small>آخرین وضعیت پرونده‌ها</small></div></div>
        </div>
        <div className="ud-hero-decoration" />
      </section>

      <section className="stats-grid ud-stats-grid" aria-label="خلاصه درخواست‌ها">
        <StatCard label="کل پرونده‌ها" value={Number(stats.total || 0)} icon="▤" />
        <StatCard label="در حال تکمیل" value={inProgress} icon="◷" />
        <StatCard label="نیازمند اصلاح" value={returned} icon="↺" />
        <StatCard label="ثبت نهایی‌شده" value={finalized} icon="✓" />
      </section>

      <section className="dashboard-section ud-requests-section">
        <div className="section-heading ud-section-heading">
          <div>
            <span className="eyebrow">مدیریت و پیگیری</span>
            <h2>پرونده‌های من</h2>
            <p>برای مشاهده جزئیات یا ادامه تکمیل، پرونده موردنظر را انتخاب کنید.</p>
          </div>
          {!loading && <span className="ud-result-count">{visibleRequests.length} <small>از</small> {pagination.total_items} پرونده</span>}
        </div>

        {!loading && hasRequests && (
          <div className="ud-tools">
            <label className="ud-search">
              <span className="ud-search-icon" aria-hidden="true">⌕</span>
              <span className="sr-only">جست‌وجوی پرونده‌ها</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="جست‌وجو با کد رهگیری یا مرحله پرونده..."
              />
              {searchQuery && <button type="button" aria-label="پاک کردن جست‌وجو" onClick={() => setSearchQuery("")}>×</button>}
            </label>
            <div className="ud-filter-tabs" role="group" aria-label="فیلتر پرونده‌ها">
              {filters.map((filter) => (
                <button
                  type="button"
                  key={filter.id}
                  className={"ud-filter-tab" + (activeFilter === filter.id ? " is-active" : "")}
                  onClick={() => {
                    setActiveFilter(filter.id);
                    setPage(1);
                  }}
                  aria-pressed={activeFilter === filter.id}
                >
                  <span>{filter.label}</span><b>{filter.count}</b>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="skeleton-list ud-skeleton-list"><SkeletonCard /><SkeletonCard /></div>
        ) : !hasRequests ? (
          <EmptyState onCreate={openNewRequest} />
        ) : visibleRequests.length === 0 ? (
          <div className="ud-no-results">
            <span className="ud-no-results-icon">⌕</span>
            <h3>پرونده‌ای با این مشخصات پیدا نشد</h3>
            <p>عبارت جست‌وجو یا فیلتر انتخاب‌شده را تغییر دهید.</p>
            <button type="button" className="outline-button" onClick={() => { setSearchQuery(""); setActiveFilter("all"); setPage(1); }}>نمایش همه پرونده‌ها</button>
          </div>
        ) : (
          <div className="request-grid ud-request-grid">
            {visibleRequests.map((request) => (
              <RequestCard
                key={String(request.id)}
                request={request}
                onOpen={onOpenRequest}
                editBlockedMessage={requestEditBlockedMessage(
                  types.find((type) => type.code === request.request_type_code),
                  request,
                )}
              />
            ))}
          </div>
        )}
        {!loading && hasRequests && pagination.total_pages > 1 && (
          <div className="ud-pagination">
            <span>
              صفحه {pagination.page} از {pagination.total_pages} ·
              {" "}{pagination.total_items} پرونده
            </span>
            <div>
              <button
                type="button"
                className="outline-button"
                disabled={loading || page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >قبلی</button>
              <button
                type="button"
                className="outline-button"
                disabled={loading || page >= pagination.total_pages}
                onClick={() => setPage((current) => Math.min(pagination.total_pages, current + 1))}
              >بعدی</button>
            </div>
          </div>
        )}
      </section>

      {selectedType && (
        <Modal title="درخواست جدید" onClose={() => setSelectedType(null)}>
          <div className="modal-copy">
            <span className="eyebrow">انتخاب نوع پرونده</span>
            <h3>با چه نوع درخواستی شروع کنیم؟</h3>
            <p>نوع پرونده، مسیر مرحله‌ای و اطلاعات لازم برای ادامه کار را مشخص می‌کند.</p>
          </div>
          <div className="request-type-list">
            {types.map((item) => {
              const availability = requestTypeAvailability(item, requestTypeCounts);
              return (
                <button
                  key={item.code}
                  type="button"
                  className={"request-type " + (selectedType === item.code ? "selected" : "") + (!availability.available ? " is-unavailable" : "")}
                  onClick={() => setSelectedType(item.code)}
                  aria-pressed={selectedType === item.code}
                >
                  <div className="type-icon">{item.code === "SCREENING" ? "S" : "E"}</div>
                  <div className="request-type-copy">
                    <strong>{item.title}</strong>
                    <span>{item.workflow_key === "screening" ? "فرآیند کامل گزینش" : "فرآیند استخدام"}</span>
                    {availability.message && (
                      <small className="request-type-limit is-blocked">{availability.message}</small>
                    )}
                  </div>
                  <span className="type-arrow">{availability.available ? "←" : "i"}</span>
                </button>
              );
            })}
          </div>
          <div className="modal-actions">
            <button className="ghost-button" onClick={() => setSelectedType(null)}>انصراف</button>
            <button className="primary-button" disabled={creating || !selectedTypeAvailability.available} onClick={createRequest}>{creating ? "در حال ایجاد…" : "ایجاد پرونده و شروع"}</button>
          </div>
        </Modal>
      )}
    </main>
  );
}

export default Dashboard;
