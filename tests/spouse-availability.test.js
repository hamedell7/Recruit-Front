import test from "node:test";
import assert from "node:assert/strict";

import { withSpouseAvailability } from "../src/utils/spouseAvailability.js";

const OPTIONS = [
  { value: "APPLICANT", label: "خود متقاضی" },
  { value: "SPOUSE", label: "همسر" },
  { value: "SPOUSE_RELATIVE", label: "بستگان همسر" },
];

test("spouse and spouse-relative options require registered marriage details", () => {
  const result = withSpouseAvailability(OPTIONS, false);

  assert.equal(result[0], OPTIONS[0]);
  assert.equal(result[1].disabled, true);
  assert.equal(result[2].disabled, true);
  assert.match(result[1].label, /ابتدا در سوابق ازدواج ثبت شود/);
  assert.match(result[2].label, /ابتدا در سوابق ازدواج ثبت شود/);
});

test("spouse-dependent options are available after spouse details are registered", () => {
  const result = withSpouseAvailability(OPTIONS, true);

  assert.equal(result[1], OPTIONS[1]);
  assert.equal(result[2], OPTIONS[2]);
  assert.equal(result[1].disabled, undefined);
  assert.equal(result[2].disabled, undefined);
});
