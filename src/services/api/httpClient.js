const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
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

  return value || "مقدار واردشده معتبر نیست.";
}



export { apiFetch, API_BASE_URL };
