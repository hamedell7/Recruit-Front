import assert from "node:assert/strict";
import test from "node:test";

import { buildFetchOptions } from "../src/services/api/requestOptions.js";

test("builds consistent GET options without reading a CSRF token", () => {
  let tokenReads = 0;
  const options = buildFetchOptions(
    { headers: { "X-Trace": "trace-value" }, signal: "abort-signal" },
    {
      accept: "application/json",
      requestId: "req-get",
      getCsrfToken: () => {
        tokenReads += 1;
        return "csrf";
      },
    },
  );

  assert.equal(options.method, "GET");
  assert.equal(options.credentials, "include");
  assert.equal(options.headers.Accept, "application/json");
  assert.equal(options.headers["X-Request-ID"], "req-get");
  assert.equal(options.headers["X-Trace"], "trace-value");
  assert.equal(options.signal, "abort-signal");
  assert.equal(options.headers["X-CSRF-Token"], undefined);
  assert.equal(tokenReads, 0);
});

test("serializes JSON and attaches CSRF to state-changing requests", () => {
  const options = buildFetchOptions(
    { method: "post", body: { name: "Recruit" }, headers: { "X-Trace": "custom" } },
    {
      accept: "application/json",
      requestId: "req-post",
      getCsrfToken: () => "csrf-token",
    },
  );

  assert.equal(options.method, "POST");
  assert.equal(options.credentials, "include");
  assert.equal(options.headers["Content-Type"], "application/json");
  assert.equal(options.headers["X-CSRF-Token"], "csrf-token");
  assert.equal(options.headers["X-Trace"], "custom");
  assert.equal(options.body, JSON.stringify({ name: "Recruit" }));
});

test("preserves multipart bodies without setting a JSON content type", () => {
  const body = new FormData();
  body.append("name", "Recruit");

  const options = buildFetchOptions(
    { method: "POST", body },
    { accept: "application/json", requestId: "req-form", getCsrfToken: () => null },
  );

  assert.equal(options.body, body);
  assert.equal(options.headers["Content-Type"], undefined);
  assert.equal(options.headers["X-CSRF-Token"], undefined);
});

test("allows downloads to supply their own Accept header while sharing request policy", () => {
  const accept = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json";
  const options = buildFetchOptions(
    { method: "POST", body: { ids: ["one"] } },
    { accept, requestId: "req-download", getCsrfToken: () => "csrf-token" },
  );

  assert.equal(options.headers.Accept, accept);
  assert.equal(options.headers["X-Request-ID"], "req-download");
  assert.equal(options.headers["X-CSRF-Token"], "csrf-token");
  assert.equal(options.credentials, "include");
});
