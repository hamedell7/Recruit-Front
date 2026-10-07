import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { normalizeList } from "../../utils/collections";
import { getFieldError } from "../../utils/validation";
import { SelectField } from "./Fields";

function GeoFields({
  record,
  setRecord,
  countries,
  readOnly,
  prefix = "",
  errors,
  errorPrefix = "",
  clearValidationError,
  caption = "موقعیت جغرافیایی",
  hint = "کشور، استان و شهر را انتخاب کنید."
) {
  const countryKey = prefix + "country_id";
  const provinceKey = prefix + "province_id";
  const cityKey = prefix + "city_id";
  const countryId = record?.[countryKey] || "";
  const provinceId = record?.[provinceKey] || "";
  const pathFor = (key) => (errorPrefix ? `${errorPrefix}.${key}` : key);

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (!countryId) {
      setProvinces([]);
      return undefined;
    }

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
    if (!provinceId) {
      setCities([]);
      return undefined;
    }

    let cancelled = false;
    api.citiesByProvince(provinceId)
      .then((items) => {
        if (!cancelled) setCities(normalizeList(items));
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });

    return () => { cancelled = true; };
  }, [provinceId]);

  const setValue = (key, value) => {
    const next = { ...record, [key]: value };
    clearValidationError?.(pathFor(key));

    if (key === countryKey) {
      next[provinceKey] = "";
      next[cityKey] = "";
    } else if (key === provinceKey) {
      next[cityKey] = "";
    }

    setRecord(next);
  };

  return (
    <div className="geo-block field full">
      <div className="geo-caption">
        <strong>{caption}</strong>
        <span>{hint}</span>
      </div>

      <div className="field-grid geo-grid">
        <SelectField
          label="کشور"
          value={record?.[countryKey] || ""}
          onChange={(value) => setValue(countryKey, value)}
          error={getFieldError(errors, pathFor(countryKey))}
          options={countries.map((item) => ({ value: item.id, label: item.name }))}
          readOnly={readOnly}
        />
        <SelectField
          label="استان"
          value={record?.[provinceKey] || ""}
          onChange={(value) => setValue(provinceKey, value)}
          error={getFieldError(errors, pathFor(provinceKey))}
          options={provinces.map((item) => ({ value: item.id, label: item.name }))}
          readOnly={readOnly || !countryId}
        />
        <SelectField
          label="شهر"
          value={record?.[cityKey] || ""}
          onChange={(value) => setValue(cityKey, value)}
          error={getFieldError(errors, pathFor(cityKey))}
          options={cities.map((item) => ({ value: item.id, label: item.name }))}
          readOnly={readOnly || !provinceId}
        />
      </div>
    </div>
  );
}

export default GeoFields;
