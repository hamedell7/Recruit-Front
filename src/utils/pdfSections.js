export function getSelectablePdfSteps(report) {
  if (!Array.isArray(report?.steps)) return [];
  return report.steps.filter((step) => (
    step &&
    typeof step.key === "string" &&
    step.key.trim().length > 0
  ));
}

export function pdfStepSectionKey(stepKey) {
  return "step:" + stepKey;
}

export function pdfStepEmptyMessage(step) {
  if (step?.data_source === "not_loaded") {
    return "اطلاعات این مرحله در این گزارش بارگذاری نشده است.";
  }
  if (step?.data === null || step?.data === undefined) {
    return "اطلاعات این مرحله هنوز ثبت نشده است.";
  }
  return "برای این بخش، اطلاعاتی ثبت نشده است.";
}
