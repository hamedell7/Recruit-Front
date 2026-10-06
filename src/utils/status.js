import { STATUS } from "../config/workflow";

export function statusLabel(status) {
  return STATUS[status] || [status || "نامشخص", "muted"];
}
