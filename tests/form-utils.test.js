import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanMilitaryPayload,
  cleanPayload,
  cleanStepPayload,
  mergeDraft,
  normalizeDigits,
  sanitizeMarriageForm,
  sanitizeMilitaryForm,
  validateStep,
} from "../src/utils/form.js";


test("normalizeDigits accepts Persian and Arabic-Indic digits", () => {
  assert.equal(normalizeDigits("کد ۱۲۳۴۵۶۷۸۹۰ / ٠٩٨٧"), "کد 1234567890 / 0987");
});


test("cleanPayload normalizes empty values and converts Jalali date fields recursively", () => {
  const cleaned = cleanPayload({
    name: "",
    count: 0,
    birth_date: "1402/01/02",
    history: [{ start_date: "1401/12/29" }],
  });

  assert.deepEqual(cleaned, {
    name: null,
    count: 0,
    birth_date: "2023-03-22",
    history: [{ start_date: "2023-03-20" }],
  });
});


test("sanitizeMilitaryForm removes fields irrelevant to an exempt applicant", () => {
  const original = {
    status: "exempt",
    organization_name: "Army",
    unit_name: "Unit 12",
    start_date: "1400/01/01",
    end_date: "1401/01/01",
    service_city_id: 12,
    service_province_id: 3,
    exemption_type: "medical",
    booklet_status: "has_booklet",
    absence_status: "absent",
    conscription_date: "1400/02/01",
  };

  const sanitized = sanitizeMilitaryForm(original);

  assert.equal(sanitized.status, "exempt");
  assert.equal(sanitized.exemption_type, "medical");
  for (const key of [
    "organization_name",
    "unit_name",
    "start_date",
    "end_date",
    "service_city_id",
    "service_province_id",
    "booklet_status",
    "absence_status",
    "conscription_date",
  ]) {
    assert.equal(sanitized[key], "");
  }
  assert.equal(original.organization_name, "Army", "sanitization must not mutate the original form");
});


test("cleanMilitaryPayload omits service_province_id and nulls cleared fields", () => {
  const cleaned = cleanMilitaryPayload({
    status: "exempt",
    organization_name: "Army",
    exemption_type: "medical",
    service_province_id: 3,
  });

  assert.equal(cleaned.status, "exempt");
  assert.equal(cleaned.organization_name, null);
  assert.equal(cleaned.exemption_type, "medical");
  assert.equal(Object.hasOwn(cleaned, "service_province_id"), false);
});


test("sanitizeMarriageForm clears end fields for a current marriage without mutating input", () => {
  const original = {
    marriages: [{
      status: "current",
      end_date: "1402/01/01",
      end_reason: "other",
      spouse: { first_name: "نمونه" },
    }],
  };

  const sanitized = sanitizeMarriageForm(original);

  assert.equal(sanitized.marriages[0].end_date, "");
  assert.equal(sanitized.marriages[0].end_reason, "");
  assert.equal(original.marriages[0].end_date, "1402/01/01");
});


test("mergeDraft removes server-owned family fields and normalizes family addresses", () => {
  const merged = mergeDraft(
    { people: [] },
    {
      people: [{
        first_name: "نمونه",
        national_id: "0013760025",
        gender: "مرد",
        father_name: "نام پدر",
        relation_to_applicant: "FATHER",
        contacts: [{ value: "sensitive" }],
        addresses: [{
          address_type: "FAMILY",
          country_id: 1,
          postal_code: "123",
          from_date: "2020-01-01",
          to_date: "2021-01-01",
          address_line: "نشانی",
        }],
      }],
    },
    "family",
  );

  const person = merged.people[0];
  assert.equal(person.first_name, "نمونه");
  assert.equal(Object.hasOwn(person, "national_id"), false);
  assert.equal(Object.hasOwn(person, "gender"), false);
  assert.equal(Object.hasOwn(person, "father_name"), false);
  assert.equal(Object.hasOwn(person, "relation_to_applicant"), false);
  assert.equal(Object.hasOwn(person, "contacts"), false);
  assert.deepEqual(person.addresses, [{
    address_type: "CURRENT",
    address_line: "نشانی",
  }]);
});


test("validateStep accepts complete personal fields and rejects invalid contact details", () => {
  const validForm = {
    first_name: "علی",
    last_name: "نمونه",
    national_id: "0013760025",
    current_address: {
      address_line: "خیابان نمونه",
      country_id: 1,
      province_id: 2,
      city_id: 3,
    },
  };
  assert.deepEqual(validateStep("personal", validForm), {});

  const errors = validateStep("personal", {
    ...validForm,
    contacts: [{
      contact_type: "موبایل",
      value: "123",
      owner_type: "OPERATOR",
      owner_name: "",
    }],
  });
  assert.equal(Object.hasOwn(errors, "contacts.0.value"), true);
  assert.equal(Object.hasOwn(errors, "contacts.0.owner_name"), true);
});

test("cleanStepPayload dispatches each specialized form through its canonical sanitizer", () => {
  const military = cleanStepPayload("military_v1", {
    status: "exempt",
    exemption_type: "medical",
    organization_name: "not applicable",
    service_province_id: 8,
  });
  assert.equal(military.status, "exempt");
  assert.equal(military.exemption_type, "medical");
  assert.equal(military.organization_name, null);
  assert.equal(Object.hasOwn(military, "service_province_id"), false);

  const marriage = cleanStepPayload("marriage_v1", {
    marriages: [{
      status: "current",
      end_date: "1402/01/01",
      end_reason: "other",
      spouse: { first_name: "نمونه" },
    }],
  });
  assert.equal(marriage.marriages[0].end_date, null);
  assert.equal(marriage.marriages[0].end_reason, null);

  const legal = cleanStepPayload("legal_incidents_v1", {
    records: [{ person_role: "SELF", incident_date: "1402/01/02", description: "" }],
  });
  assert.equal(Object.hasOwn(legal.records[0], "person_role"), false);
  assert.equal(legal.records[0].incident_date, "2023-03-22");
  assert.equal(legal.records[0].description, null);

  assert.deepEqual(cleanStepPayload("generic_v1", { description: "", count: 0 }), {
    description: null,
    count: 0,
  });
});
