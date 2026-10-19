import { createApiError } from "./errors.js";
import { buildFetchOptions } from "./requestOptions.js";

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

async function apiFetch(path, options = {}) {
  const response = await fetch(
    API_BASE_URL + path,
    buildFetchOptions(options, {
      accept: "application/json",
      requestId: requestId(),
      getCsrfToken: () => getCookie(CSRF_COOKIE_NAME),
    }),
  );

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw createApiError(response, payload, "خطا در ارتباط با سامانه");
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
      // Keep the original read/write error.
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

  const response = await fetch(
    API_BASE_URL + path,
    buildFetchOptions(options, {
      accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json",
      requestId: requestId(),
      getCsrfToken: () => getCookie(CSRF_COOKIE_NAME),
    }),
  );

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    throw createApiError(response, payload, "خطا در دریافت فایل");
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
