
const { decodePlanString } = require('../public/app.js');

describe('Security Fixes', () => {
    // Helper to manually create an encoded string from an object without using the app's encoder
    // because we need to test specific JSON strings that might not be easily created via JSON.stringify
    const encodeManual = (jsonStr) => {
        return Buffer.from(jsonStr).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    };

    test('sanitizeHolidayMap should prevent __proto__ pollution', () => {
        // Construct a payload with __proto__ key
        const jsonStr = '{"customHolidaysByLocation": {"__proto__": [{"date": "2025-01-01", "name": "Polluted"}]}}';
        const encoded = encodeManual(jsonStr);

        const decoded = decodePlanString(encoded);
        const result = decoded.customHolidaysByLocation;

        // Expect __proto__ to be filtered out as an own property
        expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false);

        // Expect prototype to remain Object.prototype (not Array)
        // If pollution occurred, the prototype would be the array from the payload
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    });

    test('sanitizeHolidayMap should prevent constructor pollution', () => {
        // Construct a payload with constructor key
        const jsonStr = '{"customHolidaysByLocation": {"constructor": [{"date": "2025-01-01", "name": "Polluted"}]}}';
        const encoded = encodeManual(jsonStr);

        const decoded = decodePlanString(encoded);
        const result = decoded.customHolidaysByLocation;

        // Expect constructor to be filtered out
        expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false);
    });

    test('sanitizeHolidayMap should prevent prototype pollution', () => {
        // Construct a payload with prototype key
        const jsonStr = '{"customHolidaysByLocation": {"prototype": [{"date": "2025-01-01", "name": "Polluted"}]}}';
        const encoded = encodeManual(jsonStr);

        const decoded = decodePlanString(encoded);
        const result = decoded.customHolidaysByLocation;

        // Expect prototype to be filtered out
        expect(Object.prototype.hasOwnProperty.call(result, 'prototype')).toBe(false);
    });

    test('decodePlanString should prevent prototype pollution via currentWeekendPattern', () => {
        // Construct a payload where currentWeekendPattern is __proto__
        const jsonStr = '{"currentWeekendPattern": "__proto__"}';
        const encoded = encodeManual(jsonStr);

        const decoded = decodePlanString(encoded);

        // It should reject '__proto__' and fall back to null
        expect(decoded.currentWeekendPattern).toBe(null);
    });

    test('isDatasetLocation should prevent prototype pollution via location', () => {
        const app = require('../public/app.js');
        expect(() => {
            app.setTestState(2023, '__proto__', [], [], '__proto__', 25);
            app.isWeekend(new Date('2023-01-01'));
        }).not.toThrow();
    });
});
