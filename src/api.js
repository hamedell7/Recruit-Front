const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const item = cookies.find((cookie) => cookie.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function requestId() {
  return globalThis.crypto?.randomUUID?.() || "req-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const stateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const body = options.body;

  const headers = {
    Accept: "application/json",
    "X-Request-ID": requestId(),
    ...(options.headers || {}),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (stateChanging) {
    const csrf = getCookie("recruit_csrf");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  const response = await fetch(API_BASE_URL + path, {
    ...options,
    method,
    credentials: "include",
    body: body instanceof FormData || body === undefined ? body : JSON.stringify(body),
    headers,
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      typeof payload === "object" && payload?.message
        ? payload.message
        : "خطا در ارتباط با سامانه"
    );
    error.status = response.status;
    error.code = typeof payload === "object" ? payload?.code : undefined;
    error.requestId = response.headers.get("X-Request-ID") || payload?.request_id;
    throw error;
  }

  return payload;
}

const path = (value) => encodeURIComponent(value);

export const api = {
  me: () => apiFetch("/auth/me"),
  login: (nationalId, mobile) => apiFetch("/auth/login", {
    method: "POST",
    body: { national_id: nationalId, mobile },
  }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  requestTypes: () => apiFetch("/requests/types"),
  requests: () => apiFetch("/requests"),
  request: (id) => apiFetch("/requests/" + path(id)),
  createRequest: (requestType) => apiFetch("/requests", {
    method: "POST",
    body: { request_type: requestType },
  }),
  resume: (id) => apiFetch("/requests/" + path(id) + "/resume"),
  steps: (id) => apiFetch("/requests/" + path(id) + "/steps"),
  stepData: (id, key) => apiFetch("/requests/" + path(id) + "/steps/" + path(key)),
  stepDraft: (id, key) => apiFetch("/requests/" + path(id) + "/steps/" + path(key) + "/draft"),
  saveDraft: (id, key, data) => apiFetch("/requests/" + path(id) + "/steps/" + path(key) + "/draft", { method: "PUT", body: { data } }),
  deleteDraft: (id, key) => apiFetch("/requests/" + path(id) + "/steps/" + path(key) + "/draft", { method: "DELETE" }),
  completeGeneric: (id, key) => apiFetch("/requests/" + path(id) + "/workflow/" + path(key) + "/complete", { method: "POST" }),
  completeStep: (id, key, payload) => apiFetch("/requests/" + path(id) + "/steps/" + path(key) + "/complete", {
    method: "POST",
    body: payload,
  }),
  documents: (id) => apiFetch("/requests/" + path(id) + "/documents"),
  uploadDocument: (id, file, documentType, stepKey) => {
    const form = new FormData();
    form.append("upload", file);
    form.append("document_type", documentType);
    if (stepKey) form.append("step_key", stepKey);
    return apiFetch("/requests/" + path(id) + "/documents", { method: "POST", body: form });
  },
  downloadDocumentUrl: (fileId) => API_BASE_URL + "/requests/documents/" + path(fileId) + "/download",
  countries: () => apiFetch("/geo/countries"),
  provinces: (countryId) => apiFetch("/geo/provinces?country_id=" + path(countryId)),
  counties: (provinceId) => apiFetch("/geo/counties?province_id=" + path(provinceId)),
  cities: (countyId) => apiFetch("/geo/cities?county_id=" + path(countyId)),
  citiesByProvince: (provinceId) => apiFetch("/geo/cities?province_id=" + path(provinceId)),
  villages: (countyId) => apiFetch("/geo/villages?county_id=" + path(countyId)),
};
