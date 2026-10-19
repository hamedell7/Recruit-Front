const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME || "recruit_csrf";

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split(/;\s*/) : [];
  const item = cookies.find((cookie) => cookie.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function requestId() {
  return globalThis.crypto?.randomUUID?.() || "req-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function normalizeValidationErrors(payload) {
  const details = typeof payload === "object" && payload
    ? (Array.isArray(payload.detail) ? payload.detail : Array.isArray(payload.details) ? payload.details : null)
    : null;

  if (!details) {
    if (typeof payload === "object" && payload?.detail && typeof payload.detail === "string") {
      return [{ path: "", message: payload.detail, type: "request" }];
    }
    return [];
  }

  return details.map((item) => {
    if (typeof item === "string") {
      return { path: "", message: item, type: "request" };
    }

    const location = Array.isArray(item?.loc) ? item.loc : [];
    const path = location
      .filter((part) => part !== "body" && part !== "query" && part !== "path" && part !== "header")
      .map(String)
      .join(".");
    return {
      path,
      message: humanizeValidationMessage(item?.msg, item?.type),
      type: item?.type || "validation",
    };
  });
}

function humanizeApiErrorMessage(status, code, message) {
  if (status === 401 && code === "INVALID_CREDENTIALS") {
    return "کد ملی یا شماره موبایل واردشده صحیح نیست.";
  }
  if (status === 401) {
    return "نشست شما معتبر نیست یا منقضی شده است. لطفاً دوباره وارد سامانه شوید.";
  }
  if (status === 429) {
    return "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید.";
  }
  return message;
}

function humanizeValidationMessage(message, type) {
  const value = String(message || "").trim();
  const kind = String(type || "");

  if (/missing|field required|required/i.test(value) || /missing/i.test(kind)) {
    return "تکمیل این فیلد الزامی است.";
  }
  if (/string should have at least (\d+)/i.test(value)) {
    return "طول این مقدار کمتر از حد مجاز است.";
  }
  if (/string should have at most (\d+)/i.test(value)) {
    return "طول این مقدار بیشتر از حد مجاز است.";
  }
  if (/input.*(?:valid|string)|(?:valid|string).*input/i.test(value) || /string_type|string_type/i.test(kind)) {
    return "مقدار واردشده معتبر نیست.";
  }
  if (/valid email|email address/i.test(value) || /email/i.test(kind)) {
    return "ایمیل واردشده معتبر نیست.";
  }
  if (/valid integer|integer parsing|int_parsing/i.test(value) || /int_parsing/i.test(kind)) {
    return "مقدار این فیلد باید عدد صحیح باشد.";
  }
  if (/valid number|float parsing|float_parsing/i.test(value) || /float_parsing/i.test(kind)) {
    return "مقدار این فیلد باید عدد باشد.";
  }
  if (/greater than or equal to/i.test(value)) {
    return "مقدار این فیلد کمتر از حد مجاز است.";
  }
  if (/less than or equal to/i.test(value)) {
    return "مقدار این فیلد بیشتر از حد مجاز است.";
  }
  if (/cannot be before from_date/i.test(value)) {
    return "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.";
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (/\binput\b/i.test(normalized)) {
    return "مقدار واردشده معتبر نیست.";
  }
  return normalized || "مقدار واردشده معتبر نیست.";
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
    const csrf = getCookie(CSRF_COOKIE_NAME);
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
    const validationErrors = normalizeValidationErrors(payload);
    const fallbackMessage = validationErrors[0]?.message;
    const payloadCode = typeof payload === "object" ? payload?.code : undefined;
    const rawMessage = typeof payload === "object" && payload?.message
      ? payload.message
      : fallbackMessage || (typeof payload === "string" && payload.trim() ? payload : "خطا در ارتباط با سامانه");
    const errorMessage = humanizeApiErrorMessage(response.status, payloadCode, rawMessage);
    const error = new Error(errorMessage);
    error.status = response.status;
    error.code = typeof payload === "object" ? payload?.code : undefined;
    error.requestId = response.headers.get("X-Request-ID") || (typeof payload === "object" ? payload?.request_id : undefined);
    error.payload = payload;
    error.validationErrors = validationErrors;
    throw error;
  }

  return payload;
}



async function writeResponseToFile(response, fileHandle) {
  const writable = await fileHandle.createWritable();
  let reader;

  try {
    if (response.body?.getReader) {
      reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writable.write(value);
      }
    } else {
      await writable.write(await response.blob());
    }
    await writable.close();
  } catch (error) {
    try {
      await reader?.cancel(error);
    } catch {
      // Keep the original write/read error.
    }
    try {
      await writable.abort(error);
    } catch {
      // The writable stream may already have been closed or aborted.
    }
    throw error;
  }
}

async function apiDownload(path, options = {}, downloadOptions = {}) {
  const method = (options.method || "GET").toUpperCase();
  const stateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const body = options.body;
  let fileHandle = null;

  // On Chromium browsers, large exports can stream straight to disk instead of
  // materializing the entire response as a JavaScript Blob.
  if (
    downloadOptions.streamToDisk &&
    typeof window !== "undefined" &&
    typeof window.showSaveFilePicker === "function"
  ) {
    try {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: "e" + Date.now() + ".xlsx",
        types: [{
          description: "Excel workbook",
          accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
          },
        }],
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        const cancelled = new Error("دانلود توسط کاربر لغو شد.");
        cancelled.name = "DownloadCancelledError";
        throw cancelled;
      }
      // If the file picker is blocked by the browser or policy, fall back to Blob.
    }
  }

  const headers = {
    Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json",
    "X-Request-ID": requestId(),
    ...(options.headers || {}),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (stateChanging) {
    const csrf = getCookie(CSRF_COOKIE_NAME);
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  const response = await fetch(API_BASE_URL + path, {
    ...options,
    method,
    credentials: "include",
    body: body instanceof FormData || body === undefined ? body : JSON.stringify(body),
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    const validationErrors = normalizeValidationErrors(payload);
    const fallbackMessage = validationErrors[0]?.message;
    const payloadCode = typeof payload === "object" ? payload?.code : undefined;
    const rawMessage = typeof payload === "object" && payload?.message
      ? payload.message
      : fallbackMessage || (typeof payload === "string" && payload.trim() ? payload : "خطا در دریافت فایل");
    const error = new Error(humanizeApiErrorMessage(response.status, payloadCode, rawMessage));
    error.status = response.status;
    error.code = payloadCode;
    error.requestId = response.headers.get("X-Request-ID") || (typeof payload === "object" ? payload?.request_id : undefined);
    error.payload = payload;
    error.validationErrors = validationErrors;
    throw error;
  }

  const disposition = response.headers.get("content-disposition") || "";
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const regularName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const filename = (encodedName ? decodeURIComponent(encodedName) : regularName) || "recruit-export.xlsx";

  if (fileHandle) {
    await writeResponseToFile(response, fileHandle);
    return { filename, savedToDisk: true };
  }

  return { blob: await response.blob(), filename, savedToDisk: false };
}

export { apiFetch, apiDownload, API_BASE_URL };
