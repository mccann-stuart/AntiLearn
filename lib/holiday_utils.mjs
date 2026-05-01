const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

// Bolt Optimization: Replace regex and intermediate array allocations with manual charCode checking and direct boundary evaluations.
function isValidISODateString(dateStr) {
    if (typeof dateStr !== 'string' || dateStr.length !== 10) return false;

    // Fast fail on missing hyphens
    if (dateStr.charCodeAt(4) !== 45 || dateStr.charCodeAt(7) !== 45) return false;

    const y1 = dateStr.charCodeAt(0), y2 = dateStr.charCodeAt(1), y3 = dateStr.charCodeAt(2), y4 = dateStr.charCodeAt(3);
    const m1 = dateStr.charCodeAt(5), m2 = dateStr.charCodeAt(6);
    const d1 = dateStr.charCodeAt(8), d2 = dateStr.charCodeAt(9);

    if (y1 < 48 || y1 > 57 || y2 < 48 || y2 > 57 || y3 < 48 || y3 > 57 || y4 < 48 || y4 > 57) return false;
    if (m1 < 48 || m1 > 57 || m2 < 48 || m2 > 57) return false;
    if (d1 < 48 || d1 > 57 || d2 < 48 || d2 > 57) return false;

    const year = (y1 - 48) * 1000 + (y2 - 48) * 100 + (y3 - 48) * 10 + (y4 - 48);
    const month = (m1 - 48) * 10 + (m2 - 48);
    const day = (d1 - 48) * 10 + (d2 - 48);

    if (year < 1000 || month < 1 || month > 12 || day < 1) return false;

    if (month === 2) {
        return day <= (isLeapYear(year) ? 29 : 28);
    } else if (month === 4 || month === 6 || month === 9 || month === 11) {
        return day <= 30;
    }
    return day <= 31;
}

// Bolt Optimization: Replace `.map().filter(Boolean)` with a single `for` loop
// and a pre-allocated array to avoid intermediate array allocations and GC overhead.
function normalizeCalendarific(holidays) {
    if (!Array.isArray(holidays)) return [];
    const result = new Array(holidays.length);
    let count = 0;

    for (let i = 0; i < holidays.length; i++) {
        const holiday = holidays[i];
        const dateIso = holiday && holiday.date ? holiday.date.iso : null;
        if (typeof dateIso !== 'string') continue;

        const date = dateIso.slice(0, 10);
        if (!isValidISODateString(date)) continue;

        const name = typeof holiday.name === 'string' ? holiday.name : 'Holiday';
        const type = Array.isArray(holiday.type)
            ? holiday.type[0]
            : (typeof holiday.type === 'string' ? holiday.type : 'national');

        result[count++] = { date, name, type, source: 'calendarific' };
    }

    result.length = count;
    return result;
}

// Bolt Optimization: Replace `.map().filter(Boolean)` with a single `for` loop
// and a pre-allocated array to avoid intermediate array allocations and GC overhead.
function normalizeTallyfy(holidays) {
    if (!Array.isArray(holidays)) return [];
    const result = new Array(holidays.length);
    let count = 0;

    for (let i = 0; i < holidays.length; i++) {
        const holiday = holidays[i];
        const date = holiday && typeof holiday.date === 'string' ? holiday.date : null;
        if (!isValidISODateString(date)) continue;
        const name = typeof holiday.name === 'string' ? holiday.name : 'Holiday';
        const type = typeof holiday.type === 'string' ? holiday.type : 'national';
        result[count++] = { date, name, type, source: 'tallyfy' };
    }

    result.length = count;
    return result;
}

// Bolt Optimization: Modify existing objects instead of creating new ones
// when merging holidays for the same date to reduce memory allocations.
function mergeHolidayLists(calendarificList, tallyfyList) {
    const byDate = new Map();

    for (let i = 0; i < tallyfyList.length; i++) {
        const item = tallyfyList[i];
        if (!byDate.has(item.date)) {
            byDate.set(item.date, item);
        }
    }

    for (let i = 0; i < calendarificList.length; i++) {
        const item = calendarificList[i];
        const existing = byDate.get(item.date);
        if (existing !== undefined) {
            existing.sourceAlt = existing.source;
            existing.source = item.source;
            existing.name = item.name;
            existing.type = item.type;
        } else {
            byDate.set(item.date, item);
        }
    }

    const result = new Array(byDate.size);
    let idx = 0;
    for (const value of byDate.values()) {
        result[idx++] = value;
    }

    result.sort((a, b) => {
        return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0);
    });

    return result;
}

export {
    DATE_REGEX,
    isValidISODateString,
    normalizeCalendarific,
    normalizeTallyfy,
    mergeHolidayLists
};
