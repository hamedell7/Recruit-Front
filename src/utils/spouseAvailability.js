export function withSpouseAvailability(options = [], hasSpouse = false) {
  return (Array.isArray(options) ? options : []).map((option) => {
    const normalized = typeof option === "string"
      ? { value: option, label: option }
      : option;

    if (!normalized || !["SPOUSE", "SPOUSE_RELATIVE"].includes(normalized.value) || hasSpouse) return option;
    return {
      ...normalized,
      label: normalized.value === "SPOUSE_RELATIVE"
        ? "بستگان همسر (ابتدا در سوابق ازدواج ثبت شود)"
        : "همسر (ابتدا در سوابق ازدواج ثبت شود)",
      disabled: true,
    };
  });
}
