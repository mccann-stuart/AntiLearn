/**
 * UK Public Holidays (England & Wales)
 * Source: gov.uk
 */
export const holidays = [
    // 2025
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-04-18', name: "Good Friday" },
    { date: '2025-04-21', name: "Easter Monday" },
    { date: '2025-05-05', name: "Early May Bank Holiday" },
    { date: '2025-05-26', name: "Spring Bank Holiday" },
    { date: '2025-08-25', name: "Summer Bank Holiday" },
    { date: '2025-12-25', name: "Christmas Day" },
    { date: '2025-12-26', name: "Boxing Day" },
    
    // 2026
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-04-03', name: "Good Friday" },
    { date: '2026-04-06', name: "Easter Monday" },
    { date: '2026-05-04', name: "Early May Bank Holiday" },
    { date: '2026-05-25', name: "Spring Bank Holiday" },
    { date: '2026-08-31', name: "Summer Bank Holiday" },
    { date: '2026-12-25', name: "Christmas Day" },
    { date: '2026-12-28', name: "Boxing Day (Substitute)" } 
];

export function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

export function isHoliday(date) {
    const dateString = date.toISOString().split('T')[0];
    return holidays.some(h => h.date === dateString);
}

export function getHolidayName(date) {
    const dateString = date.toISOString().split('T')[0];
    const holiday = holidays.find(h => h.date === dateString);
    return holiday ? holiday.name : null;
}
