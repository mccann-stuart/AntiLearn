const {
    normalizeCalendarific,
    normalizeTallyfy,
    mergeHolidayLists
} = require('../scripts/update_holidays');

describe('Holiday Data Normalization', () => {
    describe('normalizeCalendarific', () => {
        test('should return empty array for null or non-array input', () => {
            expect(normalizeCalendarific(null)).toEqual([]);
            expect(normalizeCalendarific(undefined)).toEqual([]);
            expect(normalizeCalendarific({})).toEqual([]);
        });

        test('should normalize valid holiday objects', () => {
            const input = [
                {
                    date: { iso: '2025-01-01T00:00:00Z' },
                    name: 'New Year',
                    type: ['National holiday']
                },
                {
                    date: { iso: '2025-12-25' },
                    name: 'Christmas',
                    type: 'Religious'
                }
            ];
            const expected = [
                { date: '2025-01-01', name: 'New Year', type: 'National holiday', source: 'calendarific' },
                { date: '2025-12-25', name: 'Christmas', type: 'Religious', source: 'calendarific' }
            ];
            expect(normalizeCalendarific(input)).toEqual(expected);
        });

        test('should filter out invalid dates', () => {
            const input = [
                { date: { iso: 'invalid-date' }, name: 'Bad Date' },
                { date: null, name: 'No Date' },
                { date: { iso: '2025-01-01' }, name: 'Good Date' } // valid
            ];
            const expected = [
                { date: '2025-01-01', name: 'Good Date', type: 'national', source: 'calendarific' }
            ];
            expect(normalizeCalendarific(input)).toEqual(expected);
        });

        test('should handle missing name or type with defaults', () => {
            const input = [
                { date: { iso: '2025-05-01' } }
            ];
            const expected = [
                { date: '2025-05-01', name: 'Holiday', type: 'national', source: 'calendarific' }
            ];
            expect(normalizeCalendarific(input)).toEqual(expected);
        });
    });

    describe('normalizeTallyfy', () => {
        test('should return empty array for null or non-array input', () => {
            expect(normalizeTallyfy(null)).toEqual([]);
            expect(normalizeTallyfy(undefined)).toEqual([]);
        });

        test('should normalize valid holiday objects', () => {
            const input = [
                { date: '2025-01-01', name: 'New Year', type: 'National' }
            ];
            const expected = [
                { date: '2025-01-01', name: 'New Year', type: 'National', source: 'tallyfy' }
            ];
            expect(normalizeTallyfy(input)).toEqual(expected);
        });

        test('should filter out invalid dates', () => {
             const input = [
                { date: 'invalid', name: 'Bad Date' },
                { date: '2025-01-01', name: 'Good Date' }
            ];
            const expected = [
                { date: '2025-01-01', name: 'Good Date', type: 'national', source: 'tallyfy' }
            ];
            expect(normalizeTallyfy(input)).toEqual(expected);
        });
    });

    describe('mergeHolidayLists', () => {
        test('should merge non-overlapping lists and sort by date', () => {
            const list1 = [{ date: '2025-01-01', name: 'A', source: 's1' }];
            const list2 = [{ date: '2025-01-02', name: 'B', source: 's2' }];
            const merged = mergeHolidayLists(list1, list2);
            expect(merged).toHaveLength(2);
            expect(merged[0].date).toBe('2025-01-01');
            expect(merged[1].date).toBe('2025-01-02');
        });

        test('should prefer first list (Calendarific) for overlaps', () => {
            const list1 = [{ date: '2025-01-01', name: 'A', source: 's1' }];
            const list2 = [{ date: '2025-01-01', name: 'B', source: 's2' }];
            const merged = mergeHolidayLists(list1, list2);
            expect(merged).toHaveLength(1);
            expect(merged[0].name).toBe('A');
            expect(merged[0].source).toBe('s1');
            expect(merged[0].sourceAlt).toBe('s2');
        });

        test('should handle empty lists', () => {
            const list1 = [{ date: '2025-01-01', name: 'A' }];
            expect(mergeHolidayLists(list1, [])).toEqual(list1);
            expect(mergeHolidayLists([], list1)).toEqual(list1);
            expect(mergeHolidayLists([], [])).toEqual([]);
        });
    });
});
