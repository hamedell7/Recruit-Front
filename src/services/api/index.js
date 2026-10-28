import { apiDownload, apiFetch, API_BASE_URL } from "./httpClient";

const path = (value) => encodeURIComponent(value);

const api = {
  me: () => apiFetch("/auth/me"),
  login: (nationalId, mobile) => apiFetch("/auth/login", {
    method: "POST",
    body: { national_id: nationalId, mobile },
  }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  requestTypes: () => apiFetch("/requests/types"),
  requests: () => apiFetch("/requests"),
  requestDashboard: (filters = {}, signal) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    return apiFetch("/requests/dashboard" + (query ? "?" + query : ""), { signal });
  },
  request: (id) => apiFetch("/requests/" + path(id)),
  requestReport: (id) => apiFetch("/requests/" + path(id) + "/report"),
  createRequest: (requestType) => apiFetch("/requests", {
    method: "POST",
    body: { request_type: requestType },
  }),
  resume: (id) => apiFetch("/requests/" + path(id) + "/resume"),
  steps: (id) => apiFetch("/requests/" + path(id) + "/steps"),
  staffRequestWorkflow: (id) => apiFetch("/staff/requests/" + path(id) + "/workflow"),
  staffRequestDocuments: (id) => apiFetch("/staff/requests/" + path(id) + "/documents"),
  staffRequestDocumentUrl: (requestId, fileId, download = true) => API_BASE_URL + "/staff/requests/" + path(requestId) + "/documents/" + path(fileId) + "/download?download=" + (download ? "true" : "false"),
  decideStaffRequest: (id, payload) => apiFetch("/staff/requests/" + path(id) + "/decision", { method: "POST", body: payload }),
  requestWorkflow: (id) => apiFetch("/requests/" + path(id) + "/workflow"),
  workflowDetail: (key) => apiFetch("/staff/workflows/" + path(key)),
  saveWorkflowDraft: (key, payload) => apiFetch("/staff/workflows/" + path(key) + "/draft", { method: "PUT", body: payload }),
  publishWorkflow: (key, payload) => apiFetch("/staff/workflows/" + path(key) + "/publish", { method: "POST", body: payload }),
  workflows: () => apiFetch("/staff/workflows"),
  createWorkflow: (payload) => apiFetch("/staff/workflows", { method: "POST", body: payload }),
  staffRequestTypes: () => apiFetch("/staff/request-types"),
  createRequestType: (payload) => apiFetch("/staff/request-types", { method: "POST", body: payload }),
  updateRequestTypeSettings: (code, payload) => apiFetch("/staff/request-types/" + path(code) + "/settings", {
    method: "PUT",
    body: payload,
  }),
  staffRequestReport: (id) => apiFetch("/staff/requests/" + path(id) + "/report"),
  staffExcelExportSheets: () => apiFetch("/staff/requests/export.xlsx/sheets"),
  exportStaffRequestsExcel: (payload, downloadOptions = {}) => apiDownload(
    "/staff/requests/export.xlsx",
    {
      method: "POST",
      body: payload,
    },
    downloadOptions,
  ),
  exportStaffRequestExcel: (id) => apiDownload("/staff/requests/" + path(id) + "/export.xlsx"),
  staffDashboard: (filters = {}, signal) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    return apiFetch("/staff/requests/dashboard" + (query ? "?" + query : ""), { signal });
  },
  staffUsers: (filters = {}, signal) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") params.set(key, String(value));
    });
    const query = params.toString();
    return apiFetch("/staff/users" + (query ? "?" + query : ""), { signal });
  },
  importStaffUsers: (payload) => apiFetch("/staff/users/import", { method: "POST", body: payload }),
  updateStaffUser: (userId, payload) => apiFetch("/staff/users/" + path(userId), {
    method: "PUT",
    body: payload,
  }),
  updateStaffUserStatus: (userId, status) => apiFetch("/staff/users/" + path(userId) + "/status", {
    method: "PATCH",
    body: { status },
  }),
  stepData: (id, key) => apiFetch("/requests/" + path(id) + "/steps/" + path(key)),
  stepDraft: (id, key) => apiFetch("/requests/" + path(id) + "/steps/" + path(key) + "/draft"),
  saveDraft: (id, key, data, signal) => apiFetch("/requests/" + path(id) + "/steps/" + path(key) + "/draft", { method: "PUT", body: { data }, signal }),
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
  allProvinces: () => apiFetch("/geo/provinces"),
  counties: (provinceId) => apiFetch("/geo/counties?province_id=" + path(provinceId)),
  cities: (countyId) => apiFetch("/geo/cities?county_id=" + path(countyId)),
  citiesByProvince: (provinceId) => apiFetch("/geo/cities?province_id=" + path(provinceId)),
  villages: (countyId) => apiFetch("/geo/villages?county_id=" + path(countyId)),
};

export { api };
