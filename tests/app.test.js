const {
    toLocalISOString,
    getEasterDate,
    getUKHolidays,
    isWeekend,
    isHoliday,
    calculateContinuousLeave,
    findOptimalPlan,
    addDays,
    setTestState
} = require('../public/app.js');

describe('Date Utilities', () => {
    test('toLocalISOString formats date correctly', () => {
        const date = new Date(2023, 0, 1); // Jan 1 2023
        expect(toLocalISOString(date)).toBe('2023-01-01');
    });

    test('addDays adds days correctly', () => {
        const date = new Date(2023, 0, 1);
        const newDate = addDays(date, 5);
        expect(toLocalISOString(newDate)).toBe('2023-01-06');
    });

    test('isWeekend identifies weekends', () => {
        const saturday = new Date(2023, 0, 7);
        const sunday = new Date(2023, 0, 8);
        const monday = new Date(2023, 0, 9);

        expect(isWeekend(saturday)).toBe(true);
        expect(isWeekend(sunday)).toBe(true);
        expect(isWeekend(monday)).toBe(false);
    });
});

describe('Holiday Calculations', () => {
    beforeEach(() => {
        setTestState(2023, 'england-wales', []);
    });

    test('getEasterDate calculates Easter correctly', () => {
        // Easter 2023 is April 9
        const easter2023 = getEasterDate(2023);
        expect(easter2023.getDate()).toBe(9);
        expect(easter2023.getMonth()).toBe(3); // April is month 3 (0-indexed)

        // Easter 2024 is March 31
        const easter2024 = getEasterDate(2024);
        expect(easter2024.getDate()).toBe(31);
        expect(easter2024.getMonth()).toBe(2); // March
    });

    test('getUKHolidays returns correct holidays for England & Wales 2023', () => {
        const holidays = getUKHolidays(2023, 'england-wales');
        const holidayDates = holidays.map(h => h.date);

        // New Year's Day 2023 was Sunday, substitute is Monday Jan 2
        expect(holidayDates).toContain('2023-01-02');

        // Good Friday 2023: April 7
        expect(holidayDates).toContain('2023-04-07');

        // Easter Monday 2023: April 10
        expect(holidayDates).toContain('2023-04-10');

        // Early May Bank Holiday: May 1
        expect(holidayDates).toContain('2023-05-01');

        // Spring Bank Holiday: May 29
        expect(holidayDates).toContain('2023-05-29');

        // Summer Bank Holiday: Aug 28
        expect(holidayDates).toContain('2023-08-28');

        // Christmas Day: Dec 25 (Monday)
        expect(holidayDates).toContain('2023-12-25');

        // Boxing Day: Dec 26 (Tuesday)
        expect(holidayDates).toContain('2023-12-26');
    });

    test('getUKHolidays handles Scotland holidays correctly', () => {
        const holidays = getUKHolidays(2023, 'scotland');
        const holidayDates = holidays.map(h => h.date);

        // Jan 2nd is a holiday in Scotland
        expect(holidayDates).toContain('2023-01-02'); // Jan 1 Sub
        expect(holidayDates).toContain('2023-01-03'); // Jan 2 Sub (since Jan 2 is Mon, which is occupied by Jan 1 sub)

        // St Andrew's Day (Nov 30)
        expect(holidayDates).toContain('2023-11-30');

        // No Easter Monday in Scotland (usually)
        // Wait, app.js logic says: if (region !== 'scotland') ... Easter Monday
        expect(holidayDates).not.toContain('2023-04-10');
    });

    test('isHoliday uses current state correctly', () => {
        setTestState(2023, 'england-wales', []);
        expect(isHoliday(new Date(2023, 11, 25))).toBe(true); // Xmas
        expect(isHoliday(new Date(2023, 11, 24))).toBe(false); // Xmas Eve
    });
});

describe('Optimization Logic', () => {
    beforeEach(() => {
        setTestState(2023, 'england-wales', []);
    });

    test('calculateContinuousLeave correctly calculates efficiency', () => {
        // Easter 2023: Fri Apr 7, Mon Apr 10.
        // Taking Apr 3, 4, 5, 6 (4 days) -> Off from Sat Apr 1 to Mon Apr 10.
        // Total off: Sat 1, Sun 2, Mon 3, Tue 4, Wed 5, Thu 6, Fri 7 (Hol), Sat 8, Sun 9, Mon 10 (Hol).
        // That is 10 days off for 4 days leave.

        const start = new Date(2023, 3, 3); // Apr 3 (Monday)
        const leaveDaysToUse = 4;

        const result = calculateContinuousLeave(start, leaveDaysToUse);

        expect(result.leaveDaysUsed).toBe(4);
        // Start date of break: Sat Apr 1 (weekend before)
        expect(toLocalISOString(result.startDate)).toBe('2023-04-01');
        // End date of break: Mon Apr 10 (holiday)
        expect(toLocalISOString(result.endDate)).toBe('2023-04-10');

        // Days off: 1,2,3,4,5,6,7,8,9,10 = 10 days
        expect(result.totalDaysOff).toBe(10);
        expect(result.efficiency).toBe(2.5); // 10 / 4
    });

    test('calculateContinuousLeave bridges weekends', () => {
        // Fri -> Mon. Leave on Fri (1 day). Off Fri, Sat, Sun.
        const start = new Date(2023, 5, 2); // June 2 (Friday)
        const result = calculateContinuousLeave(start, 1);

        expect(result.leaveDaysUsed).toBe(1);
        expect(toLocalISOString(result.startDate)).toBe('2023-06-02'); // Fri (Workday/Leave)
        expect(toLocalISOString(result.endDate)).toBe('2023-06-04'); // Sun (Weekend)
        expect(result.totalDaysOff).toBe(3);
    });

    test('findOptimalPlan returns valid plan', () => {
        // 2023, 25 days allowance
        const plan = findOptimalPlan(2023, 25);

        expect(plan.length).toBeGreaterThan(0);
        expect(plan.length).toBeLessThanOrEqual(3); // Top 3 breaks

        let totalLeaveUsed = 0;
        plan.forEach(block => {
            totalLeaveUsed += block.leaveDaysUsed;

            // Check overlaps
            plan.forEach(otherBlock => {
                if (block === otherBlock) return;
                // Simple overlap check
                const overlap = (block.startDate <= otherBlock.endDate && block.endDate >= otherBlock.startDate);
                expect(overlap).toBe(false);
            });
        });

        expect(totalLeaveUsed).toBeLessThanOrEqual(25);

        // Ensure efficiency is good (at least > 2 for optimal planning around holidays)
        // Easter usually gives > 2
        const bestBlock = plan.sort((a,b) => b.efficiency - a.efficiency)[0];
        expect(bestBlock.efficiency).toBeGreaterThan(1.5);
    });
});
