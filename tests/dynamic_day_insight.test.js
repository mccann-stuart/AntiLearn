const {
    getDayInsight,
    setTestState
} = require('../public/app.js');

describe('Dynamic Day Insight Calculation', () => {
    // Reset state before each test
    beforeEach(() => {
        setTestState(2023, 'england-wales', [], []);
    });

    test('should identify a bridge day between two booked days', () => {
        // Scenario: Mon booked, Wed booked. Check Tue.
        // Mon Jan 9 (Booked), Tue Jan 10 (Target), Wed Jan 11 (Booked)
        // This creates a block of Mon-Wed (3 days).

        const booked = ['2023-01-09', '2023-01-11'];
        setTestState(2023, 'england-wales', [], booked);

        const target = new Date(2023, 0, 10); // Tue Jan 10
        const insight = getDayInsight(target);

        expect(insight).not.toBeNull();
        expect(insight.bridge).toBe(true);
        // Block: Sat 7, Sun 8, Mon 9, Tue 10, Wed 11 => 5 days off.
        // Leave used: 1 (Tue).
        expect(insight.totalDaysOff).toBe(5);
        expect(insight.efficiency).toBe(5);
    });

    test('should calculate efficiency when extending a booked block', () => {
        // Scenario: Mon booked. Check Tue.
        // Mon Jan 9 (Booked), Tue Jan 10 (Target)
        // Block: Sat 7, Sun 8, Mon 9, Tue 10. => 4 days off.
        // Leave used: 1 (Tue).

        const booked = ['2023-01-09'];
        setTestState(2023, 'england-wales', [], booked);

        const target = new Date(2023, 0, 10); // Tue Jan 10
        const insight = getDayInsight(target);

        expect(insight).not.toBeNull();
        expect(insight.bridge).toBe(false); // Only connected on one side (Mon)
        expect(insight.totalDaysOff).toBe(4);
        expect(insight.efficiency).toBe(4);
    });

    test('should correctly identify bridge with a weekend', () => {
        // Scenario: Fri booked. Check Mon.
        // Fri June 2 (Booked), Sat 3 (Weekend), Sun 4 (Weekend), Mon 5 (Target)
        // Block: Fri 2, Sat 3, Sun 4, Mon 5 => 4 days off.

        const booked = ['2023-06-02']; // Fri June 2
        setTestState(2023, 'england-wales', [], booked);

        const target = new Date(2023, 5, 5); // Mon June 5
        const insight = getDayInsight(target);

        // Previous day (Sun June 4) is off (weekend).
        // Next day (Tue June 6) is workday.
        // Is it a bridge? Bridge is defined as: prev is off AND next is off.
        // Prev is Sun (off). Next is Tue (on). So bridge is false.

        expect(insight.bridge).toBe(false);

        // However, totalDaysOff should include Fri, Sat, Sun, Mon.
        expect(insight.totalDaysOff).toBe(4);
        expect(insight.efficiency).toBe(4);
    });

    test('should recalculate when a booked day is removed', () => {
        // Start with Mon booked, Wed booked. Tue is bridge.
        const booked = ['2023-01-09', '2023-01-11'];
        setTestState(2023, 'england-wales', [], booked);

        let insight = getDayInsight(new Date(2023, 0, 10));
        expect(insight.bridge).toBe(true);

        // Remove Wed booking.
        const newBooked = ['2023-01-09'];
        setTestState(2023, 'england-wales', [], newBooked);

        insight = getDayInsight(new Date(2023, 0, 10));
        // Now it's just extending Mon. Next day (Wed) is workday.
        expect(insight.bridge).toBe(false);
        expect(insight.totalDaysOff).toBe(4); // Sat-Tue
    });

    test('should handle bridging across custom holidays', () => {
        // Custom holiday on Wed. Book Mon. Check Tue.
        // Mon Jan 9 (Booked), Tue Jan 10 (Target), Wed Jan 11 (Custom Holiday)
        // Thu Jan 12 (Workday).

        const booked = ['2023-01-09'];
        const custom = [{ date: '2023-01-11', name: 'My Holiday' }];
        setTestState(2023, 'england-wales', custom, booked);

        const target = new Date(2023, 0, 10);
        const insight = getDayInsight(target);

        // Prev: Mon (Booked/Off). Next: Wed (Holiday/Off).
        expect(insight.bridge).toBe(true);

        // Block: Sat 7, Sun 8, Mon 9, Tue 10, Wed 11. => 5 days.
        expect(insight.totalDaysOff).toBe(5);
    });
});
