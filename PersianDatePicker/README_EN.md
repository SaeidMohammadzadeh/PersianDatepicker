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
