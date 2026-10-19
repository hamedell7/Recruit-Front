# Recruit Front

Frontend حرفه‌ای و فارسی سامانه Recruit مبتنی بر React 19 و Vite 8.

## معماری پروژه

ساختار پروژه بر اساس تفکیک مسئولیت و Feature-based organization تنظیم شده است:

```text
src/
├── app/                     # orchestration و bootstrap اپلیکیشن
├── components/              # کامپوننت‌های عمومی و قابل‌استفاده مجدد
│   ├── common/
│   ├── form/
│   └── layout/
├── config/                  # تنظیمات و متادیتای workflowها
├── features/
│   ├── auth/                # ورود و احراز هویت
│   ├── dashboard/           # داشبورد و کارت‌های درخواست
│   └── requests/            # Wizard، navigation و تمام Stepها
├── services/
│   └── api/                 # HTTP client و endpointهای Backend
├── styles/                  # CSS تفکیک‌شده بر اساس لایه و feature
└── utils/                   # توابع pure و utilityهای عمومی
```

`src/App.jsx` فقط مسئول orchestration سطح بالا است؛ منطق UI، فرم، API، workflow و validation در ماژول‌های مستقل نگهداری می‌شوند.

## جریان کار

کاربر وارد پنل می‌شود و ابتدا درخواست‌های خودش را می‌بیند. از همان‌جا می‌تواند درخواست جدید بسازد یا پرونده قبلی را از مرحله جاری ادامه دهد.

برای Workflow گزینش، فرم به‌صورت Wizard مرحله‌ای پیاده‌سازی شده است؛ هر مرحله پس از تأیید با Backend ذخیره و سپس transition می‌شود.

## لایه API

تمام ارتباطات Backend از `src/services/api/httpClient.js` عبور می‌کند. این لایه مسئول credentials، CSRF، request correlation، parsing پاسخ‌ها، validation error normalization و mapping خطاهای رایج مانند 401 و 429 است.

Endpointهای دامنه‌ای در `src/services/api/index.js` نگهداری می‌شوند تا UI مستقیماً با جزئیات transport درگیر نباشد.

## امنیت

- احراز هویت بر اساس session cookie فعلی Backend و بدون نگهداری access token در localStorage.
- ارسال credentials در تمام درخواست‌ها.
- ارسال X-CSRF-Token از cookie غیر HttpOnly به header برای درخواست‌های state-changing.
- نام کوکی CSRF در فرانت‌اند از `VITE_CSRF_COOKIE_NAME` خوانده می‌شود و باید با `CSRF_COOKIE_NAME` بک‌اند یکسان باشد.
- X-Request-ID برای correlation.
- عدم استفاده از dangerouslySetInnerHTML.
- کنترل حجم فایل سمت رابط کاربری، در کنار validation سمت Backend.
- عدم قرار دادن اطلاعات حساس پرونده در query string.

## اجرا

```bash
npm install
npm run dev
```

برای اجرای محلی، فایل نمونه را به `.env` کپی کنید:

```bash
cp .env.example .env
npm install
npm run dev
```

پیش‌فرض `VITE_API_BASE_URL=/api/v1` است و Vite درخواست‌های `/api/*` را از طریق پراکسی توسعه به بک‌اند هدایت می‌کند. مقصد پراکسی با `VITE_DEV_API_PROXY_TARGET` تنظیم می‌شود و به‌صورت پیش‌فرض `http://localhost:8000` است.

اگر نام کوکی CSRF در بک‌اند را تغییر می‌دهید، مقدار `VITE_CSRF_COOKIE_NAME` را نیز دقیقاً با `CSRF_COOKIE_NAME` بک‌اند هماهنگ کنید.

برای production، مقدار `VITE_API_BASE_URL` را به آدرس API محیط مقصد تنظیم کنید؛ پراکسی تعریف‌شده در Vite فقط برای سرور توسعه است.

برای production:

```bash
npm run build
npm run preview
```

## کیفیت کد

هر تغییر روی branch اصلی از طریق GitHub Actions با `npm install` و `npm run build` بررسی می‌شود.

فونت اصلی پروژه Iran Yekan است و فایل‌های فونت قدیمی Vazir حذف شده‌اند.