const {
    decodePlanString,
    encodePlanString,
    setTestState,
    REGIONS
} = require('../public/app.js');

describe('decodePlanString Defaults and Recovery', () => {
    // Helper to easily create an encoded string from an object
    const encode = (obj) => encodePlanString(obj);

    test('Partial Data: uses global state defaults when fields are missing', () => {
        // Set specific global state
        setTestState(2025, REGIONS.SCOTLAND, [], [], 'sat-sun', 20);

        // Payload missing top-level fields
        const payload = {};
        const encoded = encode(payload);
        const decoded = decodePlanString(encoded);

        expect(decoded).not.toBeNull();
        expect(decoded.currentYear).toBe(2025);
        expect(decoded.currentRegion).toBe(REGIONS.SCOTLAND);
        expect(decoded.currentAllowance).toBe(20);
        expect(decoded.currentWeekendPattern).toBeNull(); // Missing in payload -> null
        expect(decoded.bookedDates).toEqual([]);
        expect(decoded.customHolidays).toEqual([]);
    });

    test('Invalid Data Types: falls back to global state', () => {
        setTestState(2024, REGIONS.ENGLAND_WALES, [], [], 'sat-sun', 25);

        const payload = {
            currentAllowance: "twenty-five", // String instead of number
            currentYear: "2024",           // String instead of number
            currentRegion: 123             // Number instead of string
        };
        const encoded = encode(payload);
        const decoded = decodePlanString(encoded);

        expect(decoded.currentAllowance).toBe(25);
        expect(decoded.currentYear).toBe(2024);
        expect(decoded.currentRegion).toBe(REGIONS.ENGLAND_WALES);
    });

    test('Invalid Values: falls back to global state for out-of-range allowance', () => {
        setTestState(2024, REGIONS.ENGLAND_WALES, [], [], 'sat-sun', 25);

        // Case 1: Negative
        let encoded = encode({ currentAllowance: -5 });
        let decoded = decodePlanString(encoded);
        expect(decoded.currentAllowance).toBe(25);

        // Case 2: > 365
        encoded = encode({ currentAllowance: 400 });
        decoded = decodePlanString(encoded);
        expect(decoded.currentAllowance).toBe(25);

        // Case 3: 0 (allowance must be > 0 per code logic)
        // Code: obj.currentAllowance > 0
        encoded = encode({ currentAllowance: 0 });
        decoded = decodePlanString(encoded);
        expect(decoded.currentAllowance).toBe(25);
    });

    test('Weekend Pattern: validates against presets', () => {
        // Valid
        let encoded = encode({ currentWeekendPattern: 'fri-sat' });
        let decoded = decodePlanString(encoded);
        expect(decoded.currentWeekendPattern).toBe('fri-sat');

        // Invalid
        encoded = encode({ currentWeekendPattern: 'invalid-pattern' });
        decoded = decodePlanString(encoded);
        expect(decoded.currentWeekendPattern).toBeNull();
    });

    test('Sanitization: Booked Dates filters invalid entries', () => {
        const payload = {
            bookedDates: [
                "2023-01-01",      // Valid
                "invalid-date",    // Invalid format
                12345,             // Invalid type
                null,              // Invalid type
                "2023/01/01",      // Invalid format (must be YYYY-MM-DD)
                "2023-1-1"         // Invalid format (must be padded)
            ]
        };
        const encoded = encode(payload);
        const decoded = decodePlanString(encoded);

        expect(decoded.bookedDates).toHaveLength(1);
        expect(decoded.bookedDates[0]).toBe("2023-01-01");
    });

    test('Sanitization: Custom Holidays filters invalid objects', () => {
        const payload = {
            customHolidays: [
                { date: "2023-05-01", name: "May Day" }, // Valid
                { date: "invalid", name: "Bad Date" },   // Invalid date
                { date: "2023-05-02" },                  // Missing name
                { name: "No Date" },                     // Missing date
                "Not an object",                         // Invalid type
                null,                                    // Invalid type
                { date: "2023-05-03", name: "A".repeat(101) } // Name too long
            ]
        };
        const encoded = encode(payload);
        const decoded = decodePlanString(encoded);

        expect(decoded.customHolidays).toHaveLength(1);
        expect(decoded.customHolidays[0]).toEqual({ date: "2023-05-01", name: "May Day" });
    });

    test('Sanitization: Custom Holidays By Location', () => {
        const payload = {
            customHolidaysByLocation: {
                "england-wales": [
                    { date: "2023-08-28", name: "Summer Bank Holiday" } // Valid
                ],
                "scotland": [
                    { date: "bad-date", name: "Invalid" } // Invalid list item
                ],
                "invalid-key-type": "not-an-array" // Invalid value type
            }
        };
        const encoded = encode(payload);
        const decoded = decodePlanString(encoded);

        expect(decoded.customHolidaysByLocation).toHaveProperty('england-wales');
        expect(decoded.customHolidaysByLocation['england-wales']).toHaveLength(1);

        // "scotland" has invalid items, so sanitizeHolidayList returns [],
        // and sanitizeHolidayMap only adds keys if list.length > 0
        expect(decoded.customHolidaysByLocation).not.toHaveProperty('scotland');

        expect(decoded.customHolidaysByLocation).not.toHaveProperty('invalid-key-type');
    });

    test('Resilience: Handles non-object JSON gracefully', () => {
        // Manually create a base64 string for "123" (valid JSON, but not an object)
        const padded = Buffer.from("123").toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const decoded = decodePlanString(padded);
        expect(decoded).toBeNull();
    });
});
