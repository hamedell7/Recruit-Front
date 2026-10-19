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
  if (/string_type/i.test(kind)) {
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

function createApiError(response, payload, fallbackMessage) {
  const validationErrors = normalizeValidationErrors(payload);
  const fallbackValidationMessage = validationErrors[0]?.message;
  const payloadCode = typeof payload === "object" ? payload?.code : undefined;
  const rawMessage = typeof payload === "object" && payload?.message
    ? payload.message
    : fallbackValidationMessage
      || (typeof payload === "string" && payload.trim() ? payload : fallbackMessage);
  const error = new Error(humanizeApiErrorMessage(response.status, payloadCode, rawMessage));

  error.status = response.status;
  error.code = payloadCode;
  error.requestId = response.headers.get("X-Request-ID")
    || (typeof payload === "object" ? payload?.request_id : undefined);
  error.payload = payload;
  error.validationErrors = validationErrors;
  return error;
}

export { createApiError, normalizeValidationErrors };
