import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { normalizeList } from "../../utils/collections";
import Modal from "../../components/common/Modal";
import StatCard from "./cards/StatCard";
import RequestCard from "./cards/RequestCard";
import EmptyState from "./cards/EmptyState";
import SkeletonCard from "./cards/SkeletonCard";

function Dashboard({ user, onOpenRequest, onCreated, onError }) {
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

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
      setCreating(false);
      setSelectedType(null);
      onCreated(request);
    } catch (error) {
      setCreating(false);
      onError({ type: "error", text: error.message, requestId: error.requestId });
    }
  };

  const inProgress = requests.filter((item) => ["IN_PROGRESS", "RETURNED"].includes(item.status));
  const finished = requests.filter((item) => !["IN_PROGRESS", "RETURNED"].includes(item.status));

  return (
    <main className="page dashboard-page">
      <section className="hero-row">
        <div>
          <span className="eyebrow">داشبورد شخصی</span>
          <h1>سلام، پرونده‌تان از اینجا ادامه پیدا می‌کند.</h1>
          <p>هر درخواست را از همان مرحله‌ای که متوقف شده بود ادامه دهید.</p>
        </div>
        <button className="primary-button" onClick={() => setSelectedType(types[0] || null)}>
          <span className="plus">+</span> ثبت درخواست جدید
        </button>
      </section>

      <section className="stats-grid">
        <StatCard label="کل درخواست‌ها" value={requests.length} icon="↗" />
        <StatCard label="در حال تکمیل" value={inProgress.length} icon="◷" />
        <StatCard label="ثبت نهایی شده" value={finished.length} icon="✓" />
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div><span className="eyebrow">درخواست‌های شما</span><h2>پرونده‌ها</h2></div>
          <span className="section-count">{requests.length} مورد</span>
        </div>
        {loading ? (
          <div className="skeleton-list"><SkeletonCard /><SkeletonCard /></div>
        ) : requests.length === 0 ? (
          <EmptyState onCreate={() => setSelectedType(types[0] || null)} />
        ) : (
          <div className="request-grid">
            {requests.map((request) => (
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
