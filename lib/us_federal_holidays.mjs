const US_FEDERAL_HOLIDAY_SOURCE = 'calculated';

function toUtcIsoDate(date) {
    return date.toISOString().slice(0, 10);
}

function observedDate(year, month, day) {
    const date = new Date(Date.UTC(year, month, day));
    const dayOfWeek = date.getUTCDay();

    if (dayOfWeek === 6) {
        date.setUTCDate(date.getUTCDate() - 1);
    } else if (dayOfWeek === 0) {
        date.setUTCDate(date.getUTCDate() + 1);
    }

    return date;
}

function nthWeekdayOfMonth(year, month, dayOfWeek, occurrence) {
    const firstDay = new Date(Date.UTC(year, month, 1));
    const offset = (dayOfWeek - firstDay.getUTCDay() + 7) % 7;
    return new Date(Date.UTC(year, month, 1 + offset + ((occurrence - 1) * 7)));
}

function lastWeekdayOfMonth(year, month, dayOfWeek) {
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const offset = (lastDay.getUTCDay() - dayOfWeek + 7) % 7;
    lastDay.setUTCDate(lastDay.getUTCDate() - offset);
    return lastDay;
}

function createHoliday(date, name) {
    return {
        date: toUtcIsoDate(date),
        name,
        type: 'federal',
        source: US_FEDERAL_HOLIDAY_SOURCE
    };
}

/**
 * Returns the observed U.S. federal holidays that fall within a calendar year.
 * The following year's New Year's Day is included when its Friday observance
 * falls on 31 December, because the planner groups holidays by calendar date.
 */
function getUsFederalHolidays(year) {
    const candidates = [
        createHoliday(observedDate(year, 0, 1), "New Year's Day"),
        createHoliday(nthWeekdayOfMonth(year, 0, 1, 3), 'Birthday of Martin Luther King, Jr.'),
        createHoliday(nthWeekdayOfMonth(year, 1, 1, 3), "Washington's Birthday"),
        createHoliday(lastWeekdayOfMonth(year, 4, 1), 'Memorial Day'),
        createHoliday(observedDate(year, 5, 19), 'Juneteenth National Independence Day'),
        createHoliday(observedDate(year, 6, 4), 'Independence Day'),
        createHoliday(nthWeekdayOfMonth(year, 8, 1, 1), 'Labor Day'),
        createHoliday(nthWeekdayOfMonth(year, 9, 1, 2), 'Columbus Day'),
        createHoliday(observedDate(year, 10, 11), 'Veterans Day'),
        createHoliday(nthWeekdayOfMonth(year, 10, 4, 4), 'Thanksgiving Day'),
        createHoliday(observedDate(year, 11, 25), 'Christmas Day'),
        createHoliday(observedDate(year + 1, 0, 1), "New Year's Day")
    ];
    const yearPrefix = `${year}-`;

    return candidates
        .filter(holiday => holiday.date.startsWith(yearPrefix))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export { getUsFederalHolidays };
