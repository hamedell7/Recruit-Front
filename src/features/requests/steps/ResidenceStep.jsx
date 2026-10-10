import { normalizeList } from "../../../utils/collections";
import ListEditor from "../../../components/form/ListEditor";
import AddressFields from "./AddressFields";

function ResidenceStep({ form, setForm, countries, readOnly, errors, clearValidationError }) {
  const addresses = normalizeList(form?.addresses);
  return (
    <ListEditor title="نشانی‌های محل سکونت" hint="از ده سال پیش تا امروز، به ترتیب زمانی، نشانی‌ها را ثبت کنید."
      items={addresses} setItems={(items) => setForm({ addresses: items })} clearValidationError={clearValidationError} errorPrefix="addresses"
      empty={() => ({ address_type: "RESIDENCE", country_id: countries[0]?.id || "", province_id: "", city_id: "", postal_code: "", address_line: "", phone: "", from_date: "", to_date: "", move_reason: "" })}
      readOnly={readOnly}
      render={(item, setItem, index) => <AddressFields item={item} setItem={setItem} countries={countries} readOnly={readOnly} residence errors={errors} errorPrefix={`addresses.${index}`} clearValidationError={clearValidationError} />}
    />
  );
}

export default ResidenceStep;
