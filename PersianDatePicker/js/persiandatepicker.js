/* persiandatepicker.js
   Complete JS for Jalali (date-input-field), Gregorian (gdate-input-field), and Hijri (hdate-input-field) pickers.
   - Week headers ordering:
     * Jalali: Saturday..Friday  (Friday = last column)
     * Gregorian: Monday..Sunday (Sunday = last column)
     * Hijri: Saturday..Friday   (Friday = last column)
   - Holidays: source Jalali strings; for Gregorian/Hijri we convert and mark equivalent Gregorian/Hijri cells.
   - Single shared container element: #jalaliDatepicker
   - Robust pointer/focus wiring with temporary prevent-hide flag to avoid flicker and race conditions.
   -Saeid Mohammadzadeh  - https://www.linkedin.com/in/saeid-mohammadzadeh-a1353b2a8/
   -MahaleyeWeb 2025 - https://MahaleyeWeb.ir
*/

/* utility */
function div(a, b) { return Math.floor(a / b); }

/* ---------- Converters: Jalali <-> Gregorian ---------- */
function toJalali(gy, gm, gd) {
    var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var jy;
    if (gy > 1600) { jy = 979; gy -= 1600; } else { jy = 0; gy -= 621; }
    var gy2 = (gm > 2) ? (gy + 1) : gy;
    var days = 365 * gy + div(gy2 + 3, 4) - div(gy2 + 99, 100) + div(gy2 + 399, 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * div(days, 12053); days %= 12053;
    jy += 4 * div(days, 1461); days %= 1461;
    if (days > 365) { jy += div(days - 1, 365); days = (days - 1) % 365; }
    var jm = (days < 186) ? 1 + div(days, 31) : 7 + div(days - 186, 30);
    var jd = (days < 186) ? 1 + (days % 31) : 1 + ((days - 186) % 30);
    return { jy: jy, jm: jm, jd: jd };
}

function toGregorian(jy, jm, jd) {
    jy += 1595;
    var days = -355668 + (365 * jy) + (div(jy, 33) * 8) + div((jy % 33 + 3), 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
    var gy = 400 * div(days, 146097); days %= 146097;
    if (days > 36524) { gy += 100 * div(--days, 36524); days %= 36524; if (days >= 365) days++; }
    gy += 4 * div(days, 1461); days %= 1461;
    if (days > 365) { gy += div(days - 1, 365); days = (days - 1) % 365; }
    var gd = days + 1;
    var sal_a = [31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var gm = 0;
    while (gm < 12 && gd > sal_a[gm]) { gd -= sal_a[gm]; gm++; }
    return new Date(gy, gm, gd);
}

/* ---------- Julian Day & Hijri (arithmetical approximation) ---------- */
function gregorianToJD(gy, gm, gd) {
    var a = Math.floor((14 - gm) / 12);
    var y = gy + 4800 - a;
    var m = gm + 12 * a - 3;
    var jd = gd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    return jd;
}

function jdToGregorian(jd) {
    var a = jd + 32044;
    var b = Math.floor((4 * a + 3) / 146097);
    var c = a - Math.floor((146097 * b) / 4);
    var d = Math.floor((4 * c + 3) / 1461);
    var e = c - Math.floor((1461 * d) / 4);
    var m = Math.floor((5 * e + 2) / 153);
    var day = e - Math.floor((153 * m + 2) / 5) + 1;
    var month = m + 3 - 12 * Math.floor(m / 10);
    var year = 100 * b + d - 4800 + Math.floor(m / 10);
    return new Date(year, month - 1, day);
}

function islamicToJD(hy, hm, hd) {
    // Tabular Islamic calendar (arithmetical approximation)
    var jd = hd + Math.ceil(29.5 * (hm - 1)) + (hy - 1) * 354 + Math.floor((3 + (11 * hy)) / 30) + 1948439 - 1;
    return Math.floor(jd);
}

function jdToIslamic(jd) {
    var jdAdj = Math.floor(jd);
    var days = jdAdj - 1948439 + 1;
    var year = Math.floor((30 * days + 10646) / 10631);
    var firstDayOfYear = islamicToJD(year, 1, 1);
    var month = Math.ceil((jdAdj - firstDayOfYear + 1) / 29.5);
    if (month < 1) month = 1;
    if (month > 12) month = 12;
    var firstDayOfMonth = islamicToJD(year, month, 1);
    var day = jdAdj - firstDayOfMonth + 1;
    return { hy: year, hm: month, hd: day };
}

function gregorianToHijri(gy, gm, gd) {
    var jd = gregorianToJD(gy, gm, gd);
    return jdToIslamic(jd);
}

function hijriToGregorian(hy, hm, hd) {
    var jd = islamicToJD(hy, hm, hd);
    return jdToGregorian(jd);
}

/* ---------- normalize helpers ---------- */
function pad(n) { return String(n).padStart(2, '0'); }
function normalizeYMD(y, m, d) { return `${y}/${pad(m)}/${pad(d)}`; }
function normalizeDateString(s) {
    if (!s || typeof s !== 'string') return null;
    var cleaned = s.trim().replace(/-/g, '/');
    var parts = cleaned.split('/');
    if (parts.length !== 3) return null;
    var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return normalizeYMD(y, m, d);
}

/* ---------- holidays (Jalali strings) ---------- */
function getHolidays() {
    return {
        official: ["1404/09/01", "1404/09/12", "1404/09/13"],
        unofficial: ["1404/09/16"]
    };
}

/* ---------- sync helpers ---------- */
window.syncJalaliDate = function (visibleInput, date) {
    var hidden = visibleInput ? visibleInput.nextElementSibling : null;
    if (!hidden) return;
    hidden.value = date;
    hidden.dispatchEvent(new Event('input', { bubbles: true }));
};
window.syncGregorianDate = function (visibleInput, date) {
    var hidden = visibleInput ? visibleInput.nextElementSibling : null;
    if (!hidden) return;
    hidden.value = date;
    hidden.dispatchEvent(new Event('input', { bubbles: true }));
};
window.syncHijriDate = function (visibleInput, date) {
    var hidden = visibleInput ? visibleInput.nextElementSibling : null;
    if (!hidden) return;
    hidden.value = date;
    hidden.dispatchEvent(new Event('input', { bubbles: true }));
};

/* ---------- constants (week ordering adjusted) ---------- */
const J_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const J_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"]; // Saturday..Friday (Friday = last)
const G_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const G_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // Monday..Sunday (Sunday = last)
const H_MONTHS_AR = ["محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذیقعده", "ذیحجه"];
const H_DAYS_AR_SHORT = ["س", "ح", "ن", "ث", "ر", "خ", "ج"]; // خلاصه: Sat..Fri (جمعه آخر)

/* ---------- Global pointerdown handler (bubble phase) ---------- */
if (!window._persianDatepickerGlobalPointerHandlerInstalled) {
    document.addEventListener('pointerdown', function (e) {
        const container = document.getElementById('jalaliDatepicker');
        if (!container) return;
        if (window._persianDatepickerPreventHide) return;
        if (container.contains(e.target)) return;
        if (e.target && e.target.matches && (e.target.matches('input.date-input-field') || e.target.matches('input.gdate-input-field') || e.target.matches('input.hdate-input-field'))) {
            return;
        }
        container.classList.add('hidden');
        container.setAttribute('aria-hidden', 'true');
    }, false);
    window._persianDatepickerGlobalPointerHandlerInstalled = true;
}

/* ---------------- JalaliDatePicker ---------------- */
class JalaliDatePicker {
    constructor(container) {
        this.container = container;
        this.input = null;
        const now = new Date();
        this.today = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        this.currentJY = this.today.jy;
        this.currentJM = this.today.jm;
        this.selectedDate = null;
        this.holidays = getHolidays();
        this.inputSelectedMap = new WeakMap();
    }

    attachTo(input) {
        if (!input) return;
        this.input = input;
        const val = (input.value || '').trim();
        if (val && /^\d{3,4}\/\d{1,2}\/\d{1,2}$/.test(val)) {
            const parts = val.split('/').map(s => parseInt(s, 10));
            if (parts.length === 3 && !isNaN(parts[0])) {
                this.currentJY = parts[0];
                this.currentJM = parts[1];
                this.selectedDate = normalizeYMD(parts[0], parts[1], parts[2]);
            }
        } else {
            if (this.inputSelectedMap.has(input)) {
                const prev = this.inputSelectedMap.get(input);
                if (prev) {
                    if (prev.selectedDate) this.selectedDate = prev.selectedDate;
                    if (prev.currentJY) this.currentJY = prev.currentJY;
                    if (prev.currentJM) this.currentJM = prev.currentJM;
                }
            }
        }
        this.show();
    }

    _repositionHandler() {
        if (!this.input) return;
        const rect = this.input.getBoundingClientRect();
        const dpWidth = this.container.offsetWidth || 320;
        const margin = 8;
        let left = rect.right + window.scrollX - dpWidth;
        if (left < margin) left = margin;
        if (left + dpWidth > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - dpWidth - margin);
        const top = rect.bottom + window.scrollY + 6;
        this.container.style.left = `${left}px`;
        this.container.style.top = `${top}px`;
    }

    show() {
        if (!this.input) return;
        this.render();
        const rect = this.input.getBoundingClientRect();
        const wasHidden = this.container.classList.contains('hidden');
        if (wasHidden) {
            this.container.classList.remove('hidden');
            this.container.style.visibility = 'hidden';
            this.container.setAttribute('aria-hidden', 'false');
        }
        const dpWidth = this.container.offsetWidth || 320;
        const margin = 8;
        let left = rect.right + window.scrollX - dpWidth;
        if (left < margin) left = margin;
        if (left + dpWidth > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - dpWidth - margin);
        const top = rect.bottom + window.scrollY + 6;
        this.container.style.top = `${top}px`;
        this.container.style.left = `${left}px`;
        if (wasHidden) this.container.style.visibility = '';
        this.container.classList.remove('hidden');
        this.container.setAttribute('aria-hidden', 'false');
        if (!this._boundReposition) {
            this._boundReposition = this._repositionHandler.bind(this);
            window.addEventListener('resize', this._boundReposition);
            window.addEventListener('scroll', this._boundReposition, true);
        }
    }

    hide() {
        if (this.input) {
            this.inputSelectedMap.set(this.input, {
                selectedDate: this.selectedDate,
                currentJY: this.currentJY,
                currentJM: this.currentJM
            });
        }
        this.container.classList.add('hidden');
        this.container.setAttribute('aria-hidden', 'true');
        if (this._boundReposition) {
            window.removeEventListener('resize', this._boundReposition);
            window.removeEventListener('scroll', this._boundReposition, true);
            this._boundReposition = null;
        }
    }

    _makeTodayLabel() {
        const j = this.today;
        const g = toGregorian(j.jy, j.jm, j.jd);
        const weekNames = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];
        const wName = weekNames[g.getDay()];
        const jy = j.jy, jm = pad(j.jm), jd = pad(j.jd);
        return `برو به امروز ${wName} ${jy}/${jm}/${jd}`;
    }

    _goToSpecificToday() {
        const j = this.today;
        this.currentJY = j.jy; this.currentJM = j.jm;
        this.selectedDate = normalizeYMD(j.jy, j.jm, j.jd);
        if (this.input) { this.input.value = this.selectedDate; window.syncJalaliDate(this.input, this.selectedDate); }
        this.render(); this.hide();
    }

    render() {
        this.container.innerHTML = '';
        // header
        const hdr = document.createElement('div'); hdr.className = 'pdhheader';
        const prevYear = document.createElement('button'); prevYear.textContent = '<<'; prevYear.type = 'button';
        prevYear.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeYear(-1); });
        const prevMonth = document.createElement('button'); prevMonth.textContent = '<'; prevMonth.type = 'button';
        prevMonth.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeMonth(-1); });
        const yearSel = document.createElement('select');
        for (let y = this.currentJY - 10; y <= this.currentJY + 10; y++) { const o = document.createElement('option'); o.value = y; o.textContent = y; if (y === this.currentJY) o.selected = true; yearSel.appendChild(o); }
        yearSel.addEventListener('change', (e) => { this.currentJY = parseInt(e.target.value, 10); this.render(); });
        const monthSel = document.createElement('select');
        J_MONTHS.forEach((mname, idx) => { const o = document.createElement('option'); o.value = idx + 1; o.textContent = mname; if (idx + 1 === this.currentJM) o.selected = true; monthSel.appendChild(o); });
        monthSel.addEventListener('change', (e) => { this.currentJM = parseInt(e.target.value, 10); this.render(); });
        const nextMonth = document.createElement('button'); nextMonth.textContent = '>'; nextMonth.type = 'button';
        nextMonth.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeMonth(1); });
        const nextYear = document.createElement('button'); nextYear.textContent = '>>'; nextYear.type = 'button';
        nextYear.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeYear(1); });
        hdr.append(prevYear, prevMonth, yearSel, monthSel, nextMonth, nextYear);
        this.container.appendChild(hdr);

        // week header (Jalali: Saturday..Friday, Friday last)
        const weekHeader = document.createElement('div'); weekHeader.className = 'calendar-grid';
        J_DAYS.forEach((d, i) => { const dh = document.createElement('div'); dh.className = 'day-pdhheader'; dh.textContent = d; if (i === 6) dh.classList.add('friday'); weekHeader.appendChild(dh); });
        this.container.appendChild(weekHeader);

        // grid
        const grid = document.createElement('div'); grid.className = 'calendar-grid';
        const firstG = toGregorian(this.currentJY, this.currentJM, 1);
        const jsDay = firstG.getDay(); // 0=Sun..6=Sat
        const emptyCount = (jsDay + 1) % 7; // map to Saturday-first columns
        for (let i = 0; i < emptyCount; i++) { const e = document.createElement('div'); e.className = 'empty-cell'; grid.appendChild(e); }

        const daysInMonth = this._daysInJMonth(this.currentJY, this.currentJM);
        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div'); cell.className = 'day-cell'; cell.textContent = d;
            const fd = normalizeYMD(this.currentJY, this.currentJM, d); cell.dataset.date = fd;
            const gOfDay = toGregorian(this.currentJY, this.currentJM, d);
            // mark Friday in Jalali calendar logic (Friday = Gregorian getDay() === 5 -> map to last column)
            if (gOfDay.getDay() === 5) cell.classList.add('holiday-official');

            if (this.holidays.official.indexOf(fd) !== -1) cell.classList.add('holiday-official');
            else if (this.holidays.unofficial.indexOf(fd) !== -1) cell.classList.add('holiday-unofficial');

            if (this.currentJY === this.today.jy && this.currentJM === this.today.jm && d === this.today.jd) cell.classList.add('today');
            if (this.selectedDate === fd) cell.classList.add('selected-day');

            cell.addEventListener('click', (ev) => { ev.stopPropagation(); this.selectedDate = fd; if (this.input) this.input.value = fd; if (this.input) window.syncJalaliDate(this.input, fd); if (this.input) this.inputSelectedMap.set(this.input, { selectedDate: this.selectedDate, currentJY: this.currentJY, currentJM: this.currentJM }); this.render(); this.hide(); });
            grid.appendChild(cell);
        }
        this.container.appendChild(grid);

        const btn = document.createElement('button'); btn.className = 'go-today-btn'; btn.type = 'button'; btn.textContent = this._makeTodayLabel();
        btn.addEventListener('click', (ev) => { ev.stopPropagation(); this._goToSpecificToday(); });
        this.container.appendChild(btn);
    }

    changeMonth(step) { this.currentJM += step; if (this.currentJM > 12) { this.currentJM = 1; this.currentJY++; } if (this.currentJM < 1) { this.currentJM = 12; this.currentJY--; } this.render(); }
    changeYear(step) { this.currentJY += step; this.render(); }
    _daysInJMonth(y, m) { if (m <= 6) return 31; if (m <= 11) return 30; return this._isLeapJ(y) ? 30 : 29; }
    _isLeapJ(jy) { return [1, 5, 9, 13, 17, 22, 26, 30].includes(jy % 33); }
}

/* ---------------- GregorianDatePicker ---------------- */
class GregorianDatePicker {
    constructor(container) {
        this.container = container;
        this.input = null;
        const now = new Date();
        this.today = { gy: now.getFullYear(), gm: now.getMonth() + 1, gd: now.getDate() };
        this.currentGY = this.today.gy;
        this.currentGM = this.today.gm;
        this.selectedDate = null;
        this.holidays = getHolidays(); // Jalali strings
        this.inputSelectedMap = new WeakMap();
        this._computeHolidayGregorianSet();
    }

    _computeHolidayGregorianSet() {
        this.holidayGregOfficial = new Set();
        this.holidayGregUnofficial = new Set();
        try {
            (this.holidays.official || []).forEach(jstr => {
                const parts = jstr.split('/').map(x => parseInt(x, 10));
                if (parts.length === 3 && !isNaN(parts[0])) {
                    const gd = toGregorian(parts[0], parts[1], parts[2]);
                    const gs = normalizeYMD(gd.getFullYear(), gd.getMonth() + 1, gd.getDate());
                    this.holidayGregOfficial.add(gs);
                }
            });
            (this.holidays.unofficial || []).forEach(jstr => {
                const parts = jstr.split('/').map(x => parseInt(x, 10));
                if (parts.length === 3 && !isNaN(parts[0])) {
                    const gd = toGregorian(parts[0], parts[1], parts[2]);
                    const gs = normalizeYMD(gd.getFullYear(), gd.getMonth() + 1, gd.getDate());
                    this.holidayGregUnofficial.add(gs);
                }
            });
        } catch (e) {
            this.holidayGregOfficial = new Set();
            this.holidayGregUnofficial = new Set();
        }
    }

    attachTo(input) {
        if (!input) return;
        this.input = input;
        const val = (input.value || '').trim();
        if (val && /^\d{3,4}\/\d{1,2}\/\d{1,2}$/.test(val)) {
            const parts = val.split('/').map(s => parseInt(s, 10));
            if (parts.length === 3 && !isNaN(parts[0])) {
                this.currentGY = parts[0];
                this.currentGM = parts[1];
                this.selectedDate = normalizeYMD(parts[0], parts[1], parts[2]);
            }
        } else {
            if (this.inputSelectedMap.has(input)) {
                const prev = this.inputSelectedMap.get(input);
                if (prev) {
                    if (prev.selectedDate) this.selectedDate = prev.selectedDate;
                    if (prev.currentGY) this.currentGY = prev.currentGY;
                    if (prev.currentGM) this.currentGM = prev.currentGM;
                }
            }
        }
        this._computeHolidayGregorianSet();
        this.show();
    }

    _repositionHandler() {
        if (!this.input) return;
        const rect = this.input.getBoundingClientRect();
        const dpWidth = this.container.offsetWidth || 320;
        const margin = 8;
        let left = rect.right + window.scrollX - dpWidth;
        if (left < margin) left = margin;
        if (left + dpWidth > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - dpWidth - margin);
        const top = rect.bottom + window.scrollY + 6;
        this.container.style.left = `${left}px`;
        this.container.style.top = `${top}px`;
    }

    show() {
        if (!this.input) return;
        this.render();
        const rect = this.input.getBoundingClientRect();
        const wasHidden = this.container.classList.contains('hidden');
        if (wasHidden) {
            this.container.classList.remove('hidden');
            this.container.style.visibility = 'hidden';
            this.container.setAttribute('aria-hidden', 'false');
        }
        const dpWidth = this.container.offsetWidth || 320;
        const margin = 8;
        let left = rect.right + window.scrollX - dpWidth;
        if (left < margin) left = margin;
        if (left + dpWidth > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - dpWidth - margin);
        const top = rect.bottom + window.scrollY + 6;
        this.container.style.top = `${top}px`;
        this.container.style.left = `${left}px`;
        if (wasHidden) this.container.style.visibility = '';
        this.container.classList.remove('hidden');
        this.container.setAttribute('aria-hidden', 'false');
        if (!this._boundReposition) {
            this._boundReposition = this._repositionHandler.bind(this);
            window.addEventListener('resize', this._boundReposition);
            window.addEventListener('scroll', this._boundReposition, true);
        }
    }

    hide() {
        if (this.input) {
            this.inputSelectedMap.set(this.input, {
                selectedDate: this.selectedDate,
                currentGY: this.currentGY,
                currentGM: this.currentGM
            });
        }
        this.container.classList.add('hidden');
        this.container.setAttribute('aria-hidden', 'true');
        if (this._boundReposition) {
            window.removeEventListener('resize', this._boundReposition);
            window.removeEventListener('scroll', this._boundReposition, true);
            this._boundReposition = null;
        }
    }

    _makeTodayLabel() {
        const g = this.today;
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const wd = new Date(g.gy, g.gm - 1, g.gd).getDay(); // 0=Sun..6=Sat
        // map JS getDay to index in dayNames (Mon..Sun)
        const mappedIndex = (wd + 6) % 7; // transforms 0(Sun)->6,1(Mon)->0, ...
        const wdName = dayNames[mappedIndex] || 'today';
        return `go to today ${wdName} ${g.gy}/${pad(g.gm)}/${pad(g.gd)}`;
    }

    _goToSpecificToday() {
        const g = this.today;
        this.currentGY = g.gy; this.currentGM = g.gm;
        this.selectedDate = normalizeYMD(g.gy, g.gm, g.gd);
        if (this.input) { this.input.value = this.selectedDate; window.syncGregorianDate(this.input, this.selectedDate); }
        this.render(); this.hide();
    }

    render() {
        this.container.innerHTML = '';
        const hdr = document.createElement('div'); hdr.className = 'pdhheader';
        const prevYear = document.createElement('button'); prevYear.textContent = '<<'; prevYear.type = 'button';
        prevYear.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeYear(-1); });
        const prevMonth = document.createElement('button'); prevMonth.textContent = '<'; prevMonth.type = 'button';
        prevMonth.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeMonth(-1); });
        const yearSel = document.createElement('select');
        for (let y = this.currentGY - 10; y <= this.currentGY + 10; y++) { const o = document.createElement('option'); o.value = y; o.textContent = y; if (y === this.currentGY) o.selected = true; yearSel.appendChild(o); }
        yearSel.addEventListener('change', (e) => { this.currentGY = parseInt(e.target.value, 10); this.render(); });
        const monthSel = document.createElement('select');
        G_MONTHS.forEach((mname, idx) => { const o = document.createElement('option'); o.value = idx + 1; o.textContent = mname; if (idx + 1 === this.currentGM) o.selected = true; monthSel.appendChild(o); });
        monthSel.addEventListener('change', (e) => { this.currentGM = parseInt(e.target.value, 10); this.render(); });
        const nextMonth = document.createElement('button'); nextMonth.textContent = '>'; nextMonth.type = 'button';
        nextMonth.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeMonth(1); });
        const nextYear = document.createElement('button'); nextYear.textContent = '>>'; nextYear.type = 'button';
        nextYear.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeYear(1); });
        hdr.append(prevYear, prevMonth, yearSel, monthSel, nextMonth, nextYear);
        this.container.appendChild(hdr);

        // week header (Gregorian: Mon..Sun, Sunday last -> mark last column .friday)
        const weekHeader = document.createElement('div'); weekHeader.className = 'calendar-grid';
        for (let i = 0; i < 7; i++) {
            const dh = document.createElement('div');
            dh.className = 'day-pdhheader';
            dh.textContent = G_DAYS[i];
            if (i === 6) dh.classList.add('friday'); // Sunday column styled as weekend
            weekHeader.appendChild(dh);
        }
        this.container.appendChild(weekHeader);

        // grid (align to Mon..Sun)
        const grid = document.createElement('div'); grid.className = 'calendar-grid';
        const first = new Date(this.currentGY, this.currentGM - 1, 1);
        const startIndex = (first.getDay() + 6) % 7; // map JS getDay to Mon..Sun index
        for (let i = 0; i < startIndex; i++) { const e = document.createElement('div'); e.className = 'empty-cell'; grid.appendChild(e); }

        const daysInMonth = new Date(this.currentGY, this.currentGM, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div'); cell.className = 'day-cell'; cell.textContent = d;
            const fd = normalizeYMD(this.currentGY, this.currentGM, d); cell.dataset.date = fd;

            // holiday marking by converted Jalali holidays -> greg set
            if (this.holidayGregOfficial && this.holidayGregOfficial.has(fd)) {
                cell.classList.add('holiday-official');
            } else if (this.holidayGregUnofficial && this.holidayGregUnofficial.has(fd)) {
                cell.classList.add('holiday-unofficial');
            } else {
                // fallback: convert this greg date to jalali and check original lists
                const jal = toJalali(this.currentGY, this.currentGM, d);
                const jalStr = normalizeYMD(jal.jy, jal.jm, jal.jd);
                if ((this.holidays.official || []).indexOf(jalStr) !== -1) cell.classList.add('holiday-official');
                else if ((this.holidays.unofficial || []).indexOf(jalStr) !== -1) cell.classList.add('holiday-unofficial');
            }

            // Sunday (JS getDay() === 0) should be final column; ensure it's styled as official
            const gDayIndex = new Date(this.currentGY, this.currentGM - 1, d).getDay();
            if (gDayIndex === 0) {
                if (!cell.classList.contains('holiday-unofficial')) cell.classList.add('holiday-official');
            }

            if (this.currentGY === this.today.gy && this.currentGM === this.today.gm && d === this.today.gd) cell.classList.add('today');
            if (this.selectedDate === fd) cell.classList.add('selected-day');

            cell.addEventListener('click', (ev) => { ev.stopPropagation(); this.selectedDate = fd; if (this.input) { this.input.value = fd; window.syncGregorianDate(this.input, fd); } if (this.input) this.inputSelectedMap.set(this.input, { selectedDate: this.selectedDate, currentGY: this.currentGY, currentGM: this.currentGM }); this.render(); this.hide(); });

            grid.appendChild(cell);
        }
        this.container.appendChild(grid);

        const btn = document.createElement('button'); btn.className = 'go-today-btn'; btn.type = 'button'; btn.textContent = this._makeTodayLabel();
        btn.addEventListener('click', (ev) => { ev.stopPropagation(); this._goToSpecificToday(); });
        this.container.appendChild(btn);
    }

    changeMonth(step) { this.currentGM += step; if (this.currentGM > 12) { this.currentGM = 1; this.currentGY++; } if (this.currentGM < 1) { this.currentGM = 12; this.currentGY--; } this.render(); }
    changeYear(step) { this.currentGY += step; this.render(); }
}

/* ---------------- HijriDatePicker ---------------- */
class HijriDatePicker {
    constructor(container) {
        this.container = container;
        this.input = null;
        const now = new Date();
        const hj = gregorianToHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
        this.today = { hy: hj.hy, hm: hj.hm, hd: hj.hd, gDate: now };
        this.currentHY = this.today.hy;
        this.currentHM = this.today.hm;
        this.selectedDate = null;
        this.holidays = getHolidays(); // Jalali strings
        this.inputSelectedMap = new WeakMap();
        this._computeHolidayHijriSet();
    }

    _computeHolidayHijriSet() {
        this.holidayHijriOfficial = new Set();
        this.holidayHijriUnofficial = new Set();
        try {
            (this.holidays.official || []).forEach(jstr => {
                const parts = jstr.split('/').map(x => parseInt(x, 10));
                if (parts.length === 3 && !isNaN(parts[0])) {
                    const gd = toGregorian(parts[0], parts[1], parts[2]);
                    const hij = gregorianToHijri(gd.getFullYear(), gd.getMonth() + 1, gd.getDate());
                    const hs = normalizeYMD(hij.hy, hij.hm, hij.hd);
                    this.holidayHijriOfficial.add(hs);
                }
            });
            (this.holidays.unofficial || []).forEach(jstr => {
                const parts = jstr.split('/').map(x => parseInt(x, 10));
                if (parts.length === 3 && !isNaN(parts[0])) {
                    const gd = toGregorian(parts[0], parts[1], parts[2]);
                    const hij = gregorianToHijri(gd.getFullYear(), gd.getMonth() + 1, gd.getDate());
                    const hs = normalizeYMD(hij.hy, hij.hm, hij.hd);
                    this.holidayHijriUnofficial.add(hs);
                }
            });
        } catch (e) {
            this.holidayHijriOfficial = new Set();
            this.holidayHijriUnofficial = new Set();
        }
    }

    attachTo(input) {
        if (!input) return;
        this.input = input;
        const val = (input.value || '').trim();
        if (val && /^\d{3,4}\/\d{1,2}\/\d{1,2}$/.test(val)) {
            const parts = val.split('/').map(s => parseInt(s, 10));
            if (parts.length === 3 && !isNaN(parts[0])) {
                this.currentHY = parts[0];
                this.currentHM = parts[1];
                this.selectedDate = normalizeYMD(parts[0], parts[1], parts[2]);
            }
        } else {
            if (this.inputSelectedMap.has(input)) {
                const prev = this.inputSelectedMap.get(input);
                if (prev) {
                    if (prev.selectedDate) this.selectedDate = prev.selectedDate;
                    if (prev.currentHY) this.currentHY = prev.currentHY;
                    if (prev.currentHM) this.currentHM = prev.currentHM;
                }
            }
        }
        this._computeHolidayHijriSet();
        this.show();
    }

    _repositionHandler() {
        if (!this.input) return;
        const rect = this.input.getBoundingClientRect();
        const dpWidth = this.container.offsetWidth || 320;
        const margin = 8;
        let left = rect.right + window.scrollX - dpWidth;
        if (left < margin) left = margin;
        if (left + dpWidth > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - dpWidth - margin);
        const top = rect.bottom + window.scrollY + 6;
        this.container.style.left = `${left}px`;
        this.container.style.top = `${top}px`;
    }

    show() {
        if (!this.input) return;
        this.render();
        const rect = this.input.getBoundingClientRect();
        const wasHidden = this.container.classList.contains('hidden');
        if (wasHidden) {
            this.container.classList.remove('hidden');
            this.container.style.visibility = 'hidden';
            this.container.setAttribute('aria-hidden', 'false');
        }
        const dpWidth = this.container.offsetWidth || 320;
        const margin = 8;
        let left = rect.right + window.scrollX - dpWidth;
        if (left < margin) left = margin;
        if (left + dpWidth > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - dpWidth - margin);
        const top = rect.bottom + window.scrollY + 6;
        this.container.style.top = `${top}px`;
        this.container.style.left = `${left}px`;
        if (wasHidden) this.container.style.visibility = '';
        this.container.classList.remove('hidden');
        this.container.setAttribute('aria-hidden', 'false');
        if (!this._boundReposition) {
            this._boundReposition = this._repositionHandler.bind(this);
            window.addEventListener('resize', this._boundReposition);
            window.addEventListener('scroll', this._boundReposition, true);
        }
    }

    hide() {
        if (this.input) {
            this.inputSelectedMap.set(this.input, {
                selectedDate: this.selectedDate,
                currentHY: this.currentHY,
                currentHM: this.currentHM
            });
        }
        this.container.classList.add('hidden');
        this.container.setAttribute('aria-hidden', 'true');
        if (this._boundReposition) {
            window.removeEventListener('resize', this._boundReposition);
            window.removeEventListener('scroll', this._boundReposition, true);
            this._boundReposition = null;
        }
    }

    _makeTodayLabel() {
        const g = this.today.gDate;
        const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const wd = g.getDay();
        const wdAr = dayNamesAr[wd] || 'اليوم';
        const hy = this.today.hy, hm = pad(this.today.hm), hd = pad(this.today.hd);
        return `اذهب إلى اليوم ${wdAr} ${hy}/${hm}/${hd}`;
    }

    _goToSpecificToday() {
        const t = this.today;
        this.currentHY = t.hy; this.currentHM = t.hm;
        this.selectedDate = normalizeYMD(t.hy, t.hm, t.hd);
        if (this.input) { this.input.value = this.selectedDate; window.syncHijriDate(this.input, this.selectedDate); }
        this.render(); this.hide();
    }

    render() {
        this.container.innerHTML = '';
        const hdr = document.createElement('div'); hdr.className = 'pdhheader';
        const prevYear = document.createElement('button'); prevYear.textContent = '<<'; prevYear.type = 'button';
        prevYear.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeYear(-1); });
        const prevMonth = document.createElement('button'); prevMonth.textContent = '<'; prevMonth.type = 'button';
        prevMonth.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeMonth(-1); });
        const yearSel = document.createElement('select');
        for (let y = this.currentHY - 10; y <= this.currentHY + 10; y++) { const o = document.createElement('option'); o.value = y; o.textContent = y; if (y === this.currentHY) o.selected = true; yearSel.appendChild(o); }
        yearSel.addEventListener('change', (e) => { this.currentHY = parseInt(e.target.value, 10); this.render(); });
        const monthSel = document.createElement('select');
        H_MONTHS_AR.forEach((mname, idx) => { const o = document.createElement('option'); o.value = idx + 1; o.textContent = mname; if (idx + 1 === this.currentHM) o.selected = true; monthSel.appendChild(o); });
        monthSel.addEventListener('change', (e) => { this.currentHM = parseInt(e.target.value, 10); this.render(); });
        const nextMonth = document.createElement('button'); nextMonth.textContent = '>'; nextMonth.type = 'button';
        nextMonth.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeMonth(1); });
        const nextYear = document.createElement('button'); nextYear.textContent = '>>'; nextYear.type = 'button';
        nextYear.addEventListener('click', (ev) => { ev.stopPropagation(); this.changeYear(1); });
        hdr.append(prevYear, prevMonth, yearSel, monthSel, nextMonth, nextYear);
        this.container.appendChild(hdr);

        // week header (Hijri: Sat..Fri, Friday last)
        const weekHeader = document.createElement('div'); weekHeader.className = 'calendar-grid';
        for (let i = 0; i < 7; i++) {
            const dh = document.createElement('div');
            dh.className = 'day-pdhheader';
            dh.textContent = H_DAYS_AR_SHORT[i];
            if (i === 6) dh.classList.add('friday'); // Friday last
            weekHeader.appendChild(dh);
        }
        this.container.appendChild(weekHeader);

        // grid: determine first weekday by converting hijri 1 -> gregorian weekday
        const grid = document.createElement('div'); grid.className = 'calendar-grid';
        const firstG = hijriToGregorian(this.currentHY, this.currentHM, 1); // Date
        const startIndex = (firstG.getDay() + 1) % 7; // map JS getDay to Sat..Fri index
        for (let i = 0; i < startIndex; i++) { const e = document.createElement('div'); e.className = 'empty-cell'; grid.appendChild(e); }

        // days in hijri month: compute via next month difference
        let daysInMonth = 30;
        try {
            const nextG = hijriToGregorian(this.currentHY, this.currentHM + 1, 1);
            const diff = Math.round((nextG.getTime() - firstG.getTime()) / (1000 * 60 * 60 * 24));
            if (diff > 0 && diff < 40) daysInMonth = diff;
        } catch (e) {
            daysInMonth = 30;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div'); cell.className = 'day-cell'; cell.textContent = d;
            const fd = normalizeYMD(this.currentHY, this.currentHM, d);
            cell.dataset.date = fd;

            if (this.holidayHijriOfficial && this.holidayHijriOfficial.has(fd)) cell.classList.add('holiday-official');
            else if (this.holidayHijriUnofficial && this.holidayHijriUnofficial.has(fd)) cell.classList.add('holiday-unofficial');

            // weekend: convert to gregorian and check weekday == Friday (5)
            const gOfDay = hijriToGregorian(this.currentHY, this.currentHM, d);
            if (gOfDay && gOfDay.getDay && gOfDay.getDay() === 5) {
                if (!cell.classList.contains('holiday-unofficial')) cell.classList.add('holiday-official');
            }

            if (this.currentHY === this.today.hy && this.currentHM === this.today.hm && d === this.today.hd) cell.classList.add('today');
            if (this.selectedDate === fd) cell.classList.add('selected-day');

            cell.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.selectedDate = fd;
                if (this.input) { this.input.value = fd; window.syncHijriDate(this.input, fd); }
                if (this.input) this.inputSelectedMap.set(this.input, { selectedDate: this.selectedDate, currentHY: this.currentHY, currentHM: this.currentHM });
                this.render();
                this.hide();
            });

            grid.appendChild(cell);
        }

        this.container.appendChild(grid);

        const btn = document.createElement('button'); btn.className = 'go-today-btn'; btn.type = 'button'; btn.textContent = this._makeTodayLabel();
        btn.addEventListener('click', (ev) => { ev.stopPropagation(); this._goToSpecificToday(); });
        this.container.appendChild(btn);
    }

    changeMonth(step) {
        this.currentHM += step;
        while (this.currentHM > 12) { this.currentHM -= 12; this.currentHY++; }
        while (this.currentHM < 1) { this.currentHM += 12; this.currentHY--; }
        this.render();
    }

    changeYear(step) { this.currentHY += step; this.render(); }
}

/* ------------- wire inputs & init ------------- */
window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('jalaliDatepicker');
    if (!container) return;

    const jalaliDp = new JalaliDatePicker(container);
    const gregDp = (typeof GregorianDatePicker !== 'undefined') ? new GregorianDatePicker(container) : null;
    const hijriDp = new HijriDatePicker(container);

    function preventGlobalHideTemporarily() {
        window._persianDatepickerPreventHide = true;
        setTimeout(() => { window._persianDatepickerPreventHide = false; }, 50);
    }

    document.querySelectorAll('.date-input-field').forEach(inp => {
        inp.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            preventGlobalHideTemporarily();
            jalaliDp.attachTo(inp);
            setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (ex) { inp.focus(); } }, 0);
        });
        inp.addEventListener('focus', (e) => { e.stopPropagation(); preventGlobalHideTemporarily(); jalaliDp.attachTo(inp); });
    });

    if (gregDp) {
        document.querySelectorAll('.gdate-input-field').forEach(inp => {
            inp.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                preventGlobalHideTemporarily();
                gregDp.attachTo(inp);
                setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (ex) { inp.focus(); } }, 0);
            });
            inp.addEventListener('focus', (e) => { e.stopPropagation(); preventGlobalHideTemporarily(); gregDp.attachTo(inp); });
        });
    }

    document.querySelectorAll('.hdate-input-field').forEach(inp => {
        inp.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            preventGlobalHideTemporarily();
            hijriDp.attachTo(inp);
            setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (ex) { inp.focus(); } }, 0);
        });
        inp.addEventListener('focus', (e) => { e.stopPropagation(); preventGlobalHideTemporarily(); hijriDp.attachTo(inp); });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (container) container.classList.add('hidden');
            container.setAttribute('aria-hidden', 'true');
        }
    });
});

/* optional init function */
function initJalaliDatepicker() {
    const container = document.getElementById('jalaliDatepicker');
    if (!container) { console.warn('jalaliDatepicker container not found'); return; }

    const jalaliDp = new JalaliDatePicker(container);
    const gregDp = (typeof GregorianDatePicker !== 'undefined') ? new GregorianDatePicker(container) : null;
    const hijriDp = new HijriDatePicker(container);

    document.querySelectorAll('.date-input-field').forEach(inp => {
        inp.addEventListener('pointerdown', (e) => { e.stopPropagation(); jalaliDp.attachTo(inp); setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (ex) { inp.focus(); } }, 0); });
        inp.addEventListener('focus', (e) => { e.stopPropagation(); jalaliDp.attachTo(inp); });
    });

    if (gregDp) {
        document.querySelectorAll('.gdate-input-field').forEach(inp => {
            inp.addEventListener('pointerdown', (e) => { e.stopPropagation(); gregDp.attachTo(inp); setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (ex) { inp.focus(); } }, 0); });
            inp.addEventListener('focus', (e) => { e.stopPropagation(); gregDp.attachTo(inp); });
        });
    }

    document.querySelectorAll('.hdate-input-field').forEach(inp => {
        inp.addEventListener('pointerdown', (e) => { e.stopPropagation(); hijriDp.attachTo(inp); setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (ex) { inp.focus(); } }, 0); });
        inp.addEventListener('focus', (e) => { e.stopPropagation(); hijriDp.attachTo(inp); });
    });
}
