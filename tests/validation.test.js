import test from "node:test";
import assert from "node:assert/strict";

import { formatErrorPath, getFieldError } from "../src/utils/validation.js";

test("formats nested marriage validation paths in Persian", () => {
  assert.equal(
    formatErrorPath("marriages.0.spouse.physical_status"),
    "ازدواج‌ها ← ردیف ۱ ← همسر ← وضعیت جسمانی",
  );
});

test("formats repeated field paths using Persian row numbers", () => {
  assert.equal(
    formatErrorPath("people.1.addresses.0.phone"),
    "افراد ← ردیف ۲ ← نشانی‌ها ← ردیف ۱ ← تلفن",
  );
});

test("formats social person name fields in Persian", () => {
  assert.equal(formatErrorPath("people.0.first_name"), "افراد ← ردیف ۱ ← نام");
  assert.equal(formatErrorPath("people.0.last_name"), "افراد ← ردیف ۱ ← نام خانوادگی");
});

test("formats social relations requirement paths entirely in Persian", () => {
  assert.equal(
    formatErrorPath("people.requirements.FRIEND"),
    "افراد ← حداقل تعداد ← دوستان دوران تحصیل و سربازی",
  );
  assert.equal(
    formatErrorPath("people.requirements.NEIGHBOR"),
    "افراد ← حداقل تعداد ← همسایگان و معتمدان محل",
  );
  assert.equal(
    formatErrorPath("people.requirements.RELATIVE"),
    "افراد ← حداقل تعداد ← بستگان",
  );
  assert.equal(
    formatErrorPath("people.requirements.FAMILY_FRIEND"),
    "افراد ← حداقل تعداد ← معاشرین و دوستان خانوادگی",
  );
});

test("falls back to a general form label for an empty path", () => {
  assert.equal(formatErrorPath(""), "اطلاعات فرم");
});

test("returns the exact validation message for a matching field", () => {
  assert.equal(getFieldError({ first_name: "نام الزامی است." }, "first_name"), "نام الزامی است.");
  assert.equal(getFieldError({}, "first_name"), null);
});


function socialPeople() {
  return [
    { role_type: "REFERENCE", first_name: "معرف", last_name: "اول" },
    { role_type: "FRIEND", first_name: "دوست", last_name: "اول" },
    { role_type: "FRIEND", first_name: "دوست", last_name: "دوم" },
    { role_type: "FRIEND", first_name: "دوست", last_name: "سوم" },
    { role_type: "NEIGHBOR", first_name: "همسایه", last_name: "اول" },
    { role_type: "NEIGHBOR", first_name: "همسایه", last_name: "دوم" },
    { role_type: "NEIGHBOR", first_name: "همسایه", last_name: "سوم" },
    { role_type: "NEIGHBOR", first_name: "همسایه", last_name: "چهارم" },
    { role_type: "RELATIVE", first_name: "بستگان", last_name: "اول" },
    { role_type: "RELATIVE", first_name: "بستگان", last_name: "دوم" },
    { role_type: "FAMILY_FRIEND", first_name: "دوست خانوادگی", last_name: "اول" },
    { role_type: "FAMILY_FRIEND", first_name: "دوست خانوادگی", last_name: "دوم" },
    { role_type: "FAMILY_FRIEND", first_name: "دوست خانوادگی", last_name: "سوم" },
  ];
}

test("requires the minimum number of people in each social relations group", async () => {
  const { validateStep } = await import("../src/utils/form.js");
  const people = socialPeople().filter((person) => person.role_type !== "NEIGHBOR");
  const errors = validateStep("social_relations", { people });

  assert.match(errors["people.requirements.NEIGHBOR"], /چهار نفر/);
  assert.equal(errors["people.requirements.REFERENCE"], undefined);
  assert.equal(errors["people.requirements.FRIEND"], undefined);
  assert.equal(errors["people.requirements.RELATIVE"], undefined);
  assert.equal(errors["people.requirements.FAMILY_FRIEND"], undefined);
});

test("allows completing social relations without any reference", async () => {
  const { validateStep } = await import("../src/utils/form.js");
  const people = socialPeople().filter((person) => person.role_type !== "REFERENCE");
  const errors = validateStep("social_relations", { people });

  assert.equal(errors["people.requirements.REFERENCE"], undefined);
  assert.equal(errors["people.requirements.FRIEND"], undefined);
  assert.equal(errors["people.requirements.NEIGHBOR"], undefined);
  assert.equal(errors["people.requirements.RELATIVE"], undefined);
  assert.equal(errors["people.requirements.FAMILY_FRIEND"], undefined);
});

test("rejects duplicate names across social relations groups", async () => {
  const { validateStep } = await import("../src/utils/form.js");
  const people = socialPeople();
  people[1].first_name = people[0].first_name;
  people[1].last_name = people[0].last_name;

  const errors = validateStep("social_relations", { people });
  assert.match(errors["people.1.first_name"], /ثبت تکراری نام/);
});

test("normalizes Arabic and Persian letters when detecting duplicate social names", async () => {
  const { validateStep } = await import("../src/utils/form.js");
  const people = socialPeople();
  people[0].first_name = "علي";
  people[0].last_name = "رضا";
  people[1].first_name = "علی";
  people[1].last_name = "رضا";

  const errors = validateStep("social_relations", { people });
  assert.match(errors["people.1.first_name"], /ثبت تکراری نام/);
});

test("accepts all five social relations groups when minimum counts are met", async () => {
  const { validateStep } = await import("../src/utils/form.js");
  const errors = validateStep("social_relations", { people: socialPeople() });

  assert.equal(errors["people.requirements.REFERENCE"], undefined);
  assert.equal(errors["people.requirements.FRIEND"], undefined);
  assert.equal(errors["people.requirements.NEIGHBOR"], undefined);
  assert.equal(errors["people.requirements.RELATIVE"], undefined);
  assert.equal(errors["people.requirements.FAMILY_FRIEND"], undefined);
});

test("validates each split social step independently", async () => {
  const { validateStep } = await import("../src/utils/form.js");
  const people = socialPeople();

  const referenceErrors = validateStep("social_references", { people: [] });
  assert.equal(referenceErrors["people.requirements.REFERENCE"], undefined);

  const friendErrors = validateStep("social_friends", {
    people: people.filter((person) => person.role_type === "FRIEND").slice(0, 2),
  });
  assert.match(friendErrors["people.requirements.FRIEND"], /سه نفر از دوستان/);
  assert.equal(friendErrors["people.requirements.NEIGHBOR"], undefined);
  assert.equal(friendErrors["people.requirements.RELATIVE"], undefined);
  assert.equal(friendErrors["people.requirements.FAMILY_FRIEND"], undefined);

  const neighborErrors = validateStep("social_neighbors", {
    people: people.filter((person) => person.role_type === "NEIGHBOR").slice(0, 3),
  });
  assert.match(neighborErrors["people.requirements.NEIGHBOR"], /چهار نفر از همسایگان/);
  assert.equal(neighborErrors["people.requirements.FRIEND"], undefined);

  const relativeErrors = validateStep("social_relatives", {
    people: people.filter((person) => person.role_type === "RELATIVE").slice(0, 1),
  });
  assert.match(relativeErrors["people.requirements.RELATIVE"], /دو نفر از بستگان/);

  const familyFriendErrors = validateStep("social_family_friends", {
    people: people.filter((person) => person.role_type === "FAMILY_FRIEND").slice(0, 2),
  });
  assert.match(familyFriendErrors["people.requirements.FAMILY_FRIEND"], /سه نفر از معاشرین/);
});

test("loads and merges only the selected social group while retaining legacy friend records", async () => {
  const { makeForm, mergeDraft } = await import("../src/utils/form.js");
  const people = [
    ...socialPeople(),
    { role_type: "MILITARY_RELATIVE", first_name: "دوست", last_name: "قدیمی", addresses: [] },
  ];

  const friendForm = makeForm("social_friends", { people });
  assert.deepEqual(
    friendForm.people.map((person) => person.role_type),
    ["FRIEND", "FRIEND", "FRIEND", "MILITARY_RELATIVE"],
  );

  const neighborDraft = mergeDraft({}, { people }, "social_neighbors");
  assert.equal(neighborDraft.people.length, 4);
  assert.ok(neighborDraft.people.every((person) => person.role_type === "NEIGHBOR"));

  const referenceForm = makeForm("social_references", { people });
  assert.equal(referenceForm.people.length, 1);
  assert.equal(referenceForm.people[0].role_type, "REFERENCE");
});

