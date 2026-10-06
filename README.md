# Recruit Front

Frontend حرفه‌ای و فارسی سامانه Recruit با React 19.3 و Vite 8.

## جریان کار

کاربر وارد پنل می‌شود و ابتدا درخواست‌های خودش را می‌بیند. از همان‌جا می‌تواند درخواست جدید بسازد یا پرونده قبلی را از مرحله جاری ادامه دهد.

برای Workflow گزینش، فرم مطابق ساختار کاربرگ ۶ صفحه‌ای و ۳۱ بخش اصلی به صورت Wizard مرحله‌ای و امن پیاده‌سازی شده است؛ هر مرحله پس از تأیید با Backend ذخیره و سپس transition می‌شود.

## امنیت

- احراز هویت بر اساس session cookie فعلی Backend و بدون نگهداری access token در localStorage.
- ارسال credentials در تمام درخواست‌ها.
- ارسال X-CSRF-Token از cookie غیر HttpOnly به header برای درخواست‌های state-changing.
- X-Request-ID برای correlation.
- عدم استفاده از dangerouslySetInnerHTML.
- کنترل حجم فایل سمت رابط کاربری، در کنار validation سمت Backend.
- عدم قرار دادن اطلاعات حساس پرونده در query string.

## اجرا

1. مقدار VITE_API_BASE_URL را در .env تنظیم کنید.
2. npm install
3. npm run dev

پیش‌فرض محلی: http://localhost:8000/api/v1

## نکته Backend

Backend باید CORS origin مربوط به URL این frontend را در CORS_ORIGINS داشته باشد. چون session در cookie نگهداری می‌شود، استفاده از HTTPS در production و تنظیم Secure cookie اجباری است.

نسخه فعلی React: 19.3.0.
