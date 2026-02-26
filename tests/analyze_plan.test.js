const {
    REGIONS,
    toLocalISOString,
    setTestState,
    analyzeCurrentPlan
} = require('../public/app.js');

describe('analyzeCurrentPlan', () => {
    beforeEach(() => {
        setTestState(2023, REGIONS.ENGLAND_WALES, []);
    });

    test('returns empty array if no booked dates', () => {
        const blocks = analyzeCurrentPlan();
        expect(blocks).toEqual([]);
    });

    test('identifies single block of leave', () => {
        // Book Mon-Fri (May 15-19 2023)
        // Weekend before: May 13-14
        // Weekend after: May 20-21
        // Total off: May 13 - May 21 (9 days)
        setTestState(2023, REGIONS.ENGLAND_WALES, [], ['2023-05-15', '2023-05-16', '2023-05-17', '2023-05-18', '2023-05-19']);

        const blocks = analyzeCurrentPlan();
        expect(blocks).toHaveLength(1);
        const block = blocks[0];

        expect(block.leaveDays).toBe(5);
        expect(block.totalDays).toBe(9);
        expect(toLocalISOString(block.startDate)).toBe('2023-05-13');
        expect(toLocalISOString(block.endDate)).toBe('2023-05-21');
    });

    test('identifies multiple blocks sorted by duration', () => {
        // Block 1: 5 days leave -> 9 days off (May 15-19)
        // Block 2: 1 day leave -> 3 days off (June 2 Fri -> June 4 Sun)
        setTestState(2023, REGIONS.ENGLAND_WALES, [], [
            '2023-05-15', '2023-05-16', '2023-05-17', '2023-05-18', '2023-05-19',
            '2023-06-02'
        ]);

        const blocks = analyzeCurrentPlan();
        expect(blocks).toHaveLength(2);

        // Expect sorted by totalDays descending
        expect(blocks[0].totalDays).toBe(9);
        expect(blocks[1].totalDays).toBe(3);
    });

    test('handles holidays correctly', () => {
        // Easter 2023: Fri Apr 7, Mon Apr 10.
        // Book Apr 3-6 (Mon-Thu).
        // Off: Sat Apr 1 -> Mon Apr 10 (10 days).
        setTestState(2023, REGIONS.ENGLAND_WALES, [], ['2023-04-03', '2023-04-04', '2023-04-05', '2023-04-06']);

        const blocks = analyzeCurrentPlan();
        expect(blocks).toHaveLength(1);

        expect(blocks[0].leaveDays).toBe(4);
        expect(blocks[0].totalDays).toBe(10);
        expect(toLocalISOString(blocks[0].startDate)).toBe('2023-04-01');
        expect(toLocalISOString(blocks[0].endDate)).toBe('2023-04-10');
    });

    test('handles year boundaries correctly', () => {
        // Book Dec 28, 29 (Thu, Fri).
        // Jan 1 2024 is Monday (Holiday).
        // So off: Dec 28, 29, 30 (Sat), 31 (Sun).
        // analyzeCurrentPlan only looks at currentYear (2023) so it stops at Dec 31.

        setTestState(2023, REGIONS.ENGLAND_WALES, [], ['2023-12-28', '2023-12-29']);

        const blocks = analyzeCurrentPlan();
        expect(blocks).toHaveLength(1);

        // Should span Dec 28 to Dec 31 (4 days).
        expect(blocks[0].leaveDays).toBe(2);
        expect(blocks[0].totalDays).toBe(4);
        expect(toLocalISOString(blocks[0].startDate)).toBe('2023-12-28');
        expect(toLocalISOString(blocks[0].endDate)).toBe('2023-12-31');
    });
});
