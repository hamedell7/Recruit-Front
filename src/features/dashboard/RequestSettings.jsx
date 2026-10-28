import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import PersianDateFilter from "../../components/form/PersianDateFilter";
import { normalizeList } from "../../utils/collections";
import AdminBreadcrumb from "../../components/layout/AdminBreadcrumb";
import "../../styles/request-settings.css";

function formFromRequestType(requestType) {
  return {
    is_active: requestType?.is_active !== false,
    registration_start_date: requestType?.registration_start_date || "",
    registration_end_date: requestType?.registration_end_date || "",
    edit_until_date: requestType?.edit_until_date || "",
    max_requests_per_user: requestType?.max_requests_per_user ?? "",
  };
}

function RequestSettings({ onError }) {
  const [requestTypes, setRequestTypes] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [form, setForm] = useState(() => formFromRequestType(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const selectedType = useMemo(
    () => requestTypes.find((item) => item.code === selectedCode) || null,
    [requestTypes, selectedCode],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.staffRequestTypes()
      .then((result) => {
        if (cancelled) return;
        const items = normalizeList(result);
        setRequestTypes(items);
        setSelectedCode((current) => items.some((item) => item.code === current)
          ? current
          : (items[0]?.code || ""));
        setLoadError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error.message || "دریافت فهرست انواع درخواست انجام نشد.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selectedType) setForm(formFromRequestType(selectedType));
  }, [selectedType?.code]);

  const change = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!selectedType || saving) return;

    if (
      form.registration_start_date
      && form.registration_end_date
      && form.registration_end_date < form.registration_start_date
    ) {
      onError?.({ type: "error", text: "تاریخ پایان ثبت درخواست نمی‌تواند قبل از تاریخ شروع باشد." });
      return;
    }

    const limit = form.max_requests_per_user === "" ? null : Number(form.max_requests_per_user);
    if (limit !== null && (!Number.isInteger(limit) || limit < 1 || limit > 1000)) {
      onError?.({ type: "error", text: "سقف تعداد درخواست باید عددی بین ۱ تا ۱۰۰۰ باشد یا خالی بماند." });
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateRequestTypeSettings(selectedType.code, {
        is_active: Boolean(form.is_active),
        registration_start_date: form.registration_start_date || null,
        registration_end_date: form.registration_end_date || null,
        edit_until_date: form.edit_until_date || null,
        max_requests_per_user: limit,
      });
      setRequestTypes((current) => current.map((item) => (
        item.code === updated.code ? updated : item
      )));
      setForm(formFromRequestType(updated));
      onError?.({ type: "success", text: "تنظیمات «" + updated.title + "» با موفقیت ذخیره شد." });
    } catch (error) {
      onError?.({ type: "error", text: error.message || "ذخیره تنظیمات انجام نشد.", requestId: error.requestId });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    if (selectedType) setForm(formFromRequestType(selectedType));
  };

  return (
    <main className="page staff-dashboard-page request-settings-page" dir="rtl">
      <AdminBreadcrumb items={[{ label: "پنل مدیریت", href: "/staff/requests" }, { label: "تنظیمات درخواست‌ها" }]} />
      <section className="request-settings-hero">
        <div>
          <span className="eyebrow"><span className="request-settings-eyebrow-dot" /> تنظیمات سامانه</span>
          <h1>تنظیمات درخواست‌ها</h1>
          <p>برای هر نوع درخواست، بازه ثبت، مهلت ویرایش و سقف تعداد درخواست هر متقاضی را جداگانه تعیین کنید.</p>
        </div>
        <div className="request-settings-hero-icon" aria-hidden="true">⚙</div>
      </section>

      {loadError && <div className="request-settings-error" role="alert">{loadError}</div>}

      <div className="request-settings-layout">
        <aside className="request-settings-type-panel">
          <div className="request-settings-sidebar-brand">
            <span className="request-settings-sidebar-brand-icon" aria-hidden="true">اگ</span>
            <span className="request-settings-sidebar-brand-copy">
              <small>سامانه مدیریت پرونده‌ها</small>
              <strong>استخدام و گزینش</strong>
            </span>
            <span className="request-settings-sidebar-brand-status" aria-hidden="true">✓</span>
          </div>
          <div className="request-settings-panel-heading">
            <span className="eyebrow">پیکربندی</span>
            <h2>انواع درخواست</h2>
            <p>نوع درخواست موردنظر را انتخاب کنید.</p>
          </div>
          {loading ? (
            <div className="request-settings-loading"><span /> در حال دریافت انواع درخواست…</div>
          ) : requestTypes.length === 0 ? (
            <div className="request-settings-empty">نوع درخواستی برای تنظیم پیدا نشد.</div>
          ) : (
            <div className="request-settings-type-list">
              {requestTypes.map((item, index) => {
                const isSelected = selectedCode === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    className={"request-settings-type-option" + (isSelected ? " is-selected" : "")}
                    onClick={() => setSelectedCode(item.code)}
                    aria-pressed={isSelected}
                  >
                    <span className="request-settings-type-icon" aria-hidden="true">
                      {isSelected ? "✓" : new Intl.NumberFormat("fa-IR").format(index + 1)}
                    </span>
                    <span className="request-settings-type-copy">
                      <small>{isSelected ? "تنظیمات انتخاب‌شده" : "نوع درخواست"}</small>
                      <strong>{item.title}</strong>
                    </span>
                    <span className={"request-settings-status-dot" + (item.is_active ? " is-active" : "")} title={item.is_active ? "فعال" : "غیرفعال"} />
                  </button>
                );
              })}
            </div>
          )}
          <div className="request-settings-side-note">
            <span className="request-settings-side-note-icon" aria-hidden="true">✓</span>
            <div>
              <strong>تنظیمات مستقل</strong>
              <p>تنظیمات هر نوع درخواست جداگانه ذخیره می‌شود.</p>
            </div>
          </div>
        </aside>

        <section className="request-settings-editor">
          {!selectedType ? (
            <div className="request-settings-editor-empty">
              <span aria-hidden="true">⚙</span>
              <h2>نوع درخواست را انتخاب کنید</h2>
              <p>پس از انتخاب یک مورد، تنظیمات آن در این بخش نمایش داده می‌شود.</p>
            </div>
          ) : (
            <>
              <div className="request-settings-editor-heading">
                <div>
                  <span className="eyebrow">تنظیمات اختصاصی نوع درخواست</span>
                  <h2>{selectedType.title}</h2>
                </div>
                <span className={"request-settings-state-pill" + (form.is_active ? " is-active" : " is-inactive")}>
                  {form.is_active ? "فعال برای ثبت" : "غیرفعال"}
                </span>
              </div>

              <form onSubmit={save}>
                <label className="request-settings-activation">
                  <span className="request-settings-toggle-track">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) => change("is_active", event.target.checked)}
                    />
                    <i />
                  </span>
                  <span>
                    <strong>امکان ثبت درخواست جدید فعال باشد</strong>
                    <small>با غیرفعال کردن، ثبت درخواست جدید و ویرایش تمام پرونده‌های این نوع متوقف می‌شود؛ پرونده‌های قبلی حذف نمی‌شوند و فقط قابل مشاهده خواهند بود.</small>
                  </span>
                </label>

                <div className="request-settings-section-title">
                  <span className="request-settings-section-number">۱</span>
                  <div><h3>بازه زمانی ثبت درخواست</h3><p>تاریخ‌ها شامل تمام روز انتخاب‌شده هستند؛ خالی گذاشتن یعنی بدون محدودیت از آن سمت.</p></div>
                </div>
                <div className="request-settings-date-grid">
                  <PersianDateFilter
                    label="تاریخ شروع ثبت"
                    value={form.registration_start_date}
                    maxDate={form.registration_end_date}
                    onChange={(value) => change("registration_start_date", value)}
                  />
                  <PersianDateFilter
                    label="تاریخ پایان ثبت"
                    value={form.registration_end_date}
                    minDate={form.registration_start_date}
                    onChange={(value) => change("registration_end_date", value)}
                  />
                </div>

                <div className="request-settings-section-title request-settings-section-spaced">
                  <span className="request-settings-section-number">۲</span>
                  <div><h3>مهلت ویرایش</h3><p>تا پایان این تاریخ، ویرایش پرونده‌های در حال تکمیل یا برگشت‌داده‌شده مجاز خواهد بود.</p></div>
                </div>
                <div className="request-settings-date-grid request-settings-single-date">
                  <PersianDateFilter
                    label="آخرین روز مجاز برای ویرایش"
                    value={form.edit_until_date}
                    onChange={(value) => change("edit_until_date", value)}
                  />
                </div>

                <div className="request-settings-section-title request-settings-section-spaced">
                  <span className="request-settings-section-number">۳</span>
                  <div><h3>سقف درخواست هر متقاضی</h3><p>تعداد کل پرونده‌هایی که هر کاربر می‌تواند از این نوع ثبت کند.</p></div>
                </div>
                <div className="request-settings-quota-field">
                  <label htmlFor="request-user-quota">حداکثر تعداد درخواست برای هر کاربر</label>
                  <div className="request-settings-quota-control">
                    <input
                      id="request-user-quota"
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      inputMode="numeric"
                      value={form.max_requests_per_user}
                      onChange={(event) => change("max_requests_per_user", event.target.value)}
                      placeholder="مثلاً ۱"
                    />
                    <span>درخواست</span>
                  </div>
                  <small>خالی گذاشتن این فیلد یعنی تعداد نامحدود. پرونده‌های قبلی کاربر هم در محاسبه سقف لحاظ می‌شوند.</small>
                </div>

                <div className="request-settings-actions">
                  <button className="ghost-button" type="button" onClick={resetForm} disabled={saving}>بازگردانی تغییرات</button>
                  <button className="primary-button request-settings-save" type="submit" disabled={saving}>
                    {saving ? "در حال ذخیره تنظیمات…" : "ذخیره تنظیمات"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default RequestSettings;
