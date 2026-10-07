function getFieldError(errors, path) {
  return errors?.[path] || null;
}

function formatErrorPath(path) {
  if (!path) return "اطلاعات فرم";

  const labels = {
    first_name: "نام",
    last_name: "نام خانوادگی",
    father_name: "نام پدر",
    national_id: "کد ملی",
    mobile: "شماره موبایل",
    birth_date: "تاریخ تولد",
    gender: "جنسیت",
    previous_last_name: "نام خانوادگی قبلی",
    birth_certificate_no: "شماره شناسنامه",
    birth_province_id: "استان محل تولد",
    birth_county_id: "شهرستان محل تولد",
    birth_city_id: "شهر محل تولد",
    birth_village_id: "روستای محل تولد",
    nationality: "تابعیت",
    religion: "دین",
    sect: "مذهب",
    physical_status: "وضعیت جسمانی",
    disease_description: "شرح بیماری",
    disability_description: "شرح معلولیت",
    weight_kg: "وزن",
    height_cm: "قد",
    blood_type: "گروه خونی",
    distinguishing_marks: "علائم مشخصه",
    email: "ایمیل",
    status: "وضعیت",
    accepted: "تأیید تعهدنامه",
    country_id: "کشور",
    province_id: "استان",
    county_id: "شهرستان",
    city_id: "شهر",
    village_id: "روستا",
    address_line: "نشانی",
    phone: "تلفن",
    first_name_child: "نام",
    last_name_child: "نام خانوادگی",
    degree_level: "مقطع تحصیلی",
    institution_name: "نام دانشگاه / حوزه",
    field_of_study: "رشته / گرایش",
    organization_name: "نام سازمان / اداره",
    position: "سمت و شغل",
    start_date: "تاریخ شروع",
    end_date: "تاریخ پایان",
    organization_name: "سازمان خدمتی",
    unit_name: "یگان خدمتی",
    service_city_id: "شهر محل خدمت",
    exemption_type: "نوع معافیت",
    booklet_status: "وضعیت دفترچه",
    absence_status: "وضعیت غیبت",
    conscription_date: "تاریخ اعزام",
    marriages: "ازدواج‌ها",
    marriage_date: "تاریخ ازدواج",
    end_reason: "علت پایان ازدواج",
  };

  const parts = String(path).split(".");
  const indexPattern = /^\d+$/;
  return parts
    .map((part) => {
      if (indexPattern.test(part)) return "ردیف " + (Number(part) + 1);
      return labels[part] || part.replace(/_/g, " ");
    })
    .join(" ← ");
}

export { getFieldError, formatErrorPath };
