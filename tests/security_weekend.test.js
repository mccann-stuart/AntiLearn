const { decodePlanString, encodePlanString } = require('../public/app.js');

describe('Security Fixes: Prototype Pollution in WEEKEND_PRESETS', () => {
    // Helper to manually create an encoded string from an object without using the app's encoder
    // because we need to test specific JSON strings that might not be easily created via JSON.stringify
    const encodeManual = (jsonStr) => {
        return Buffer.from(jsonStr).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    };

    test('getWeekendPreset should prevent prototype pollution (constructor)', () => {
        // Construct a payload with constructor key
        const jsonStr = '{"currentWeekendPattern": "constructor"}';
        const encoded = encodeManual(jsonStr);

        const decoded = decodePlanString(encoded);
        const result = decoded.currentWeekendPattern;

        // Expect constructor to be filtered out (meaning it falls back to default/null)
        expect(result).toBeNull();
    });

    test('getWeekendPreset should prevent prototype pollution (__proto__)', () => {
        // Construct a payload with __proto__ key
        const jsonStr = '{"currentWeekendPattern": "__proto__"}';
        const encoded = encodeManual(jsonStr);

        const decoded = decodePlanString(encoded);
        const result = decoded.currentWeekendPattern;

        // Expect __proto__ to be filtered out
        expect(result).toBeNull();
    });
});
