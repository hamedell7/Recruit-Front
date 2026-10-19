import assert from "node:assert/strict";
import test from "node:test";

import { createApiError, normalizeValidationErrors } from "../src/services/api/errors.js";

function fakeResponse(status, headers = {}) {
  return {
    status,
    headers: new Headers(headers),
  };
}

test("normalizes nested Pydantic validation paths and messages", () => {
  assert.deepEqual(
    normalizeValidationErrors({
      detail: [{
        loc: ["body", "profile", "email"],
        msg: "Field required",
        type: "missing",
      }],
    }),
    [{
      path: "profile.email",
      message: "تکمیل این فیلد الزامی است.",
      type: "missing",
    }],
  );
});

test("maps invalid credentials to the user-facing Persian message and keeps request metadata", () => {
  const payload = { code: "INVALID_CREDENTIALS", message: "Invalid credentials", request_id: "body-id" };
  const error = createApiError(
    fakeResponse(401, { "X-Request-ID": "header-id" }),
    payload,
    "fallback",
  );

  assert.equal(error.status, 401);
  assert.equal(error.code, "INVALID_CREDENTIALS");
  assert.equal(error.message, "کد ملی یا شماره موبایل واردشده صحیح نیست.");
  assert.equal(error.requestId, "header-id");
  assert.equal(error.payload, payload);
  assert.deepEqual(error.validationErrors, []);
});

test("uses the payload request ID when the response header is absent", () => {
  const error = createApiError(
    fakeResponse(422),
    { request_id: "body-id", details: [{ loc: ["body", "age"], msg: "Input should be a valid integer", type: "int_parsing" }] },
    "fallback",
  );

  assert.equal(error.requestId, "body-id");
  assert.equal(error.status, 422);
  assert.deepEqual(error.validationErrors, [{
    path: "age",
    message: "مقدار این فیلد باید عدد صحیح باشد.",
    type: "int_parsing",
  }]);
  assert.equal(error.message, "مقدار این فیلد باید عدد صحیح باشد.");
});

test("maps rate limiting consistently for API calls and downloads", () => {
  const error = createApiError(
    fakeResponse(429),
    { code: "RATE_LIMITED", message: "Try later" },
    "download fallback",
  );

  assert.equal(error.status, 429);
  assert.equal(error.code, "RATE_LIMITED");
  assert.equal(error.message, "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید.");
});

test("uses the operation-specific fallback for plain-text errors", () => {
  const error = createApiError(fakeResponse(503), " ", "خطا در دریافت فایل");
  assert.equal(error.message, "خطا در دریافت فایل");
  assert.equal(error.status, 503);
});

test("prefers specific email and numeric messages over generic input validation", () => {
  const errors = normalizeValidationErrors({
    details: [
      {
        loc: ["body", "email"],
        msg: "Input should be a valid email address",
        type: "value_error",
      },
      {
        loc: ["body", "age"],
        msg: "Input should be a valid integer",
        type: "int_parsing",
      },
    ],
  });

  assert.deepEqual(errors, [
    {
      path: "email",
      message: "ایمیل واردشده معتبر نیست.",
      type: "value_error",
    },
    {
      path: "age",
      message: "مقدار این فیلد باید عدد صحیح باشد.",
      type: "int_parsing",
    },
  ]);
});
