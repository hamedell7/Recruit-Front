import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { normalizeList } from "../../utils/collections";
import { getFieldError } from "../../utils/validation";
import { SelectField } from "./Fields";

function GeoFields({ record, setRecord, countries, readOnly, prefix = "", errors, errorPrefix = "", clearValidationError }) {
  const has = (key) => Object.prototype.hasOwnProperty.call(record, key);
  const countryKey = prefix + "country_id";
  const provinceKey = prefix + "province_id";
  const countyKey = prefix + "county_id";
  const cityKey = prefix + "city_id";
  const villageKey = prefix + "village_id";
  const countryId = has(countryKey) ? record[countryKey] : (countries[0]?.id || "");
  const pathFor = (key) => errorPrefix ? `${errorPrefix}.${key}` : key;
  const [provinces, setProvinces] = useState([]);
  const [counties, setCounties] = useState([]);
  const [cities, setCities] = useState([]);
  const [villages, setVillages] = useState([]);

  useEffect(() => {
    if (!countryId || !has(provinceKey)) return undefined;
    let cancelled = false;
    api.provinces(countryId).then((items) => { if (!cancelled) setProvinces(normalizeList(items)); }).catch(() => setProvinces([]));
    return () => { cancelled = true; };
  }, [countryId, provinceKey]);

  useEffect(() => {
    const provinceId = record[provinceKey];
    if (!provinceId || !has(countyKey)) return undefined;
    let cancelled = false;
    api.counties(provinceId).then((items) => { if (!cancelled) setCounties(normalizeList(items)); }).catch(() => setCounties([]));
    return () => { cancelled = true; };
  }, [record[provinceKey], countyKey]);

  useEffect(() => {
    const provinceId = record[provinceKey];
    const countyId = record[countyKey];
    if ((!countyId && !provinceId) || !has(cityKey)) return undefined;
    let cancelled = false;
    const call = countyId ? api.cities(countyId) : api.citiesByProvince(provinceId);
    call.then((items) => { if (!cancelled) setCities(normalizeList(items)); }).catch(() => setCities([]));
    return () => { cancelled = true; };
  }, [record[provinceKey], record[countyKey], cityKey]);

  useEffect(() => {
    const countyId = record[countyKey];
    if (!countyId || !has(villageKey)) return undefined;
    let cancelled = false;
    api.villages(countyId).then((items) => { if (!cancelled) setVillages(normalizeList(items)); }).catch(() => setVillages([]));
    return () => { cancelled = true; };
  }, [record[countyKey], villageKey]);

  const setValue = (key, value) => {
    const next = { ...record, [key]: value };
    clearValidationError?.(pathFor(key));
    if (key === countryKey) {
      [provinceKey, countyKey, cityKey, villageKey].forEach((child) => { if (has(child)) next[child] = ""; });
    }
    if (key === provinceKey) {
      [countyKey, cityKey, villageKey].forEach((child) => { if (has(child)) next[child] = ""; });
    }
    if (key === countyKey) {
      [cityKey, villageKey].forEach((child) => { if (has(child)) next[child] = ""; });
    }
    setRecord(next);
  };

  return (
    <div className="geo-block field full">
      <div className="geo-caption"><strong>موقعیت جغرافیایی</strong><span>انتخاب‌ها به صورت وابسته از بالا به پایین هستند.</span></div>
      <div className="field-grid geo-grid">
        {has(countryKey) && <SelectField label="کشور" value={record[countryKey]} onChange={(v) => setValue(countryKey, v)} error={getFieldError(errors, pathFor(countryKey))} options={countries.map((x) => ({ value: x.id, label: x.name }))} readOnly={readOnly} />}
        {has(provinceKey) && <SelectField label="استان" value={record[provinceKey]} onChange={(v) => setValue(provinceKey, v)} error={getFieldError(errors, pathFor(provinceKey))} options={provinces.map((x) => ({ value: x.id, label: x.name }))} readOnly={readOnly} />}
        {has(countyKey) && <SelectField label="شهرستان" value={record[countyKey]} onChange={(v) => setValue(countyKey, v)} error={getFieldError(errors, pathFor(countyKey))} options={counties.map((x) => ({ value: x.id, label: x.name }))} readOnly={readOnly} />}
        {has(cityKey) && <SelectField label="شهر" value={record[cityKey]} onChange={(v) => setValue(cityKey, v)} error={getFieldError(errors, pathFor(cityKey))} options={cities.map((x) => ({ value: x.id, label: x.name }))} readOnly={readOnly} />}
        {has(villageKey) && <SelectField label="روستا" value={record[villageKey]} onChange={(v) => setValue(villageKey, v)} error={getFieldError(errors, pathFor(villageKey))} options={villages.map((x) => ({ value: x.id, label: x.name }))} readOnly={readOnly} />}
      </div>
    </div>
  );
}

export default GeoFields;
