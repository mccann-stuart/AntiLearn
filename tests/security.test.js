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
});
