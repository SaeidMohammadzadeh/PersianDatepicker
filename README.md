# Persian Datepicker
یک کامپوننت تقویم سه‌حالته (شمسی، میلادی، قمری) با محوریت **تقویم شمسی**، بدون وابستگی به jQuery یا کتابخانه‌های خارجی، کاملاً سبک و مناسب استفاده در پروژه‌های فارسی.

---

## چرا این پروژه ساخته شد؟
یکی از مشکلات مهم توسعه وب فارسی نبود یک **تقویم شمسی پایه‌ای، استاندارد و بدون باگ** بود. اکثر تقویم‌های موجود:

- اساساً میلادی بودند و شمسی فقط یک وصله اضافه بود  
- در سال‌های کبیسه شمسی خطا داشتند  
- وابسته به jQuery یا کتابخانه‌های دیگر بودند  
- نسخه‌های مختلف jQuery باعث خراب شدن تقویم می‌شد  
- تقویم میلادی و قمری باید جداگانه استفاده می‌شد  
- تعطیلات رسمی و غیررسمی پشتیبانی نمی‌شد  

### این پروژه چه تفاوتی دارد؟
✔ ۱۰۰٪ مبنای شمسی  
✔ جاوااسکریپت خالص (Vanilla JS)، بدون وابستگی  
✔ سازگار با هر فریم‌ورک: React, Vue, Angular, Blazor, ASP.NET  
✔ محاسبه دقیق کبیسه  
✔ پشتیبانی از تعطیلات رسمی و غیررسمی  
✔ فقط با یک تقویم، سه حالت شمسی/میلادی/قمری در اختیار شماست  
✔ حتی در حالت میلادی و قمری، **تعطیلات شمسی اعمال می‌شود**  

---

## قابلیت‌ها
- تقویم شمسی (`.date-input-field`)
- تقویم میلادی (`.gdate-input-field`)
- تقویم قمری (`.hdate-input-field`)
- تعطیلات رسمی (قرمز) و غیررسمی (نارنجی)
- تشخیص آخر هفته:
  - شمسی → جمعه
  - میلادی → یکشنبه
  - قمری → جمعه
- پشتیبانی از کلید Escape  
- بدون چشمک/فلیکر هنگام باز شدن

---

## نصب
```html
<link rel="stylesheet" href="css/persiandatepicker.css">
<script src="js/persiandatepicker.js"></script>
```

فونت فارسی (پیشنهادی):

```html
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;900&display=swap" rel="stylesheet">
```

---

## نحوه استفاده
### شمسی
```html
<input class="date-input-field">
<input type="hidden" name="jalaliDate">
```

### میلادی
```html
<input class="gdate-input-field">
<input type="hidden" name="gregorianDate">
```

### قمری
```html
<input class="hdate-input-field">
<input type="hidden" name="hijriDate">
```

---

## سازوکار تعطیلات
تعطیلات فقط یک‌بار و به صورت **شمسی** تعریف می‌شوند:

```js
{
  official: ["1404/09/01", "1404/09/12"],
  unofficial: ["1404/09/16"]
}
```

در هر حالت (شمسی، میلادی، قمری):
- تاریخ مقدار روز به شمسی تبدیل می‌شود  
- بررسی می‌شود که تعطیل رسمی یا غیررسمی هست یا نه  
- رنگ مناسب روی سلول اعمال می‌شود  

---

## دمو
فایل `index.html` حاوی یک نمونه کامل و زیبا از کاربرد تقویم است.

---

## لایسنس
MIT

---

## توسعه‌دهنده
- وب‌سایت: https://mahaleyeweb.ir/
- لینکدین: https://www.linkedin.com/in/saeid-mohammadzadeh-a1353b2a8/


# Persian Datepicker
A lightweight, dependency-free datepicker supporting **Jalali (Persian)**, **Gregorian**, and **Hijri** calendars — all powered by an accurate Jalali core.

---

## Why this project was created
Persian developers have long lacked a **native, correct, reliable Jalali calendar**.
Most existing datepickers suffer from:

- Jalali being only an optional addon, not a core system  
- Incorrect Jalali leap-year calculations  
- Dependency on jQuery → version conflicts break the datepicker  
- Needing separate plugins for Gregorian & Hijri calendars  
- No built-in holiday support  

### What makes this project unique?
✔ Fully built on top of a **true Jalali implementation**  
✔ Pure Vanilla JavaScript (no jQuery, no dependencies)  
✔ Accurate leap-year handling  
✔ Unified system: Jalali, Gregorian, and Hijri in one file  
✔ Holiday system: official (red) & unofficial (orange)  
✔ Even in Gregorian and Hijri modes, **Jalali holidays are highlighted**  
✔ Compatible with all frameworks: React, Vue, Angular, Blazor, ASP.NET, etc.  

---

## Features
- Jalali datepicker (`.date-input-field`)
- Gregorian datepicker (`.gdate-input-field`)
- Hijri datepicker (`.hdate-input-field`)
- Accurate conversion among all calendars
- Weekend detection:
  - Jalali → Friday
  - Gregorian → Sunday
  - Hijri → Friday
- ESC key to close
- Smooth UI with no flicker

---

## Installation
```html
<link rel="stylesheet" href="css/persiandatepicker.css">
<script src="js/persiandatepicker.js"></script>
```

Optional Persian font:
```html
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;900&display=swap" rel="stylesheet">
```

---

## Usage
### Jalali
```html
<input class="date-input-field">
<input type="hidden" name="jalaliDate">
```

### Gregorian
```html
<input class="gdate-input-field">
<input type="hidden" name="gregorianDate">
```

### Hijri
```html
<input class="hdate-input-field">
<input type="hidden" name="hijriDate">
```

---

## Holiday System
Holidays are defined **once** in Jalali:

```js
{
  official: ["1404/09/01", "1404/09/12"],
  unofficial: ["1404/09/16"]
}
```

Each calendar:
- Converts date → Jalali  
- Checks if this day is a holiday  
- Colors the cell accordingly  

This approach keeps behavior consistent and unique.

---

## Demo
See the `index.html` file for a complete demonstration.

---

## License
MIT

---

## Author
- Website: https://mahaleyeweb.ir/
- LinkedIn: https://www.linkedin.com/in/saeid-mohammadzadeh-a1353b2a8/

# التقويم الفارسي (Persian Datepicker)
مكوّن خفيف وسهل الاستخدام يدعم **التقويم الجلالي (الفارسي)**، **الميلادي** و **الهجري القمري** — وجميعها مبنية على نواة جلالية دقيقة وصحيحة.

---

## لماذا تم إنشاء هذا المشروع؟
تعاني تطبيقات الويب في المنطقة من غياب **تقويم جلالي أصيل ودقيق**.
المكوّنات المتوفرة غالباً تعاني من:

- بناء أساسي على التقويم الميلادي فقط  
- أخطاء في حساب السنوات الكبيسة الجلالية  
- الاعتماد على jQuery مما يسبب تعارض النسخ  
- الحاجة لاستخدام مكتبات مختلفة للتقويم الميلادي والقمري  
- عدم وجود دعم للعطل الرسمية وغير الرسمية  

### ما الذي يميز هذا المشروع؟
✔ مبني بالكامل على نواة جلالية حقيقية  
✔ بدون أي مكتبات خارجية (Vanilla JS)  
✔ حساب دقيق للسنوات الكبيسة  
✔ نظام موحّد: جلالي، ميلادي، هجري — في ملف واحد  
✔ دعم للعطل الرسمية (باللون الأحمر) وغير الرسمية (باللون البرتقالي)  
✔ حتى في الوضع الميلادي أو القمري يتم عرض **عطل التقويم الجلالي**  
✔ متوافق مع جميع الأطر: React, Vue, Angular, Blazor, ASP.NET  

---

## المزايا
- التقويم الجلالي: `.date-input-field`
- التقويم الميلادي: `.gdate-input-field`
- التقويم الهجري القمري: `.hdate-input-field`
- تحويل دقيق بين جميع التقويمات
- نهاية الأسبوع:
  - الجلالي → الجمعة
  - الميلادي → الأحد
  - القمري → الجمعة
- إغلاق بواسطة زر ESC  
- واجهة سلسة بدون أي وميض

---

## التثبيت
```html
<link rel="stylesheet" href="css/persiandatepicker.css">
<script src="js/persiandatepicker.js"></script>
```

---

## الاستخدام
### الجلالي
```html
<input class="date-input-field">
<input type="hidden" name="jalaliDate">
```

### الميلادي
```html
<input class="gdate-input-field">
<input type="hidden" name="gregorianDate">
```

### الهجري القمري
```html
<input class="hdate-input-field">
<input type="hidden" name="hijriDate">
```

---

## نظام العطل
تُعرَّف العطل **مرة واحدة** بصيغة جلالية:

```js
{
  official: ["1404/09/01", "1404/09/12"],
  unofficial: ["1404/09/16"]
}
```

كل تقويم يقوم بـ:
1. تحويل التاريخ إلى جلالي  
2. التحقق من كونه يوم عطلة  
3. تلوين الخلية بوضوح  

---

## العرض التجريبي
الملف `index.html` يحتوي على عرض كامل لجميع الميزات.

---

## الرخصة
MIT

---

## المطوّر
- الموقع: https://mahaleyeweb.ir/
- لينكد إن: https://www.linkedin.com/in/saeid-mohammadzadeh-a1353b2a8/

