const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isValidISODateString(dateStr) {
    if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) return false;
    const year = (dateStr.charCodeAt(0) - 48) * 1000 + (dateStr.charCodeAt(1) - 48) * 100 + (dateStr.charCodeAt(2) - 48) * 10 + (dateStr.charCodeAt(3) - 48);
    const month = (dateStr.charCodeAt(5) - 48) * 10 + (dateStr.charCodeAt(6) - 48);
    const day = (dateStr.charCodeAt(8) - 48) * 10 + (dateStr.charCodeAt(9) - 48);
    if (year < 1000 || month < 1 || month > 12 || day < 1) return false;
    const monthLengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day <= monthLengths[month - 1];
}

function normalizeCalendarific(holidays) {
    if (!Array.isArray(holidays)) return [];
    return holidays
        .map(holiday => {
            const dateIso = holiday && holiday.date ? holiday.date.iso : null;
            const date = typeof dateIso === 'string' ? dateIso.slice(0, 10) : null;
            if (!isValidISODateString(date)) return null;
            const name = typeof holiday.name === 'string' ? holiday.name : 'Holiday';
            const type = Array.isArray(holiday.type)
                ? holiday.type[0]
                : (typeof holiday.type === 'string' ? holiday.type : 'national');
            return { date, name, type, source: 'calendarific' };
        })
        .filter(Boolean);
}

function normalizeTallyfy(holidays) {
    if (!Array.isArray(holidays)) return [];
    return holidays
        .map(holiday => {
            const date = holiday && typeof holiday.date === 'string' ? holiday.date : null;
            if (!isValidISODateString(date)) return null;
            const name = typeof holiday.name === 'string' ? holiday.name : 'Holiday';
            const type = typeof holiday.type === 'string' ? holiday.type : 'national';
            return { date, name, type, source: 'tallyfy' };
        })
        .filter(Boolean);
}

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
            byDate.set(item.date, {
                date: item.date,
                name: item.name,
                type: item.type,
                source: item.source,
                sourceAlt: existing.source
            });
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
