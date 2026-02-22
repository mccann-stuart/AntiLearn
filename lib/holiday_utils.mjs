const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function normalizeCalendarific(holidays) {
    if (!Array.isArray(holidays)) return [];
    return holidays
        .map(holiday => {
            const dateIso = holiday && holiday.date ? holiday.date.iso : null;
            const date = typeof dateIso === 'string' ? dateIso.slice(0, 10) : null;
            if (!date || !DATE_REGEX.test(date)) return null;
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
            if (!date || !DATE_REGEX.test(date)) return null;
            const name = typeof holiday.name === 'string' ? holiday.name : 'Holiday';
            const type = typeof holiday.type === 'string' ? holiday.type : 'national';
            return { date, name, type, source: 'tallyfy' };
        })
        .filter(Boolean);
}

function mergeHolidayLists(calendarificList, tallyfyList) {
    const byDate = new Map();

    tallyfyList.forEach(item => {
        if (!byDate.has(item.date)) {
            byDate.set(item.date, item);
        }
    });

    calendarificList.forEach(item => {
        if (byDate.has(item.date)) {
            const existing = byDate.get(item.date);
            byDate.set(item.date, { ...item, sourceAlt: existing.source });
        } else {
            byDate.set(item.date, item);
        }
    });

    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export {
    DATE_REGEX,
    normalizeCalendarific,
    normalizeTallyfy,
    mergeHolidayLists
};
