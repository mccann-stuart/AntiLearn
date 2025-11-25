
// Helper to format date as YYYY-MM-DD using local time
function toLocalISOString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getEasterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function getUKHolidays(year) {
    const holidays = [];

    // 1. New Year's Day (Jan 1)
    let newYear = new Date(year, 0, 1);
    if (newYear.getDay() === 0) newYear = new Date(year, 0, 2); // Sun -> Mon
    else if (newYear.getDay() === 6) newYear = new Date(year, 0, 3); // Sat -> Mon
    holidays.push({ date: toLocalISOString(newYear), name: "New Year's Day" });

    // 2. Good Friday (Easter - 2)
    const easter = getEasterDate(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays.push({ date: toLocalISOString(goodFriday), name: "Good Friday" });

    // 3. Easter Monday (Easter + 1)
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays.push({ date: toLocalISOString(easterMonday), name: "Easter Monday" });

    // 4. Early May Bank Holiday (First Monday in May)
    let mayDay = new Date(year, 4, 1);
    while (mayDay.getDay() !== 1) {
        mayDay.setDate(mayDay.getDate() + 1);
    }
    holidays.push({ date: toLocalISOString(mayDay), name: "Early May Bank Holiday" });

    // 5. Spring Bank Holiday (Last Monday in May)
    let springBank = new Date(year, 4, 31);
    while (springBank.getDay() !== 1) {
        springBank.setDate(springBank.getDate() - 1);
    }
    holidays.push({ date: toLocalISOString(springBank), name: "Spring Bank Holiday" });

    // 6. Summer Bank Holiday (Last Monday in August)
    let summerBank = new Date(year, 7, 31);
    while (summerBank.getDay() !== 1) {
        summerBank.setDate(summerBank.getDate() - 1);
    }
    holidays.push({ date: toLocalISOString(summerBank), name: "Summer Bank Holiday" });

    // 7. Christmas Day (Dec 25)
    let xmas = new Date(year, 11, 25);
    let xmasSub = null;
    if (xmas.getDay() === 6) xmasSub = new Date(year, 11, 27);
    else if (xmas.getDay() === 0) xmasSub = new Date(year, 11, 27);

    if (xmasSub) {
        holidays.push({ date: toLocalISOString(xmasSub), name: "Christmas Day (Substitute)" });
    } else {
        holidays.push({ date: toLocalISOString(xmas), name: "Christmas Day" });
    }

    // 8. Boxing Day (Dec 26)
    let boxing = new Date(year, 11, 26);
    let boxingSub = null;
    if (boxing.getDay() === 6) boxingSub = new Date(year, 11, 28);
    else if (boxing.getDay() === 0) boxingSub = new Date(year, 11, 28);

    if (boxingSub) {
        holidays.push({ date: toLocalISOString(boxingSub), name: "Boxing Day (Substitute)" });
    } else {
        holidays.push({ date: toLocalISOString(boxing), name: "Boxing Day" });
    }

    return holidays;
}

const holidaysCache = new Map();

function getHolidaysForYear(year) {
    if (!holidaysCache.has(year)) {
        holidaysCache.set(year, getUKHolidays(year));
    }
    return holidaysCache.get(year);
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function isHoliday(date) {
    const year = date.getFullYear();
    const holidays = getHolidaysForYear(year);
    const dateString = toLocalISOString(date);
    return holidays.some(h => h.date === dateString);
}

function getDayType(date) {
    if (isHoliday(date)) return 'holiday';
    if (isWeekend(date)) return 'weekend';
    return 'workday';
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function calculateContinuousLeave(startDate, leaveDaysToUse) {
    let leaveDaysBooked = [];
    let current = new Date(startDate);
    let daysCounted = 0;

    // Find consecutive workdays
    while (getDayType(current) !== 'workday') {
        current = addDays(current, 1);
    }

    while (daysCounted < leaveDaysToUse) {
        if (getDayType(current) === 'workday') {
            leaveDaysBooked.push(new Date(current));
            daysCounted++;
        }
        current = addDays(current, 1);
    }

    if (leaveDaysBooked.length === 0) return null;

    const firstBookedDay = leaveDaysBooked[0];
    const lastBookedDay = leaveDaysBooked[leaveDaysBooked.length - 1];

    // Expand backwards
    let rangeStart = new Date(firstBookedDay);
    while (true) {
        const prevDay = addDays(rangeStart, -1);
        if (getDayType(prevDay) !== 'workday') {
            rangeStart = prevDay;
        } else {
            break;
        }
    }

    // Expand forwards
    let rangeEnd = new Date(lastBookedDay);
    while (true) {
        const nextDay = addDays(rangeEnd, 1);
        if (getDayType(nextDay) !== 'workday') {
            rangeEnd = nextDay;
        } else {
            break;
        }
    }

    const totalDaysOff = (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24) + 1;

    return {
        startDate: rangeStart,
        endDate: rangeEnd,
        leaveDaysUsed: leaveDaysToUse,
        totalDaysOff: Math.round(totalDaysOff),
        efficiency: totalDaysOff / leaveDaysToUse,
        bookedDates: leaveDaysBooked
    };
}

function findOptimalPlan(year, allowance) {
    const candidates = [];
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    // 1. Generate all reasonable candidates (blocks of 3 to 12 leave days)
    let current = new Date(startOfYear);
    while (current <= endOfYear) {
        if (getDayType(current) === 'workday') {
            const maxChunk = Math.min(allowance, 12);
            for (let i = 3; i <= maxChunk; i++) {
                const result = calculateContinuousLeave(current, i);
                if (result) {
                    candidates.push(result);
                }
            }
        }
        current = addDays(current, 1);
    }

    // Deduplicate candidates
    const uniqueCandidates = [];
    const seen = new Set();
    candidates.forEach(c => {
        const key = `${c.startDate.toISOString()}-${c.endDate.toISOString()}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueCandidates.push(c);
        }
    });

    // Sort by efficiency desc
    uniqueCandidates.sort((a, b) => b.efficiency - a.efficiency);

    // Limit to top 50
    const topCandidates = uniqueCandidates.slice(0, 50);

    // 2. Find best combination of 3 blocks
    let bestCombo = [];
    let maxDaysOff = 0;

    function overlap(b1, b2) {
        return b1.startDate <= b2.endDate && b1.endDate >= b2.startDate;
    }

    for (let i = 0; i < topCandidates.length; i++) {
        for (let j = i + 1; j < topCandidates.length; j++) {
            if (overlap(topCandidates[i], topCandidates[j])) continue;
            if (topCandidates[i].leaveDaysUsed + topCandidates[j].leaveDaysUsed > allowance) continue;

            for (let k = j + 1; k < topCandidates.length; k++) {
                const c1 = topCandidates[i];
                const c2 = topCandidates[j];
                const c3 = topCandidates[k];

                if (overlap(c2, c3) || overlap(c1, c3)) continue;

                const totalLeave = c1.leaveDaysUsed + c2.leaveDaysUsed + c3.leaveDaysUsed;
                if (totalLeave <= allowance) {
                    const totalOff = c1.totalDaysOff + c2.totalDaysOff + c3.totalDaysOff;
                    if (totalOff > maxDaysOff) {
                        maxDaysOff = totalOff;
                        bestCombo = [c1, c2, c3];
                    }
                }
            }
        }
    }

    if (bestCombo.length === 0) {
        for (let i = 0; i < topCandidates.length; i++) {
            for (let j = i + 1; j < topCandidates.length; j++) {
                const c1 = topCandidates[i];
                const c2 = topCandidates[j];
                if (!overlap(c1, c2) && (c1.leaveDaysUsed + c2.leaveDaysUsed <= allowance)) {
                    const totalOff = c1.totalDaysOff + c2.totalDaysOff;
                    if (totalOff > maxDaysOff) {
                        maxDaysOff = totalOff;
                        bestCombo = [c1, c2];
                    }
                }
            }
        }
    }

    // If still empty, try 1
    if (bestCombo.length === 0 && topCandidates.length > 0) {
        if (topCandidates[0].leaveDaysUsed <= allowance) {
            bestCombo = [topCandidates[0]];
        }
    }

    bestCombo.sort((a, b) => a.startDate - b.startDate);
    return bestCombo;
}

const result = findOptimalPlan(2025, 25);
console.log("Total leave days used:", result.reduce((sum, b) => sum + b.leaveDaysUsed, 0));
console.log("Total days off:", result.reduce((sum, b) => sum + b.totalDaysOff, 0));
console.log("Blocks:", result.map(b => ({
    start: b.startDate.toISOString().split('T')[0],
    end: b.endDate.toISOString().split('T')[0],
    leaveUsed: b.leaveDaysUsed,
    daysOff: b.totalDaysOff
})));
