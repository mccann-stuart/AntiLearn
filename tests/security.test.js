const { REGIONS, decodePlanString, encodePlanString } = require('../public/app.js');

describe('Security Vulnerability: decodePlanString Input Validation', () => {

    test('should validate structure of bookedDates', () => {
        const maliciousPayload = {
            currentAllowance: 25,
            currentYear: 2023,
            currentRegion: REGIONS.ENGLAND_WALES,
            bookedDates: [
                "2023-01-01",
                12345, // Not a string
                { bad: "object" }, // Not a string
                "<script>alert(1)</script>" // Potentially malicious string, though format check is better
            ],
            customHolidays: []
        };

        const encoded = encodePlanString(maliciousPayload);
        const decoded = decodePlanString(encoded);

        // Verify that invalid items (non-strings, bad formats, potential XSS) are filtered out.
        // We want to enforce that bookedDates contains ONLY valid date strings.
        const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
        const allValidDates = decoded.bookedDates.every(d => typeof d === 'string' && DATE_REGEX.test(d));
        expect(allValidDates).toBe(true);

        // Also verify that invalid items (like the script tag) were removed
        expect(decoded.bookedDates).not.toContain("<script>alert(1)</script>");
        expect(decoded.bookedDates).toContain("2023-01-01");
    });

    test('should validate structure of customHolidays', () => {
        const maliciousPayload = {
            currentAllowance: 25,
            currentYear: 2023,
            currentRegion: REGIONS.ENGLAND_WALES,
            bookedDates: [],
            customHolidays: [
                { date: "2023-01-01", name: "New Year" },
                { date: 123, name: "Invalid Date Type" }, // Invalid date type
                { date: "2023-01-02", name: { not: "a string" } }, // Invalid name type
                "Not an object", // Invalid item type
                { date: "2023-01-03" } // Missing name
            ]
        };

        const encoded = encodePlanString(maliciousPayload);
        const decoded = decodePlanString(encoded);

        // We want to enforce that customHolidays contains ONLY objects with string date and name
        const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
        const isValidHoliday = (h) =>
            typeof h === 'object' &&
            h !== null &&
            typeof h.date === 'string' &&
            DATE_REGEX.test(h.date) &&
            typeof h.name === 'string';

        const allValid = decoded.customHolidays.every(isValidHoliday);
        expect(allValid).toBe(true);
    });

    test('should truncate customHolidays list to 50 items', () => {
        const manyHolidays = Array.from({ length: 100 }, (_, i) => ({
            date: "2023-01-01",
            name: `Holiday ${i}`
        }));

        const payload = {
            currentAllowance: 25,
            currentYear: 2023,
            currentRegion: REGIONS.ENGLAND_WALES,
            bookedDates: [],
            customHolidays: manyHolidays
        };

        const encoded = encodePlanString(payload);
        const decoded = decodePlanString(encoded);

        expect(decoded.customHolidays.length).toBe(50);
        expect(decoded.customHolidays[0].name).toBe("Holiday 0");
        expect(decoded.customHolidays[49].name).toBe("Holiday 49");
    });

    test('should truncate bookedDates list to 1000 items', () => {
        const manyDates = Array.from({ length: 1500 }, () => "2023-01-01");

        const payload = {
            currentAllowance: 25,
            currentYear: 2023,
            currentRegion: REGIONS.ENGLAND_WALES,
            bookedDates: manyDates,
            customHolidays: []
        };

        const encoded = encodePlanString(payload);
        const decoded = decodePlanString(encoded);

        expect(decoded.bookedDates.length).toBe(1000);
    });

    test('should prevent DoS by rejecting encoded strings larger than 30000 characters', () => {
        const overlyLargeString = 'a'.repeat(30001);
        const decoded = decodePlanString(overlyLargeString);

        // We want to enforce a hard length limit to prevent memory/CPU exhaustion
        expect(decoded).toBeNull();
    });

    test('should ignore invalid keys in customHolidaysByLocation', () => {
        const payload = {
            currentAllowance: 25,
            currentYear: 2023,
            currentRegion: REGIONS.ENGLAND_WALES,
            bookedDates: [],
            customHolidaysByLocation: {
                [REGIONS.ENGLAND_WALES]: [{ date: "2023-01-01", name: "Valid" }],
                "invalid-region": [{ date: "2023-01-01", name: "Invalid" }],
                "__proto__": [{ date: "2023-01-01", name: "Proto" }]
            }
        };

        const encoded = encodePlanString(payload);
        const decoded = decodePlanString(encoded);

        const keys = Object.keys(decoded.customHolidaysByLocation);
        expect(keys).toContain(REGIONS.ENGLAND_WALES);
        expect(keys).not.toContain("invalid-region");
        expect(keys).not.toContain("__proto__");
    });
});
