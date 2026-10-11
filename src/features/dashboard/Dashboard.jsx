import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { normalizeList } from "../../utils/collections";
import { STEP_META } from "../../config/workflow";
import Modal from "../../components/common/Modal";
import StatCard from "./cards/StatCard";
import RequestCard from "./cards/RequestCard";
import EmptyState from "./cards/EmptyState";
import SkeletonCard from "./cards/SkeletonCard";
import "../../styles/user-dashboard.css";

const ACTIVE_STATUSES = ["IN_PROGRESS", "DRAFT"];
const FINAL_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED"];

function Dashboard({ user, onOpenRequest, onCreated, onError }) {
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const load = async () => {
    try {
      const [reqs, requestTypes] = await Promise.all([api.requests(), api.requestTypes()]);
      setRequests(normalizeList(reqs));
      setTypes(normalizeList(requestTypes));
    } catch (error) {
      onError({ type: "error", text: error.message, requestId: error.requestId });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

  const inProgress = requests.filter((item) => ACTIVE_STATUSES.includes(item.status));
  const returned = requests.filter((item) => item.status === "RETURNED");
  const finalized = requests.filter((item) => FINAL_STATUSES.includes(item.status));

  const filters = [
    { id: "all", label: "همه پرونده‌ها", count: requests.length },
    { id: "in-progress", label: "در حال تکمیل", count: inProgress.length },
    { id: "returned", label: "نیازمند اصلاح", count: returned.length },
    { id: "finalized", label: "ثبت‌شده", count: finalized.length },
  ];

  const visibleRequests = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return requests.filter((request) => {
      const statusMatches =
        activeFilter === "all" ||
        (activeFilter === "in-progress" && ACTIVE_STATUSES.includes(request.status)) ||
        (activeFilter === "returned" && request.status === "RETURNED") ||
        (activeFilter === "finalized" && FINAL_STATUSES.includes(request.status));

      if (!statusMatches) return false;
      if (!query) return true;

      const searchable = [
        request.tracking_code,
        request.id,
        STEP_META[request.current_step_key]?.title,
        request.workflow_key === "screening" ? "گزینش فرآیند گزینش screening" : "استخدام employment",
      ].filter(Boolean).join(" ").toLocaleLowerCase();

      return searchable.includes(query);
    });
  }, [requests, searchQuery, activeFilter]);

  const openNewRequest = () => setSelectedType(types[0]?.code || null);

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
        <StatCard label="کل پرونده‌ها" value={requests.length} icon="▤" />
        <StatCard label="در حال تکمیل" value={inProgress.length} icon="◷" />
        <StatCard label="نیازمند اصلاح" value={returned.length} icon="↺" />
        <StatCard label="ثبت نهایی‌شده" value={finalized.length} icon="✓" />
      </section>

      <section className="dashboard-section ud-requests-section">
        <div className="section-heading ud-section-heading">
          <div>
            <span className="eyebrow">مدیریت و پیگیری</span>
            <h2>پرونده‌های من</h2>
            <p>برای مشاهده جزئیات یا ادامه تکمیل، پرونده موردنظر را انتخاب کنید.</p>
          </div>
          {!loading && <span className="ud-result-count">{visibleRequests.length} <small>از</small> {requests.length} پرونده</span>}
        </div>

        {!loading && requests.length > 0 && (
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
                  onClick={() => setActiveFilter(filter.id)}
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
        ) : requests.length === 0 ? (
          <EmptyState onCreate={openNewRequest} />
        ) : visibleRequests.length === 0 ? (
          <div className="ud-no-results">
            <span className="ud-no-results-icon">⌕</span>
            <h3>پرونده‌ای با این مشخصات پیدا نشد</h3>
            <p>عبارت جست‌وجو یا فیلتر انتخاب‌شده را تغییر دهید.</p>
            <button type="button" className="outline-button" onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}>نمایش همه پرونده‌ها</button>
          </div>
        ) : (
          <div className="request-grid ud-request-grid">
            {visibleRequests.map((request) => (
              <RequestCard key={String(request.id)} request={request} onOpen={onOpenRequest} />
            ))}
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
            {types.map((item) => (
              <button
                key={item.code}
                className={"request-type " + (selectedType === item.code ? "selected" : "")}
                onClick={() => setSelectedType(item.code)}
              >
                <div className="type-icon">{item.code === "SCREENING" ? "S" : "E"}</div>
                <div><strong>{item.title}</strong><span>{item.workflow_key === "screening" ? "فرآیند کامل گزینش" : "فرآیند استخدام"}</span></div>
                <span className="type-arrow">←</span>
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button className="ghost-button" onClick={() => setSelectedType(null)}>انصراف</button>
            <button className="primary-button" disabled={creating} onClick={createRequest}>{creating ? "در حال ایجاد…" : "ایجاد پرونده و شروع"}</button>
          </div>
        </Modal>
      )}
    </main>
  );
}

export default Dashboard;
