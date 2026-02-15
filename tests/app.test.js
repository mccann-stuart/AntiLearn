const {
    toLocalISOString,
    getEasterDate,
    getUKHolidays,
    isWeekend,
    isHoliday,
    calculateContinuousLeave,
    findOptimalPlan,
    addDays,
    setTestState,
    getDayInsight,
    getYearComparison,
    getEfficiencyTier,
    encodePlanString,
    decodePlanString
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
        expect(holidayDates).not.toContain('2023-04-10');
    });

    test('getUKHolidays handles Northern Ireland holidays correctly', () => {
        const holidays = getUKHolidays(2023, 'northern-ireland');
        const holidayDates = holidays.map(h => h.date);

        // St Patrick's Day (Mar 17)
        expect(holidayDates).toContain('2023-03-17');

        // Orangemen's Day (July 12)
        expect(holidayDates).toContain('2023-07-12');
    });

    test('Substitute holidays logic for Christmas/Boxing Day on weekends', () => {
        // 2021: Xmas (Sat), Boxing (Sun).
        // Xmas Sub -> Mon Dec 27.
        // Boxing Sub -> Tue Dec 28.
        const holidays2021 = getUKHolidays(2021, 'england-wales');
        const dates2021 = holidays2021.map(h => h.date);

        expect(dates2021).toContain('2021-12-27'); // Xmas Sub
        expect(dates2021).toContain('2021-12-28'); // Boxing Sub

        // 2022: Xmas (Sun), Boxing (Mon).
        // Xmas Sub -> Tue Dec 27.
        // Boxing Day -> Mon Dec 26.
        const holidays2022 = getUKHolidays(2022, 'england-wales');
        const dates2022 = holidays2022.map(h => h.date);

        expect(dates2022).toContain('2022-12-26'); // Boxing Day
        expect(dates2022).toContain('2022-12-27'); // Xmas Sub
    });

    test('isHoliday uses current state correctly', () => {
        setTestState(2023, 'england-wales', []);
        expect(isHoliday(new Date(2023, 11, 25))).toBe(true); // Xmas
        expect(isHoliday(new Date(2023, 11, 24))).toBe(false); // Xmas Eve
    });

    test('Leap year handling (Feb 29)', () => {
        // 2024 is a leap year. Feb 29 exists.
        const leapDay = new Date(2024, 1, 29);
        expect(leapDay.getDate()).toBe(29);
        expect(leapDay.getMonth()).toBe(1); // Feb

        // 2023 is not a leap year. Feb 29 becomes Mar 1.
        const notLeapDay = new Date(2023, 1, 29);
        expect(notLeapDay.getMonth()).toBe(2); // Mar
        expect(notLeapDay.getDate()).toBe(1);
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
        const bestBlock = plan.sort((a, b) => b.efficiency - a.efficiency)[0];
        expect(bestBlock.efficiency).toBeGreaterThan(1.5);
    });

    test('findOptimalPlan works with small allowances', () => {
        const planOneDay = findOptimalPlan(2023, 1);
        expect(planOneDay.length).toBeGreaterThan(0);
        expect(planOneDay[0].leaveDaysUsed).toBeLessThanOrEqual(1);

        const planTwoDays = findOptimalPlan(2023, 2);
        expect(planTwoDays.length).toBeGreaterThan(0);
        const totalLeaveUsed = planTwoDays.reduce((sum, block) => sum + block.leaveDaysUsed, 0);
        expect(totalLeaveUsed).toBeLessThanOrEqual(2);
    });
});

describe('Smart Insights', () => {
    beforeEach(() => {
        setTestState(2023, 'england-wales', []);
    });

    test('getEfficiencyTier buckets correctly', () => {
        expect(getEfficiencyTier(3.5)).toBe('high');
        expect(getEfficiencyTier(2.1)).toBe('mid');
        expect(getEfficiencyTier(1.4)).toBe('low');
    });

    test('getDayInsight detects bridge day with custom holiday', () => {
        setTestState(2023, 'england-wales', [{ date: '2023-07-06', name: 'Custom Break' }]); // Thursday
        const insight = getDayInsight(new Date(2023, 6, 7)); // Friday between holiday and weekend
        expect(insight).not.toBeNull();
        expect(insight.bridge).toBe(true);
        expect(insight.efficiency).toBeGreaterThan(1);
    });

    test('heatmap efficiency updates when a neighboring day is booked', () => {
        setTestState(2023, 'england-wales', [], []);
        const target = new Date(2023, 1, 10); // Fri Feb 10 2023
        const baseInsight = getDayInsight(target);
        expect(baseInsight).not.toBeNull();

        setTestState(2023, 'england-wales', [], ['2023-02-09']); // Thu Feb 9 2023
        const updatedInsight = getDayInsight(target);
        expect(updatedInsight).not.toBeNull();
        expect(updatedInsight.efficiency).not.toBe(baseInsight.efficiency);
        expect(updatedInsight.efficiency).toBeGreaterThan(baseInsight.efficiency);
    });

    test('getYearComparison provides comparative data', () => {
        const comparison = getYearComparison(2023, 5);
        expect(comparison.currentYear).toBe(2023);
        expect(comparison.previousYear).toBe(2022);
        expect(comparison.currentBest).toBeGreaterThan(0);
        expect(comparison.previousBest).toBeGreaterThan(0);
    });

    test('Optimization considers custom holidays', () => {
        // Add a custom holiday on a Wednesday.
        // If we take Thu/Fri off, we get Wed-Sun off (5 days).
        setTestState(2023, 'england-wales', [{ date: '2023-06-07', name: 'My Birthday' }]); // Wed June 7

        // Check if June 7 is treated as a holiday
        expect(isHoliday(new Date(2023, 5, 7))).toBe(true);

        const result = calculateContinuousLeave(new Date(2023, 5, 8), 2); // Start Thu June 8, use 2 days (Thu, Fri)

        expect(result.leaveDaysUsed).toBe(2);
        expect(toLocalISOString(result.startDate)).toBe('2023-06-07'); // Starts on the holiday
        expect(toLocalISOString(result.endDate)).toBe('2023-06-11'); // Ends on Sunday
        expect(result.totalDaysOff).toBe(5);
    });
});

describe('Shareable Links', () => {
    test('encodePlanString and decodePlanString round-trip correctly', () => {
        const payload = {
            currentAllowance: 15,
            currentYear: 2025,
            currentRegion: 'scotland',
            bookedDates: ['2025-06-01', '2025-06-02'],
            customHolidays: [{ date: '2025-06-05', name: 'Test Holiday' }]
        };

        const encoded = encodePlanString(payload);
        expect(typeof encoded).toBe('string');

        const decoded = decodePlanString(encoded);
        expect(decoded).not.toBeNull();
        expect(decoded.currentAllowance).toBe(payload.currentAllowance);
        expect(decoded.currentYear).toBe(payload.currentYear);
        expect(decoded.currentRegion).toBe(payload.currentRegion);
        expect(decoded.bookedDates).toEqual(payload.bookedDates);
        expect(decoded.customHolidays).toEqual(payload.customHolidays);
    });

    test('decodePlanString returns null on invalid input', () => {
        expect(decodePlanString('!not_base64')).toBeNull();
        expect(decodePlanString(null)).toBeNull();
    });

    test('decodePlanString returns null on invalid JSON syntax', () => {
        // "{"invalid": "json" - missing closing brace
        const invalidJsonBase64 = 'eyJpbnZhbGlkIjogImpzb24=';
        expect(decodePlanString(invalidJsonBase64)).toBeNull();
    });
});
