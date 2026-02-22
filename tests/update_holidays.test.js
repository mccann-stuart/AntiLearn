let normalizeCalendarific;
let normalizeTallyfy;
let mergeHolidayLists;
let buildHolidayDataset;

beforeAll(async () => {
    const mod = await import('../scripts/update_holidays.mjs');
    ({
        normalizeCalendarific,
        normalizeTallyfy,
        mergeHolidayLists,
        buildHolidayDataset
    } = mod);
});

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
                { date: { iso: '2025-01-01' }, name: 'Good Date' }
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

describe('update_holidays.mjs', () => {
    let originalConsoleError;
    let originalFetch;
    let consoleErrorMock;
    let originalEnvValues;
    const apiKeyEnvKeys = [
        'calendarific',
        'CALENDARIFIC_API_KEY',
        'CALENDARIFIC_KEY',
        'CALENDARIFIC'
    ];

    beforeEach(() => {
        consoleErrorMock = jest.fn();
        originalConsoleError = console.error;
        console.error = consoleErrorMock;

        originalFetch = global.fetch;
        global.fetch = jest.fn();

        originalEnvValues = {};
        apiKeyEnvKeys.forEach((key) => {
            originalEnvValues[key] = process.env[key];
            process.env[key] = 'secret-api-key-123';
        });
    });

    afterEach(() => {
        console.error = originalConsoleError;
        global.fetch = originalFetch;
        apiKeyEnvKeys.forEach((key) => {
            if (typeof originalEnvValues[key] === 'undefined') {
                delete process.env[key];
            } else {
                process.env[key] = originalEnvValues[key];
            }
        });
    });

    test('buildHolidayDataset should redact API key from error logs when fetch fails', async () => {
        const apiKey = 'secret-api-key-123';
        const leakedUrl = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=QA&year=2024`;

        global.fetch.mockImplementation(() => {
            return Promise.reject(new Error(`Request to ${leakedUrl} failed`));
        });

        await buildHolidayDataset();

        expect(consoleErrorMock).toHaveBeenCalled();

        const errorCalls = consoleErrorMock.mock.calls.map(args => args.join(' '));
        const combinedErrors = errorCalls.join('\n');

        expect(combinedErrors).toContain('REDACTED');
        expect(combinedErrors).not.toContain(apiKey);
    });

    test('buildHolidayDataset should redact API key even if error object string conversion leaks it', async () => {
        const apiKey = 'secret-api-key-123';

        const errorWithSecret = {
            toString: () => `Error: Failed to fetch ${apiKey}`
        };

        global.fetch.mockImplementation(() => {
            return Promise.reject(errorWithSecret);
        });

        await buildHolidayDataset();

        const errorCalls = consoleErrorMock.mock.calls.map(args => args.join(' '));
        const combinedErrors = errorCalls.join('\n');

        expect(combinedErrors).toContain('REDACTED');
        expect(combinedErrors).not.toContain(apiKey);
    });
});
