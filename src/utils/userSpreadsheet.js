const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 1000;

export function normalizeSpreadsheetDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

export function normalizeNationalIdForImport(value) {
  let valueText = normalizeSpreadsheetDigits(value).trim().replace(/[\s-]+/g, "");
  if (/^\d+$/.test(valueText) && valueText.length < 10) valueText = valueText.padStart(10, "0");
  return valueText;
}

export function normalizeMobileForImport(value) {
  let valueText = normalizeSpreadsheetDigits(value).trim().replace(/[\s-]+/g, "");
  if (valueText.startsWith("+98")) valueText = "0" + valueText.slice(3);
  if (/^\d+$/.test(valueText) && valueText.length < 11) valueText = valueText.padStart(11, "0");
  return valueText;
}

export function isValidIranianNationalId(value) {
  const text = String(value ?? "");
  if (!/^\d{10}$/.test(text) || /^(\d)\1{9}$/.test(text)) return false;
  const total = Array.from({ length: 9 }, (_, index) => Number(text[index]) * (10 - index))
    .reduce((sum, digit) => sum + digit, 0);
  const remainder = total % 11;
  return remainder < 2 ? Number(text[9]) === remainder : Number(text[9]) === 11 - remainder;
}

export function validateUserImportRows(sourceRows) {
  const rows = sourceRows.map((source) => {
    const national_id = normalizeNationalIdForImport(source.national_id);
    const mobile = normalizeMobileForImport(source.mobile);
    const errors = [];
    if (!/^\d{10}$/.test(national_id)) errors.push("کد ملی باید دقیقاً ۱۰ رقم باشد.");
    else if (!isValidIranianNationalId(national_id)) errors.push("کد ملی معتبر نیست؛ رقم کنترلی را بررسی کنید.");
    if (!/^09\d{9}$/.test(mobile)) errors.push("موبایل باید ۱۱ رقم و با ۰۹ شروع شود.");
    return { ...source, national_id, mobile, errors };
  });
  const positions = new Map();
  rows.forEach((row, index) => {
    if (row.errors.some((error) => error.startsWith("کد ملی"))) return;
    const found = positions.get(row.national_id) || [];
    found.push(index);
    positions.set(row.national_id, found);
  });
  for (const found of positions.values()) {
    if (found.length > 1) found.forEach((index) => rows[index].errors.push("کد ملی در فایل تکراری است."));
  }
  return rows;
}

function parseDelimitedText(text) {
  const source = String(text).replace(/^\uFEFF/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] || "";
  const candidates = [",", ";", "\t"];
  let delimiter = ",";
  let maxCount = -1;
  for (const candidate of candidates) {
    let quote = false;
    let count = 0;
    for (let i = 0; i < firstLine.length; i += 1) {
      if (firstLine[i] === '"') {
        if (quote && firstLine[i + 1] === '"') i += 1;
        else quote = !quote;
      } else if (firstLine[i] === candidate && !quote) count += 1;
    }
    if (count > maxCount) { maxCount = count; delimiter = candidate; }
  }
  const rows = [];
  let cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(cell); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      cells.push(cell); rows.push({ cells, sourceRow: rows.length + 1 }); cells = []; cell = "";
    } else cell += char;
  }
  if (cell.length || cells.length || source.endsWith(delimiter)) {
    cells.push(cell); rows.push({ cells, sourceRow: rows.length + 1 });
  }
  return rows;
}

function decodeXml(value) {
  return String(value ?? "")
    .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, digits) => String.fromCodePoint(Number(digits)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function attributes(source) {
  const result = {};
  for (const match of String(source).matchAll(/([^\s=]+)\s*=\s*"([^"]*)"/g)) result[match[1]] = decodeXml(match[2]);
  return result;
}

function attributeByLocalName(items, name) {
  const found = Object.entries(items).find(([key]) => key === name || key.endsWith(":" + name));
  return found?.[1];
}

function xmlElementPattern(name) {
  const tag = "(?:[A-Za-z_][\\w.-]*:)?" + name;
  return new RegExp("<" + tag + "\\b([^>]*?)(?:>([\\s\\S]*?)</" + tag + "\\s*>|\\s*\\/>)", "g");
}

function textRuns(source) {
  return [...String(source).matchAll(xmlElementPattern("t"))]
    .map((item) => decodeXml(item[2] || ""))
    .join("");
}

function normalizeZipPath(path) {
  const stack = [];
  for (const part of path.replace(/\\/g, "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

async function parseXlsx(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error("ساختار فایل اکسل معتبر نیست؛ فایل را دوباره ذخیره کنید.");
  const entryCount = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const entries = new Map();
  for (let i = 0; i < entryCount; i += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error("ساختار داخلی فایل اکسل پشتیبانی نمی‌شود.");
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    if (flags & 1) throw new Error("فایل اکسل رمزگذاری‌شده پشتیبانی نمی‌شود.");
    if (compressedSize === 0xffffffff || localOffset === 0xffffffff) throw new Error("فایل اکسل بسیار بزرگ پشتیبانی نمی‌شود.");
    entries.set(name, { method, compressedSize, localOffset });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  async function readEntry(name) {
    const item = entries.get(name);
    if (!item) return null;
    const at = item.localOffset;
    if (view.getUint32(at, true) !== 0x04034b50) throw new Error("بخش داخلی فایل اکسل قابل خواندن نیست.");
    const nameLength = view.getUint16(at + 26, true);
    const extraLength = view.getUint16(at + 28, true);
    const start = at + 30 + nameLength + extraLength;
    const compressed = bytes.subarray(start, start + item.compressedSize);
    if (item.method === 0) return decoder.decode(compressed);
    if (item.method !== 8 || typeof DecompressionStream === "undefined") {
      throw new Error("مرورگر امکان باز کردن فایل اکسل را ندارد؛ فایل را به CSV تبدیل کنید.");
    }
    try {
      return await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
    } catch {
      throw new Error("فشرده‌سازی فایل اکسل قابل خواندن نیست؛ فایل را دوباره ذخیره یا به CSV تبدیل کنید.");
    }
  }

  const workbook = await readEntry("xl/workbook.xml");
  const rels = await readEntry("xl/_rels/workbook.xml.rels");
  if (!workbook || !rels) throw new Error("برگه‌های فایل اکسل پیدا نشدند.");

  const sheets = [...workbook.matchAll(xmlElementPattern("sheet"))]
    .map((item) => attributes(item[1]));
  if (!sheets.length) throw new Error("فایل اکسل هیچ برگه‌ای ندارد.");

  const relationships = [...rels.matchAll(xmlElementPattern("Relationship"))]
    .map((item) => attributes(item[1]));
  const relationshipById = new Map(relationships.map((item) => [item.Id, item]));
  const sharedXml = await readEntry("xl/sharedStrings.xml");
  const sharedStrings = sharedXml
    ? [...sharedXml.matchAll(xmlElementPattern("si"))].map((item) => textRuns(item[2] || ""))
    : [];

  let firstParsedRows = null;
  for (const sheetInfo of sheets) {
    const relationshipId = attributeByLocalName(sheetInfo, "id");
    const relationship = relationshipById.get(relationshipId);
    if (!relationship?.Target) continue;

    const path = relationship.Target.startsWith("/")
      ? normalizeZipPath(relationship.Target.slice(1))
      : normalizeZipPath("xl/" + relationship.Target);
    const sheet = await readEntry(path);
    if (!sheet) continue;

    const rows = [];
    for (const rowMatch of sheet.matchAll(xmlElementPattern("row"))) {
      const rowAttrs = attributes(rowMatch[1]);
      const rowNumber = Number(rowAttrs.r) || rows.length + 1;
      const cells = [];
      for (const cellMatch of String(rowMatch[2] || "").matchAll(xmlElementPattern("c"))) {
        const cellAttrs = attributes(cellMatch[1]);
        const ref = String(attributeByLocalName(cellAttrs, "r") || "").match(/^[A-Z]+/i)?.[0]?.toUpperCase();
        if (!ref) continue;
        let column = 0;
        for (const letter of ref) column = column * 26 + letter.charCodeAt(0) - 64;
        column -= 1;
        const content = cellMatch[2] || "";
        let value = "";
        if (cellAttrs.t === "inlineStr") {
          const inline = [...content.matchAll(xmlElementPattern("is"))][0];
          value = inline ? textRuns(inline[2] || "") : "";
        } else {
          const valueMatch = [...content.matchAll(xmlElementPattern("v"))][0];
          value = decodeXml(valueMatch?.[2] || "");
          if (cellAttrs.t === "s" && value !== "") value = sharedStrings[Number(value)] ?? "";
        }
        cells[column] = String(value);
      }
      rows.push({ cells, sourceRow: rowNumber });
    }

    if (!firstParsedRows) firstParsedRows = rows;
    if (rows.some((row) => row.cells.some((cell) => String(cell ?? "").trim() !== ""))) {
      return rows;
    }
  }

  return firstParsedRows || [];
}

function normalizedHeader(value) {
  return String(value ?? "").replace(/[يى]/g, "ی").replace(/ك/g, "ک").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}
const aliases = {
  national_id: new Set(["کدملی", "nationalid", "nationalidentitynumber", "nid"]),
  mobile: new Set(["موبایل", "موبيل", "شمارههمراه", "تلفنهمراه", "شمارهتلفنهمراه", "mobile", "phone", "phonenumber"]),
};
function detectHeader(cells) {
  const result = {};
  cells.forEach((value, index) => {
    const key = normalizedHeader(value);
    for (const [field, candidates] of Object.entries(aliases)) if (candidates.has(key) && result[field] === undefined) result[field] = index;
  });
  return Object.keys(aliases).every((field) => result[field] !== undefined) ? result : null;
}

export async function readUserSpreadsheet(file) {
  if (!file) throw new Error("فایلی انتخاب نشده است.");
  if (file.size > MAX_FILE_BYTES) throw new Error("حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.");
  const name = String(file.name || "").toLowerCase();
  let rows;
  if (name.endsWith(".xlsx")) rows = await parseXlsx(await file.arrayBuffer());
  else if (name.endsWith(".csv") || name.endsWith(".tsv")) rows = parseDelimitedText(await file.text());
  else throw new Error("فقط فایل‌های .xlsx، .csv یا .tsv پشتیبانی می‌شوند. فایل‌های قدیمی .xls را ابتدا به .xlsx تبدیل کنید.");
  const nonEmpty = rows.filter((row) => row.cells.some((cell) => String(cell ?? "").trim() !== ""));
  if (!nonEmpty.length) throw new Error("فایل انتخاب‌شده خالی است.");
  let headerIndex = -1;
  let mapping = null;
  for (let index = 0; index < Math.min(10, nonEmpty.length); index += 1) {
    const found = detectHeader(nonEmpty[index].cells);
    if (found) { headerIndex = index; mapping = found; break; }
  }
  const data = headerIndex >= 0 ? nonEmpty.slice(headerIndex + 1) : nonEmpty;
  if (data.length > MAX_ROWS) throw new Error("در هر بار ورود حداکثر ۱۰۰۰ کاربر قابل پردازش است.");
  if (!data.length) throw new Error("هیچ ردیف کاربری در فایل پیدا نشد.");
  const columns = mapping || { national_id: 0, mobile: 1 };
  return validateUserImportRows(data.map((row, index) => ({
    national_id: row.cells[columns.national_id] ?? "",
    mobile: row.cells[columns.mobile] ?? "",
    sourceRow: row.sourceRow ?? (headerIndex >= 0 ? index + 2 : index + 1),
  })));
}
