const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const GREGORIAN_DIGITS = "0123456789";

function pad(value) {
  return String(value).padStart(2, "0");
}

function toEnglishDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => PERSIAN_DIGITS.indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
}

function fromEnglishDigits(value) {
  return String(value ?? "").replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

function jalaliToGregorian(jy, jm, jd) {
  jy = Number(jy) - 979;
  jm = Number(jm) - 1;
  jd = Number(jd) - 1;

  let jDayNo =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    jd;
  for (let month = 0; month < jm; month += 1) {
    jDayNo += month < 6 ? 31 : 30;
  }

  let gDayNo = jDayNo + 79;
  let gy = 1600 + 400 * Math.floor(gDayNo / 146097);
  gDayNo %= 146097;

  let leap = true;
  if (gDayNo >= 36525) {
    gDayNo -= 1;
    gy += 100 * Math.floor(gDayNo / 36524);
    gDayNo %= 36524;
    if (gDayNo >= 365) gDayNo += 1;
    else leap = false;
  }

  gy += 4 * Math.floor(gDayNo / 1461);
  gDayNo %= 1461;

  if (gDayNo >= 366) {
    leap = false;
    gDayNo -= 1;
    gy += Math.floor(gDayNo / 365);
    gDayNo %= 365;
  }

  const monthDays = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  while (gm <= 12 && gDayNo >= monthDays[gm]) {
    gDayNo -= monthDays[gm];
    gm += 1;
  }

  return [gy, gm, gDayNo + 1];
}

function gregorianToJalali(gy, gm, gd) {
  let gYear = Number(gy);
  let gMonth = Number(gm) - 1;
  let gDay = Number(gd) - 1;

  const gMonthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gDayNo =
    365 * (gYear - 1600) +
    Math.floor((gYear - 1600 + 3) / 4) -
    Math.floor((gYear - 1600 + 99) / 100) +
    Math.floor((gYear - 1600 + 399) / 400);

  for (let i = 0; i < gMonth; i += 1) gDayNo += gMonthDays[i + 1];
  if (gMonth > 1 && ((gYear % 4 === 0 && gYear % 100 !== 0) || gYear % 400 === 0)) gDayNo += 1;
  gDayNo += gDay;

  let jDayNo = gDayNo - 79;
  const jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;

  let jYear = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;

  if (jDayNo >= 366) {
    jYear += Math.floor((jDayNo - 1) / 365);
    jDayNo = (jDayNo - 1) % 365;
  }

  const jMonth = jDayNo < 186 ? 1 + Math.floor(jDayNo / 31) : 7 + Math.floor((jDayNo - 186) / 30);
  const jDay = 1 + (jDayNo < 186 ? jDayNo % 31 : (jDayNo - 186) % 30);

  return [jYear, jMonth, jDay];
}

function parseJalali(value) {
  if (!value) return null;
  const normalized = toEnglishDigits(value).trim().replace(/[./]/g, "-");
  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > jalaliMonthLength(year, month)) return null;

  return { year, month, day };
}

function parseGregorian(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function jalaliMonthLength(year, month) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const next = jalaliToGregorian(Number(year) + 1, 1, 1);
  const current = jalaliToGregorian(Number(year), 1, 1);
  const days = Math.round(
    (Date.UTC(next[0], next[1] - 1, next[2]) - Date.UTC(current[0], current[1] - 1, current[2])) / 86400000
  );
  return days === 366 ? 30 : 29;
}

export function isValidJalaliDate(value) {
  return Boolean(parseJalali(value));
}

export function jalaliToGregorianString(value) {
  const parsed = parseJalali(value);
  if (!parsed) return value || null;
  const [gy, gm, gd] = jalaliToGregorian(parsed.year, parsed.month, parsed.day);
  return `${gy}-${pad(gm)}-${pad(gd)}`;
}

export function gregorianToJalaliString(value) {
  const parsed = parseGregorian(value);
  if (!parsed) return value || "";
  const [jy, jm, jd] = gregorianToJalali(parsed.year, parsed.month, parsed.day);
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

export function formatJalali(value) {
  if (!value) return "—";
  const jalali = value.includes("/") ? value.replace(/-/g, "/") : gregorianToJalaliString(value);
  const parsed = jalali.replace(/\//g, "-").split("-");
  if (parsed.length !== 3) return fromEnglishDigits(value);
  return fromEnglishDigits(`${parsed[0]}/${pad(parsed[1])}/${pad(parsed[2])}`);
}

export function todayJalali() {
  const now = new Date();
  return gregorianToJalaliString(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
}

export function getJalaliDateParts(value) {
  const raw = String(value ?? "").trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(raw)) {
    const gregorian = parseGregorian(raw);
    if (gregorian) {
      const [year, month, day] = gregorianToJalali(gregorian.year, gregorian.month, gregorian.day);
      return { year, month, day };
    }
  }

  const jalali = parseJalali(raw);
  if (jalali) return jalali;

  const gregorian = parseGregorian(raw);
  if (gregorian) {
    const [year, month, day] = gregorianToJalali(gregorian.year, gregorian.month, gregorian.day);
    return { year, month, day };
  }
  return parseJalali(todayJalali());
}

export function formatDate(value) {
  if (!value) return "—";
  const jalali = gregorianToJalaliString(value);
  if (!jalali || jalali === value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return formatJalali(
      `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
    );
  }

  return formatJalali(jalali);
}

export { fromEnglishDigits, gregorianToJalali, jalaliMonthLength, parseJalali, toEnglishDigits };
