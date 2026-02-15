const { decodePlanString, encodePlanString } = require('../public/app.js');

describe('Security Vulnerability: decodePlanString Input Validation', () => {

    test('should validate structure of bookedDates', () => {
        const maliciousPayload = {
            currentAllowance: 25,
            currentYear: 2023,
            currentRegion: 'england-wales',
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

        // BEFORE FIX: The non-string items would be present
        // AFTER FIX: We expect only valid strings (maybe even valid date strings) or an empty array if invalid

        // For now, let's just log what we get to confirm behavior
        // console.log('Decoded bookedDates:', decoded.bookedDates);

        // We want to enforce that bookedDates contains ONLY strings
        const allStrings = decoded.bookedDates.every(d => typeof d === 'string');
        expect(allStrings).toBe(true);
    });

    test('should validate structure of customHolidays', () => {
        const maliciousPayload = {
            currentAllowance: 25,
            currentYear: 2023,
            currentRegion: 'england-wales',
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

        // console.log('Decoded customHolidays:', decoded.customHolidays);

        // We want to enforce that customHolidays contains ONLY objects with string date and name
        const isValidHoliday = (h) =>
            typeof h === 'object' &&
            h !== null &&
            typeof h.date === 'string' &&
            typeof h.name === 'string';

        const allValid = decoded.customHolidays.every(isValidHoliday);
        expect(allValid).toBe(true);
    });
});
