import { formatDate } from "../../utils/date";

function DraftStatus({ state, updatedAt }) {
  const labels = {
    idle: "آماده ذخیره خودکار",
    dirty: "در حال ثبت تغییرات…",
    saving: "در حال ذخیره امن…",
    saved: "ذخیره شد",
    error: "ذخیره خودکار ناموفق بود",
  };
  return <div className={"draft-status " + state}><span className="draft-pulse" /><span>{labels[state] || labels.idle}</span>{updatedAt && state === "saved" && <time>{formatDate(updatedAt)}</time>}</div>;
}

export default DraftStatus;
