import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { normalizeList } from "../../../utils/collections";
import { getFieldError } from "../../../utils/validation";
import TextField, { SelectField } from "../../../components/form/Fields";
import FormSection from "../../../components/form/FormSection";

const STATUS_OPTIONS = [
  { value: "completed_service", label: "پایان خدمت" },
  { value: "exempt", label: "معاف" },
  { value: "subject", label: "مشمول" },
];

const EXEMPTION_OPTIONS = [
  { value: "medical", label: "پزشکی" },
  { value: "education", label: "تحصیلی" },
  { value: "guardianship", label: "کفالت" },
  { value: "veteran", label: "ایثارگری" },
  { value: "age", label: "سنی" },
  { value: "other", label: "سایر" },
];

const BOOKLET_OPTIONS = [
  { value: "has_booklet", label: "دارد" },
  { value: "no_booklet", label: "ندارد" },
];

const ABSENCE_OPTIONS = [
  { value: "has_absence", label: "دارد" },
  { value: "no_absence", label: "ندارد" },
];

function ChoiceGroup({ label, value, onChange, options, error, readOnly, required = false }) {
  return (
    <div className={"choice-field" + (error ? " has-error" : "")} role="group" aria-label={label}>
      <div className="choice-label">{label}{required && <em>*</em>}</div>
      <div className="choice-grid" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label className={"choice-card" + (selected ? " selected" : "")} key={option.value}>
              <input
                type="radio"
                name={label}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                disabled={readOnly}
              />
              <span className="choice-dot" aria-hidden="true" />
              <span className="choice-copy">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && <div className="choice-error">{error}</div>}
    </div>
  );
}

function MilitaryStep({ form, setForm, countries, readOnly, errors, clearValidationError, data }) {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);

  const status = form?.status || "";
  const serviceProvinceId = form?.service_province_id || data?.record?.service_province_id || "";
  const countryId = countries[0]?.id || "";

  useEffect(() => {
    if (!countryId) return undefined;
    let cancelled = false;
    api.provinces(countryId)
      .then((items) => {
        if (!cancelled) setProvinces(normalizeList(items));
      })
      .catch(() => {
        if (!cancelled) setProvinces([]);
      });
    return () => { cancelled = true; };
  }, [countryId]);

  useEffect(() => {
    if (!serviceProvinceId) {
      setCities([]);
      return undefined;
    }
    let cancelled = false;
    api.citiesByProvince(serviceProvinceId)
      .then((items) => {
        if (!cancelled) setCities(normalizeList(items));
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });
    return () => { cancelled = true; };
  }, [serviceProvinceId]);

  const update = (key, value) => {
    clearValidationError(key);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateStatus = (value) => {
    clearValidationError("status");

    const next = {
      status: value,
      organization_name: "",
      unit_name: "",
      start_date: "",
      end_date: "",
      service_city_id: "",
      service_province_id: "",
      exemption_type: "",
      booklet_status: "",
      absence_status: "",
      conscription_date: "",
    };

    if (value === "completed_service") {
      next.organization_name = form?.organization_name || "";
      next.unit_name = form?.unit_name || "";
      next.start_date = form?.start_date || "";
      next.end_date = form?.end_date || "";
      next.service_city_id = form?.service_city_id || "";
      next.service_province_id = serviceProvinceId || "";
    }

    if (value === "exempt") {
      next.exemption_type = form?.exemption_type || "";
    }

    if (value === "subject") {
      next.booklet_status = form?.booklet_status || "";
      next.absence_status = form?.absence_status || "";
      next.conscription_date = form?.conscription_date || "";
      if (next.booklet_status !== "has_booklet") next.conscription_date = "";
    }

    setForm(next);
  };

  const updateBookletStatus = (value) => {
    update("booklet_status", value);
    if (value !== "has_booklet") {
      clearValidationError("conscription_date");
      setForm((current) => ({ ...current, booklet_status: value, conscription_date: "" }));
    }
  };

  const updateProvince = (value) => {
    clearValidationError("service_city_id");
    setForm((current) => ({
      ...current,
      service_province_id: value,
      service_city_id: "",
    }));
  };

  return (
    <div className="form-stack">
      <FormSection
        title="وضعیت نظام وظیفه"
        hint="ابتدا فقط وضعیت اصلی خود را انتخاب کنید؛ اطلاعات مربوط به همان وضعیت نمایش داده می‌شود."
      >
        <ChoiceGroup
          label="وضعیت نظام‌وظیفه"
          value={status}
          onChange={updateStatus}
          options={STATUS_OPTIONS}
          error={getFieldError(errors, "status")}
          readOnly={readOnly}
          required
        />
      </FormSection>

      {status === "completed_service" && (
        <FormSection title="اطلاعات پایان خدمت" hint="اطلاعات دوره خدمت را مطابق کارت پایان خدمت ثبت کنید.">
          <div className="field-grid">
            <TextField label="سازمان خدمتی" value={form.organization_name} onChange={(v) => update("organization_name", v)} error={getFieldError(errors, "organization_name")} required readOnly={readOnly} />
            <TextField label="یگان خدمتی" value={form.unit_name} onChange={(v) => update("unit_name", v)} error={getFieldError(errors, "unit_name")} required readOnly={readOnly} />
            <TextField label="تاریخ شروع خدمت" type="date" value={form.start_date} onChange={(v) => update("start_date", v)} error={getFieldError(errors, "start_date")} required readOnly={readOnly} />
            <TextField label="تاریخ پایان خدمت" type="date" value={form.end_date} onChange={(v) => update("end_date", v)} error={getFieldError(errors, "end_date")} required readOnly={readOnly} />
            <SelectField
              label="استان محل خدمت"
              value={serviceProvinceId}
              onChange={updateProvince}
              options={provinces.map((item) => ({ value: item.id, label: item.name }))}
              readOnly={readOnly}
            />
            <SelectField
              label="شهر محل خدمت"
              value={form.service_city_id}
              onChange={(v) => update("service_city_id", v)}
              options={cities.map((item) => ({ value: item.id, label: item.name }))}
              error={getFieldError(errors, "service_city_id")}
              required
              readOnly={readOnly}
            />
          </div>
          <div className="inline-info">
            <strong>فقط اطلاعات پایان خدمت در این وضعیت ثبت می‌شود.</strong>
            <span>دفترچه، غیبت و نوع معافیت در این انتخاب کاربردی ندارند و ارسال نمی‌شوند.</span>
          </div>
        </FormSection>
      )}

      {status === "exempt" && (
        <FormSection title="اطلاعات معافیت" hint="نوع معافیت را از بین گزینه‌های موجود انتخاب کنید.">
          <div className="field-grid">
            <SelectField
              label="نوع معافیت"
              value={form.exemption_type}
              onChange={(v) => update("exemption_type", v)}
              options={EXEMPTION_OPTIONS}
              error={getFieldError(errors, "exemption_type")}
              required
              readOnly={readOnly}
            />
          </div>
          {form.exemption_type === "medical" && (
            <div className="inline-info">
              <strong>معافیت پزشکی</strong>
              <span>در این مرحله فعلاً فقط نوع معافیت ثبت می‌شود؛ فیلد اختصاصی پزشکی در صورت نیاز به همین وضعیت اضافه خواهد شد.</span>
            </div>
          )}
        </FormSection>
      )}

      {status === "subject" && (
        <FormSection title="وضعیت مشمولیت" hint="دفترچه و غیبت دو مفهوم مستقل هستند و هرکدام جداگانه ثبت می‌شوند.">
          <div className="form-stack">
            <ChoiceGroup
              label="دفترچه اعزام"
              value={form.booklet_status}
              onChange={updateBookletStatus}
              options={BOOKLET_OPTIONS}
              error={getFieldError(errors, "booklet_status")}
              readOnly={readOnly}
              required
            />
            <ChoiceGroup
              label="غیبت"
              value={form.absence_status}
              onChange={(v) => update("absence_status", v)}
              options={ABSENCE_OPTIONS}
              error={getFieldError(errors, "absence_status")}
              readOnly={readOnly}
              required
            />
            {form.booklet_status === "has_booklet" && (
              <TextField
                label="تاریخ اعزام"
                type="date"
                value={form.conscription_date}
                onChange={(v) => update("conscription_date", v)}
                error={getFieldError(errors, "conscription_date")}
                readOnly={readOnly}
              />
            )}
          </div>
        </FormSection>
      )}

      {!status && (
        <div className="inline-info">
          <strong>ابتدا وضعیت نظام‌وظیفه را انتخاب کنید.</strong>
          <span>بعد از انتخاب، فقط اطلاعات مرتبط با همان وضعیت نمایش داده خواهد شد.</span>
        </div>
      )}
    </div>
  );
}

export default MilitaryStep;
