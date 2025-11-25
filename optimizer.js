import { isWeekend, isHoliday } from './holidays.js';

export function getDayType(date) {
    if (isHoliday(date)) return 'holiday';
    if (isWeekend(date)) return 'weekend';
    return 'workday';
}

export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function getDatesInRange(startDate, endDate) {
    const dates = [];
    let current = new Date(startDate);
    while (current <= endDate) {
        dates.push(new Date(current));
        current = addDays(current, 1);
    }
    return dates;
}

export function calculateContinuousLeave(startDate, leaveDaysToUse) {
    // 1. Identify the specific workdays we are booking off
    let leaveDaysBooked = [];
    let current = new Date(startDate);
    let daysCounted = 0;

    // Find the 'leaveDaysToUse' consecutive workdays starting from startDate
    // If startDate is not a workday, move to next workday
    while (getDayType(current) !== 'workday') {
        current = addDays(current, 1);
    }

    // Now collect the workdays
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

    // 2. Expand backwards from the first booked day
    let rangeStart = new Date(firstBookedDay);
    while (true) {
        const prevDay = addDays(rangeStart, -1);
        if (getDayType(prevDay) !== 'workday') {
            rangeStart = prevDay;
        } else {
            break;
        }
    }

    // 3. Expand forwards from the last booked day
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

export function findOptimalBlocks(year, allowance) {
    const candidates = [];
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    // Iterate through every day of the year
    let current = new Date(startOfYear);
    while (current <= endOfYear) {
        // Only start looking from workdays to avoid duplicates/inefficiency
        if (getDayType(current) === 'workday') {
            // Try taking chunks of leave from 1 day up to a reasonable max (e.g. 10 days or allowance)
            // We limit to 9 days (taking a full week + 4 days = 9 days = 16 days off potentially) to keep it snappy
            // and because "blocks" usually imply a week or so.
            const maxChunk = Math.min(allowance, 12);

            for (let i = 1; i <= maxChunk; i++) {
                const result = calculateContinuousLeave(current, i);
                if (result) {
                    candidates.push(result);
                }
            }
        }
        current = addDays(current, 1);
    }

    // Sort by Efficiency (desc) then Total Days Off (desc)
    candidates.sort((a, b) => {
        if (b.efficiency !== a.efficiency) {
            return b.efficiency - a.efficiency;
        }
        return b.totalDaysOff - a.totalDaysOff;
    });

    // Filter overlapping
    const selectedBlocks = [];

    for (const candidate of candidates) {
        if (selectedBlocks.length >= 3) break;

        let overlaps = false;
        for (const selected of selectedBlocks) {
            if (candidate.startDate <= selected.endDate && candidate.endDate >= selected.startDate) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps) {
            selectedBlocks.push(candidate);
        }
    }

    return selectedBlocks;
}
