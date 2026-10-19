function isFormData(value) {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

export function buildFetchOptions(options = {}, { accept, requestId, getCsrfToken } = {}) {
  const method = (options.method || "GET").toUpperCase();
  const stateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const body = options.body;
  const formData = isFormData(body);

  const headers = {
    Accept: accept,
    "X-Request-ID": requestId,
    ...(options.headers || {}),
  };

  if (body !== undefined && !formData) {
    headers["Content-Type"] = "application/json";
  }

  if (stateChanging && typeof getCsrfToken === "function") {
    const csrfToken = getCsrfToken();
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  }

  return {
    ...options,
    method,
    credentials: "include",
    body: formData || body === undefined ? body : JSON.stringify(body),
    headers,
  };
}
